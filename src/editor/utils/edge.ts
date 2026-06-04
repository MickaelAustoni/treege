import { Edge, Node } from "@xyflow/react";

/**
 * Whether an edge from `source` to `target` already exists in the set.
 * Used to reject duplicate connections.
 */
export const edgeExists = (edges: Edge[], source: string, target: string): boolean =>
  edges.some((edge) => edge.source === source && edge.target === target);

type LeafNode = Pick<Node, "id" | "position" | "parentId">;

interface BuildConvergenceOptions {
  /** ID for the new common node. */
  commonNodeId: string;
  /** Base node template the common node is spread from (e.g. DEFAULT_NODE). */
  baseNode: Partial<Node>;
  /** Measured node height, used to place the common node below both leaves. */
  nodeHeight: number;
  /** Vertical gap between the leaves and the common node. */
  verticalSpacing: number;
}

/**
 * Build the common node that converges two leaves, plus the two edges wiring
 * each leaf to it (`source → common`, `target → common`). The node is centered
 * horizontally between the leaves and placed one row below the lower one. It
 * inherits the group only when both leaves share the same `parentId`.
 *
 * Pure and deterministic — the caller supplies the new node id, base template
 * and measured dimensions — so it can be unit-tested without React Flow.
 */
export const buildConvergence = (
  sourceNode: LeafNode,
  targetNode: LeafNode,
  { commonNodeId, baseNode, nodeHeight, verticalSpacing }: BuildConvergenceOptions,
): { node: Node; edges: Edge[] } => {
  const node = {
    ...baseNode,
    id: commonNodeId,
    position: {
      x: (sourceNode.position.x + targetNode.position.x) / 2,
      y: Math.max(sourceNode.position.y, targetNode.position.y) + nodeHeight + verticalSpacing,
    },
    selected: true,
  } as Node;

  // Inherit the group only when both leaves share the same one.
  if (sourceNode.parentId && sourceNode.parentId === targetNode.parentId) {
    node.parentId = sourceNode.parentId;
  }

  const edges: Edge[] = [
    { id: `${sourceNode.id}-${commonNodeId}`, source: sourceNode.id, target: commonNodeId, type: "default" },
    { id: `${targetNode.id}-${commonNodeId}`, source: targetNode.id, target: commonNodeId, type: "default" },
  ];

  return { edges, node };
};

/**
 * Whether adding an edge `source` → `target` would introduce a cycle, i.e.
 * `target` can already reach `source` by following outgoing edges. BFS from
 * `target` over the existing edges; returns true as soon as `source` is found.
 */
export const wouldCreateCycle = (edges: Edge[], source: string, target: string): boolean => {
  if (source === target) {
    return true;
  }

  const outgoing = new Map<string, string[]>();

  edges.forEach((edge) => {
    const existing = outgoing.get(edge.source);
    if (existing) {
      existing.push(edge.target);
    } else {
      outgoing.set(edge.source, [edge.target]);
    }
  });

  const visited = new Set<string>();
  const queue = [target];

  while (queue.length > 0) {
    const current = queue.shift() as string;
    if (current === source) {
      return true;
    }
    if (visited.has(current)) {
      continue;
    }
    visited.add(current);
    const next = outgoing.get(current);
    if (next) {
      queue.push(...next);
    }
  }

  return false;
};

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
