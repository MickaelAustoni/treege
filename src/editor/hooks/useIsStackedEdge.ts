import { useStore } from "@xyflow/react";
import { getPositions } from "@/editor/utils/stackPositionIndex";

/**
 * An edge is "stacked" when it connects two nodes that belong to the same
 * visual chain — i.e. the source has a linear child (position "first" or
 * "middle") and the target has a linear parent (position "middle" or "last").
 * Stacked edges are not rendered: their endpoints touch border-to-border in
 * the layout, making the line redundant.
 */
export const useIsStackedEdge = (source: string, target: string): boolean =>
  useStore((state) => {
    const positions = getPositions(state.edges);
    const sourcePosition = positions.get(source);
    const targetPosition = positions.get(target);
    const sourceHasLinearChild = sourcePosition === "first" || sourcePosition === "middle";
    const targetHasLinearParent = targetPosition === "middle" || targetPosition === "last";
    return sourceHasLinearChild && targetHasLinearParent;
  });
