import { FitViewOptions, Node, useReactFlow } from "@xyflow/react";
import { useEffect, useState } from "react";
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
  | { kind: "mount"; steps: Array<() => void> }
  | { kind: "settle"; lastSignature: string; samples: number; stableSamples: number }
  | { kind: "done" };

const INITIAL_SETTLE: Phase = { kind: "settle", lastSignature: "", samples: 0, stableSamples: 0 };

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
 * Renders nothing — mount it inside `<ReactFlow>` alongside the canvas, like
 * `AutoLayout`.
 */
const ProgressiveMount = ({ flow, fitViewOptions, onSettled }: ProgressiveMountProps) => {
  const { addNodes, addEdges, fitView, getNodes } = useReactFlow();

  // `flow` is read once here on purpose (mount semantics, like `defaultNodes`).
  const [phase, setPhase] = useState<Phase>(() => ({
    kind: "mount",
    steps: [
      ...toBatches(flow.nodes, NODES_PER_STEP).map((batch) => () => addNodes(batch)),
      ...toBatches(flow.edges, EDGES_PER_STEP).map((batch) => () => addEdges(batch)),
    ],
  }));

  // One timer per phase; the React Flow instance methods are stable and
  // `fitViewOptions` is a mount-only input, hence the `phase`-only deps.
  // biome-ignore lint/correctness/useExhaustiveDependencies: see above.
  useEffect(() => {
    if (phase.kind === "mount") {
      const step = phase.steps.at(0);
      const frame = requestAnimationFrame(() => {
        step?.();
        setPhase(step ? { kind: "mount", steps: phase.steps.slice(1) } : INITIAL_SETTLE);
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
          onSettled?.();
        }
        setPhase(settled ? { kind: "done" } : { kind: "settle", lastSignature: signature, samples, stableSamples });
      }, SETTLE_INTERVAL_MS);

      return () => clearTimeout(timer);
    }

    return undefined;
  }, [phase]);

  return null;
};

export default ProgressiveMount;
