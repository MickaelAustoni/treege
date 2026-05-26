import { Edge, useEdges } from "@xyflow/react";
import { createContext, PropsWithChildren, useContext, useMemo } from "react";

export type ChainPosition = "single" | "first" | "middle" | "last";

interface ChainIndex {
  positions: Map<string, ChainPosition>;
}

const EMPTY_INDEX: ChainIndex = { positions: new Map() };

const ChainIndexContext = createContext<ChainIndex>(EMPTY_INDEX);

const resolveChainPosition = (stackWithParent: boolean, stackWithChild: boolean): ChainPosition => {
  if (stackWithParent && stackWithChild) {
    return "middle";
  }
  if (stackWithParent) {
    return "last";
  }
  if (stackWithChild) {
    return "first";
  }
  return "single";
};

/**
 * Builds the chain index in a single pass over the edges.
 *
 * - O(E) construction of the in/out adjacency Maps.
 * - O(N) classification of every connected node (where N = distinct node ids in edges).
 * - All later lookups (`useChainPosition`, `useIsIntraChainEdge`) are O(1).
 */
const buildChainIndex = (edges: Edge[]): ChainIndex => {
  const outgoingCount = new Map<string, number>();
  const incomingCount = new Map<string, number>();
  const childOf = new Map<string, string>();
  const parentOf = new Map<string, string>();
  const connectedNodeIds = new Set<string>();

  edges.forEach((edge) => {
    outgoingCount.set(edge.source, (outgoingCount.get(edge.source) ?? 0) + 1);
    incomingCount.set(edge.target, (incomingCount.get(edge.target) ?? 0) + 1);
    childOf.set(edge.source, edge.target);
    parentOf.set(edge.target, edge.source);
    connectedNodeIds.add(edge.source);
    connectedNodeIds.add(edge.target);
  });

  const positions = new Map<string, ChainPosition>();
  connectedNodeIds.forEach((nodeId) => {
    const parentId = incomingCount.get(nodeId) === 1 ? parentOf.get(nodeId) : undefined;
    const childId = outgoingCount.get(nodeId) === 1 ? childOf.get(nodeId) : undefined;
    const stackWithParent = parentId !== undefined && outgoingCount.get(parentId) === 1;
    const stackWithChild = childId !== undefined && incomingCount.get(childId) === 1;
    positions.set(nodeId, resolveChainPosition(stackWithParent, stackWithChild));
  });

  return { positions };
};

export const ChainIndexProvider = ({ children }: PropsWithChildren) => {
  const edges = useEdges();
  const value = useMemo(() => buildChainIndex(edges), [edges]);
  return <ChainIndexContext.Provider value={value}>{children}</ChainIndexContext.Provider>;
};

export const useChainPosition = (nodeId: string): ChainPosition => {
  const { positions } = useContext(ChainIndexContext);
  return positions.get(nodeId) ?? "single";
};

/**
 * Source→target is intra-chain iff source has a linear child (position
 * "first"/"middle") and target has a linear parent (position "middle"/"last").
 * Two O(1) lookups in the precomputed positions map.
 */
export const useIsIntraChainEdge = (source: string, target: string): boolean => {
  const { positions } = useContext(ChainIndexContext);
  const sourcePosition = positions.get(source);
  const targetPosition = positions.get(target);
  const sourceHasLinearChild = sourcePosition === "first" || sourcePosition === "middle";
  const targetHasLinearParent = targetPosition === "middle" || targetPosition === "last";
  return sourceHasLinearChild && targetHasLinearParent;
};
