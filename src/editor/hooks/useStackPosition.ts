import { useStore } from "@xyflow/react";
import { getPositions, StackPosition } from "@/editor/utils/stackPositionIndex";

export const useStackPosition = (nodeId: string): StackPosition => useStore((state) => getPositions(state.edges).get(nodeId) ?? "single");
