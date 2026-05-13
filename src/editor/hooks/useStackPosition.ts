import { useStore } from "@xyflow/react";
import { useShallow } from "zustand/react/shallow";
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
 * it. Uses a shallow equality selector so consumers only re-render when one of
 * the booleans actually flips, not on every edge mutation.
 */
export const useStackPosition = (nodeId: string): StackPositionInfo =>
  useStore(
    useShallow((state) => {
      const position = getPositions(state.edges).get(nodeId) ?? "single";
      return {
        isStackHead: position === "first" || position === "single",
        isStackMiddle: position === "middle",
        isStackSingle: position === "single",
        isStackTail: position === "last" || position === "single",
        position,
      };
    }),
  );
