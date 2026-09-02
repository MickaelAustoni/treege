import { FitViewOptions, Node, useReactFlow } from "@xyflow/react";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import useTranslate from "@/editor/hooks/useTranslate";
import type { Flow } from "@/shared/types/node";

/**
 * From this many nodes on, the initial flow is mounted progressively instead
 * of in one synchronous React commit (which paints nothing until every card
 * is rendered — tens of seconds on flows with hundreds of nodes).
 */
export const PROGRESSIVE_MOUNT_NODE_COUNT = 150;

/** Nodes added per frame. Small enough for each commit to stay well under a frame budget. */
const NODES_PER_STEP = 40;

/** Edges added per frame once every node is on the canvas. */
const EDGES_PER_STEP = 120;

/** How often the post-mount settle check samples node positions. */
const SETTLE_INTERVAL_MS = 250;

/** Positions unchanged for this many samples = the layout has settled. */
const SETTLE_STABLE_SAMPLES = 4;

/** Stop following the layout after this many samples (10 s) whatever happens. */
const SETTLE_MAX_SAMPLES = 40;

export const needsProgressiveMount = (flow: Flow | null | undefined): boolean => (flow?.nodes.length ?? 0) > PROGRESSIVE_MOUNT_NODE_COUNT;

/** Split a list into consecutive batches of `size`. */
const toBatches = <T,>(items: T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, index) => items.slice(index * size, (index + 1) * size));

/** Identity of the current node placement — changes whenever a node moves. */
const getPlacementSignature = (nodes: Node[]): string =>
  nodes.map((node) => `${node.id}:${Math.round(node.position.x)},${Math.round(node.position.y)}`).join("|");

const isFullyMeasured = (nodes: Node[]): boolean => nodes.every((node) => node.measured?.width && node.measured?.height);

/**
 * The mount lifecycle, one state per tick:
 * - `mount`: the remaining frame-sized batches to feed to the canvas;
 * - `settle`: everything is on the canvas, the viewport follows the layout
 *   until nodes hold still (`lastSignature` starts empty so the first sample
 *   always fits);
 * - `done`: nothing left to schedule.
 */
type Phase =
  | { kind: "mount"; steps: Array<() => void>; total: number }
  | { kind: "settle"; lastSignature: string; samples: number; stableSamples: number }
  | { kind: "done" };

const INITIAL_SETTLE: Phase = { kind: "settle", lastSignature: "", samples: 0, stableSamples: 0 };

/** Stable toast id: the loading toast is dismissed once the layout settles. */
const MOUNT_TOAST_ID = "treege-progressive-mount";

type ProgressiveMountProps = {
  /** The flow to mount. Only read once, on mount — like React Flow's `defaultNodes`. */
  flow: Flow;
  /**
   * Options of the `fitView` issued once the whole flow is on the canvas —
   * React Flow's own initial `fitView` only sees the (empty) initial nodes.
   */
  fitViewOptions?: FitViewOptions;
  /** Called once, when every node is mounted and the layout has settled. */
  onSettled?: () => void;
};

/**
 * Feeds a large flow to the canvas in frame-sized batches: nodes first (so the
 * tree appears and stays interactive while it grows), then edges (whose
 * endpoints are then guaranteed to exist). The editor mounts `<ReactFlow>` with
 * empty `defaultNodes`/`defaultEdges` when this listener is used.
 *
 * Implemented as a state machine: each `phase` schedules exactly one timer and
 * transitions to the next state, so unmounting (a closed dialog) cancels the
 * whole process through the effect cleanup alone.
 *
 * While the flow mounts and settles, a full-canvas overlay hides the
 * half-built tree behind a centered spinner with mount progress — the
 * finished, laid-out and fitted tree is revealed in one go. Mount it inside
 * `AutoLayout`.
 */
const ProgressiveMount = ({ flow, fitViewOptions, onSettled }: ProgressiveMountProps) => {
  // `flow` is read once here on purpose (mount semantics, like `defaultNodes`).
  const [phase, setPhase] = useState<Phase>(() => {
    const steps = [
      ...toBatches(flow.nodes, NODES_PER_STEP).map((batch) => () => addNodes(batch)),
      ...toBatches(flow.edges, EDGES_PER_STEP).map((batch) => () => addEdges(batch)),
    ];

    return { kind: "mount", steps, total: steps.length };
  });

  const { addNodes, addEdges, fitView, getNodes } = useReactFlow();
  const t = useTranslate();

  /**
   * Same feedback as a large JSON import: a loading toast while the tree is
   * being fed to the canvas, dismissed once the layout settles (or on unmount).
   */
  useEffect(() => {
    toast.loading(t("editor.progressiveMount.loading"), { duration: Number.POSITIVE_INFINITY, id: MOUNT_TOAST_ID });

    return () => {
      toast.dismiss(MOUNT_TOAST_ID);
    };
  }, [t]);

  // One timer per phase; the React Flow instance methods are stable and
  // `fitViewOptions` is a mount-only input, hence the `phase`-only deps.
  // biome-ignore lint/correctness/useExhaustiveDependencies: see above.
  useEffect(() => {
    if (phase.kind === "mount") {
      const step = phase.steps.at(0);
      const frame = requestAnimationFrame(() => {
        step?.();
        setPhase(step ? { kind: "mount", steps: phase.steps.slice(1), total: phase.total } : INITIAL_SETTLE);
      });

      return () => cancelAnimationFrame(frame);
    }

    if (phase.kind === "settle") {
      const timer = window.setTimeout(() => {
        const nodes = getNodes();
        const signature = getPlacementSignature(nodes);
        const moved = signature !== phase.lastSignature;
        const samples = phase.samples + 1;
        const stableSamples = moved ? 0 : phase.stableSamples + 1;
        const settled = (isFullyMeasured(nodes) && stableSamples >= SETTLE_STABLE_SAMPLES) || samples >= SETTLE_MAX_SAMPLES;

        if (moved) {
          void fitView(fitViewOptions);
        }
        if (settled) {
          toast.dismiss(MOUNT_TOAST_ID);
          onSettled?.();
        }
        setPhase(settled ? { kind: "done" } : { kind: "settle", lastSignature: signature, samples, stableSamples });
      }, SETTLE_INTERVAL_MS);

      return () => clearTimeout(timer);
    }

    return undefined;
  }, [phase]);

  if (phase.kind === "done") {
    return null;
  }

  const progress = phase.kind === "mount" ? Math.round(((phase.total - phase.steps.length) / phase.total) * 100) : 100;

  return (
    <div className="tg:absolute tg:inset-0 tg:z-10 tg:flex tg:items-center tg:justify-center tg:bg-background">
      <div className="tg:flex tg:items-center tg:gap-3">
        <Loader2 className="tg:size-5 tg:animate-spin" />
        <span className="tg:text-muted-foreground tg:text-sm">{`${t("editor.progressiveMount.loading")} ${progress}%`}</span>
      </div>
    </div>
  );
};

export default ProgressiveMount;
