import { useNodesInitialized, useReactFlow, useStore } from "@xyflow/react";
import { useEffect } from "react";
import { getLayoutedElements, LayoutOptions } from "@/editor/utils/dagreLayout";

/**
 * Produces a stable string signature of every node's measured dimensions.
 * Used as a dependency so the layout only re-runs when a node actually
 * changes size (e.g., adding an option expands its height).
 */
const selectSizeSignature = (state: { nodeLookup: Map<string, { id: string; measured?: { width?: number; height?: number } }> }) =>
  Array.from(state.nodeLookup.values())
    .map((node) => `${node.id}:${node.measured?.width ?? 0}x${node.measured?.height ?? 0}`)
    .join("|");

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
const useAutoLayout = ({ direction, horizontalSpacing, verticalSpacing }: LayoutOptions = {}) => {
  const { getNodes, getEdges, setNodes } = useReactFlow();
  const initialized = useNodesInitialized();
  const sizeSignature = useStore(selectSizeSignature);

  /**
   *  Re-runs whenever `sizeSignature` changes — i.e. any node's measured
   *  width/height has updated (e.g. a new option was added and the node grew).
   *  Dagre recomputes positions from the current nodes/edges and `setNodes`
   *  applies them. Calling `setNodes` does not alter measured sizes, so the
   *  signature stays stable and the effect does not loop.
   */
  useEffect(() => {
    if (!(initialized && sizeSignature)) {
      return;
    }

    const laidOutNodes = getLayoutedElements(getNodes(), getEdges(), { direction, horizontalSpacing, verticalSpacing });
    setNodes(laidOutNodes);
  }, [initialized, sizeSignature, direction, horizontalSpacing, verticalSpacing, getNodes, getEdges, setNodes]);
};

export default useAutoLayout;
