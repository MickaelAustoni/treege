import { Node, useNodesInitialized, useReactFlow, useStore } from "@xyflow/react";
import { useEffect } from "react";
import { getLayoutedElements, LayoutOptions } from "@/editor/utils/dagreLayout";

/**
 * Measurement batches land a few milliseconds apart while a large flow mounts;
 * coalescing them into one layout pass keeps the number of Dagre runs (and the
 * `setNodes` re-renders they trigger) proportional to user actions, not to the
 * number of nodes.
 */
export const LAYOUT_DEBOUNCE_MS = 80;

const signatureByNodes = new WeakMap<object, string>();

/**
 * Produces a stable string signature of every node's measured dimensions.
 * Used as a dependency so the layout only re-runs when a node actually
 * changes size (e.g., adding an option expands its height). Memoized by the
 * `nodes` array reference: the selector runs on every store update (pan,
 * selection, drag…) and must not rebuild the string each time.
 */
const selectSizeSignature = (state: {
  nodes: object;
  nodeLookup: Map<string, { id: string; measured?: { width?: number; height?: number } }>;
}) => {
  const cached = signatureByNodes.get(state.nodes);
  if (cached !== undefined) {
    return cached;
  }

  const signature = Array.from(state.nodeLookup.values())
    .map((node) => `${node.id}:${node.measured?.width ?? 0}x${node.measured?.height ?? 0}`)
    .join("|");
  signatureByNodes.set(state.nodes, signature);

  return signature;
};

/** True when Dagre left every node where it already is — applying it would only cause re-renders. */
const isSamePlacement = (current: Node[], laidOut: Node[]): boolean =>
  current.length === laidOut.length &&
  laidOut.every((node, index) => {
    const previous = current[index];
    return previous.id === node.id && previous.position.x === node.position.x && previous.position.y === node.position.y;
  });

/**
 * Keeps the flow laid out automatically using Dagre.
 *
 * Runs once all nodes have been measured, then re-runs whenever any node's
 * measured size changes. Positions computed by Dagre replace the current
 * `position` of each node — manual repositioning is therefore overridden,
 * which is the expected behavior for a decision-tree editor where topology
 * drives layout.
 *
 * Group children are laid out independently within their parent, preserving
 * React Flow's parent-relative coordinate system.
 */
const AutoLayout = ({ direction, horizontalSpacing, verticalSpacing }: LayoutOptions = {}) => {
  const { getNodes, getEdges, setNodes } = useReactFlow();
  const initialized = useNodesInitialized();
  const sizeSignature = useStore(selectSizeSignature);

  /**
   *  Re-runs whenever `sizeSignature` changes — i.e. any node's measured
   *  width/height has updated (e.g. a new option was added and the node grew).
   *  Dagre recomputes positions from the current nodes/edges and `setNodes`
   *  applies them — unless nothing moved, in which case the store is left
   *  untouched so the flow does not re-render for nothing.
   */
  useEffect(() => {
    if (!(initialized && sizeSignature)) {
      return undefined;
    }

    const timer = setTimeout(() => {
      const current = getNodes();
      const laidOutNodes = getLayoutedElements(current, getEdges(), { direction, horizontalSpacing, verticalSpacing });
      if (!isSamePlacement(current, laidOutNodes)) {
        setNodes(laidOutNodes);
      }
    }, LAYOUT_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [initialized, sizeSignature, direction, horizontalSpacing, verticalSpacing, getNodes, getEdges, setNodes]);

  return null;
};

export default AutoLayout;
