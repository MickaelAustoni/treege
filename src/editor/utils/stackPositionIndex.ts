import { Edge } from "@xyflow/react";

export type StackPosition = "single" | "first" | "middle" | "last";

const positionsByEdges = new WeakMap<Edge[], Map<string, StackPosition>>();

const resolvePosition = (stackWithParent: boolean, stackWithChild: boolean): StackPosition => {
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
 * Builds the stack positions in a single pass over the edges.
 *
 * - O(E) construction of the in/out adjacency Maps.
 * - O(N) classification of every connected node (N = distinct node ids in edges).
 */
const buildPositions = (edges: Edge[]): Map<string, StackPosition> => {
  const outgoingCount = new Map<string, number>();
  const incomingCount = new Map<string, number>();
  const childOf = new Map<string, string>();
  const parentOf = new Map<string, string>();
  const connectedNodeIds = new Set<string>();
  const positions = new Map<string, StackPosition>();

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
    positions.set(nodeId, resolvePosition(stackWithParent, stackWithChild));
  });

  return positions;
};

/**
 * Memoizes the positions map keyed by the edges array reference. React Flow
 * keeps that reference stable between unrelated updates (drag, selection, …),
 * so selectors that read from this map effectively perform a Map lookup
 * outside of edge mutations.
 */
export const getPositions = (edges: Edge[]): Map<string, StackPosition> => {
  const cached = positionsByEdges.get(edges);

  if (cached) {
    return cached;
  }

  const positions = buildPositions(edges);

  positionsByEdges.set(edges, positions);
  return positions;
};
