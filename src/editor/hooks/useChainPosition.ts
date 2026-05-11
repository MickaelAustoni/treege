import { useEdges } from "@xyflow/react";
import { useMemo } from "react";
import { ChainPosition, getChainPosition, isIntraChainEdge } from "@/editor/utils/chainPosition";

export const useChainPosition = (nodeId: string): ChainPosition => {
  const edges = useEdges();
  return useMemo(() => getChainPosition(nodeId, edges), [nodeId, edges]);
};

export const useIsIntraChainEdge = (sourceId: string, targetId: string): boolean => {
  const edges = useEdges();
  return useMemo(() => isIntraChainEdge(sourceId, targetId, edges), [sourceId, targetId, edges]);
};
