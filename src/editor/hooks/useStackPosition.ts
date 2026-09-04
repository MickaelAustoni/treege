import { useStore } from "@xyflow/react";
import { getPositions, StackPosition } from "@/editor/utils/stackPositionIndex";

export type StackPositionInfo = {
  position: StackPosition;
  isStackHead: boolean;
  isStackTail: boolean;
  isStackMiddle: boolean;
  isStackSingle: boolean;
};

/**
 * Returns the stack position of `nodeId` plus convenience booleans derived from
 * it. The store selector returns the position string itself (a primitive), so
 * consumers only re-render when the position actually changes — and the store
 * compares a string, not an object, on every update.
 */
export const useStackPosition = (nodeId: string): StackPositionInfo => {
  const position = useStore((state) => getPositions(state.edges).get(nodeId) ?? "single");

  return {
    isStackHead: position === "first" || position === "single",
    isStackMiddle: position === "middle",
    isStackSingle: position === "single",
    isStackTail: position === "last" || position === "single",
    position,
  };
};
