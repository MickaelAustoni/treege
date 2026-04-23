import { Edge } from "@xyflow/react";

/**
 * Re-normalize outgoing edges from a set of affected parent nodes: if a parent
 * now has a single remaining child, convert its outgoing edge back to a
 * "default" type and drop condition-specific data fields.
 *
 * Used after edge or node deletions to keep conditional edges in sync with the
 * presence of siblings.
 *
 * @param edges - The edges remaining after deletion
 * @param affectedParents - Source node IDs whose children changed
 * @returns A new edges array with affected edges normalized
 */
export const normalizeConditionalEdges = (edges: Edge[], affectedParents: Set<string>): Edge[] => {
  if (affectedParents.size === 0) {
    return edges;
  }

  const childCount = new Map<string, number>();
  edges.forEach((edge) => {
    childCount.set(edge.source, (childCount.get(edge.source) ?? 0) + 1);
  });

  return edges.map((edge) => {
    if (!affectedParents.has(edge.source)) {
      return edge;
    }

    const siblingCount = childCount.get(edge.source) ?? 0;
    if (siblingCount !== 1) {
      return edge;
    }

    const { conditions: _dropConditions, isFallback: _dropFallback, ...rest } = edge.data ?? {};
    const cleaned = rest && Object.keys(rest).length > 0 ? rest : undefined;
    return { ...edge, data: cleaned, type: "default" };
  });
};
