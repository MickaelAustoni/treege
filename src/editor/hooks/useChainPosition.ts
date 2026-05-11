import { Edge, useStore } from "@xyflow/react";

export type ChainPosition = "single" | "first" | "middle" | "last";

const positionsByEdges = new WeakMap<Edge[], Map<string, ChainPosition>>();

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
 * Builds the chain positions in a single pass over the edges.
 *
 * - O(E) construction of the in/out adjacency Maps.
 * - O(N) classification of every connected node (N = distinct node ids in edges).
 */
const buildPositions = (edges: Edge[]): Map<string, ChainPosition> => {
  const outgoingCount = new Map<string, number>();
  const incomingCount = new Map<string, number>();
  const childOf = new Map<string, string>();
  const parentOf = new Map<string, string>();
  const connectedNodeIds = new Set<string>();
  const positions = new Map<string, ChainPosition>();

  edges.forEach((edge) => {
    outgoingCount.set(edge.source, (outgoingCount.get(edge.source) ?? 0) + 1);
    incomingCount.set(edge.target, (incomingCount.get(edge.target) ?? 0) + 1);
    childOf.set(edge.source, edge.target);
    parentOf.set(edge.target, edge.source);
    connectedNodeIds.add(edge.source);
    connectedNodeIds.add(edge.target);
  });

  connectedNodeIds.forEach((nodeId) => {
    const parentId = incomingCount.get(nodeId) === 1 ? parentOf.get(nodeId) : undefined;
    const childId = outgoingCount.get(nodeId) === 1 ? childOf.get(nodeId) : undefined;
    const stackWithParent = parentId !== undefined && outgoingCount.get(parentId) === 1;
    const stackWithChild = childId !== undefined && incomingCount.get(childId) === 1;
    positions.set(nodeId, resolveChainPosition(stackWithParent, stackWithChild));
  });

  return positions;
};

/**
 * Memoizes the positions map keyed by the edges array reference. React Flow
 * keeps that reference stable between unrelated updates (drag, selection, …),
 * so the selector becomes a simple Map lookup outside of edge mutations.
 */
const getPositions = (edges: Edge[]): Map<string, ChainPosition> => {
  const cached = positionsByEdges.get(edges);

  if (cached) {
    return cached;
  }

  const positions = buildPositions(edges);

  positionsByEdges.set(edges, positions);
  return positions;
};

export const useChainPosition = (nodeId: string): ChainPosition => useStore((state) => getPositions(state.edges).get(nodeId) ?? "single");

/**
 * Source→target is intra-chain iff source has a linear child (position
 * "first"/"middle") and target has a linear parent (position "middle"/"last").
 */
export const useIsIntraChainEdge = (source: string, target: string): boolean =>
  useStore((state) => {
    const positions = getPositions(state.edges);
    const sourcePosition = positions.get(source);
    const targetPosition = positions.get(target);
    const sourceHasLinearChild = sourcePosition === "first" || sourcePosition === "middle";
    const targetHasLinearParent = targetPosition === "middle" || targetPosition === "last";
    return sourceHasLinearChild && targetHasLinearParent;
  });
