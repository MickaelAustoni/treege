import { Edge } from "@xyflow/react";

export type ChainPosition = "single" | "first" | "middle" | "last";

const outgoingCount = (nodeId: string, edges: Edge[]): number => edges.filter((edge) => edge.source === nodeId).length;

const incomingCount = (nodeId: string, edges: Edge[]): number => edges.filter((edge) => edge.target === nodeId).length;

/**
 * Two nodes belong to the same visual chain when the parent has exactly one
 * outgoing edge and the child has exactly one incoming edge. Any fork (multiple
 * children) or join (multiple parents) breaks the chain.
 */
const isLinearLink = (sourceId: string, targetId: string, edges: Edge[]): boolean =>
  outgoingCount(sourceId, edges) === 1 && incomingCount(targetId, edges) === 1;

export const getChainPosition = (nodeId: string, edges: Edge[]): ChainPosition => {
  const incoming = edges.filter((edge) => edge.target === nodeId);
  const outgoing = edges.filter((edge) => edge.source === nodeId);
  const parentId = incoming.length === 1 ? incoming[0].source : null;
  const childId = outgoing.length === 1 ? outgoing[0].target : null;
  const stackWithParent = parentId !== null && outgoingCount(parentId, edges) === 1;
  const stackWithChild = childId !== null && incomingCount(childId, edges) === 1;

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

export const isIntraChainEdge = (sourceId: string, targetId: string, edges: Edge[]): boolean => isLinearLink(sourceId, targetId, edges);
