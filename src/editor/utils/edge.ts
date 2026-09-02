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

export interface EdgeIndex {
  /** Source node ids of every edge targeting a node, in edge order */
  incoming: Map<string, string[]>;
  /** Edges leaving a node, in edge order */
  outgoing: Map<string, Edge[]>;
  /** Memoized `collectAncestorIds` results for this edges array */
  ancestors: Map<string, string[]>;
}

const indexByEdges = new WeakMap<Edge[], EdgeIndex>();

/**
 * Adjacency index of an edges array, memoized by array reference — React Flow
 * keeps that reference stable between unrelated updates (drag, selection,
 * measurement), so per-node/per-edge store selectors get O(1) lookups instead
 * of scanning every edge on every store change.
 */
export const getEdgeIndex = (edges: Edge[]): EdgeIndex => {
  const cached = indexByEdges.get(edges);
  if (cached) {
    return cached;
  }

  const index: EdgeIndex = { ancestors: new Map(), incoming: new Map(), outgoing: new Map() };
  edges.forEach((edge) => {
    const sources = index.incoming.get(edge.target);
    if (sources) {
      sources.push(edge.source);
    } else {
      index.incoming.set(edge.target, [edge.source]);
    }
    const leaving = index.outgoing.get(edge.source);
    if (leaving) {
      leaving.push(edge);
    } else {
      index.outgoing.set(edge.source, [edge]);
    }
  });
  indexByEdges.set(edges, index);

  return index;
};

/**
 * Every node from which `nodeId` is reachable, following incoming edges
 * depth-first: direct sources come before their own ancestors, siblings in edge
 * order. Each ancestor is listed once — a global visited set makes the walk
 * linear in the graph size even when branches converge (a DAG with a shared
 * tail can hold an exponential number of distinct root paths).
 */
export const collectAncestorIds = (edges: Edge[], nodeId: string): string[] => {
  const index = getEdgeIndex(edges);
  const cached = index.ancestors.get(nodeId);
  if (cached) {
    return cached;
  }

  const { incoming } = index;
  const visited = new Set<string>([nodeId]);
  const ancestors: string[] = [];

  const visit = (current: string) => {
    (incoming.get(current) ?? []).forEach((source) => {
      if (visited.has(source)) {
        return;
      }
      visited.add(source);
      ancestors.push(source);
      visit(source);
    });
  };

  visit(nodeId);
  index.ancestors.set(nodeId, ancestors);

  return ancestors;
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

const selectedCountByNodes = new WeakMap<Node[], number>();

/**
 * Number of selected nodes, memoized by nodes array reference so every node's
 * "multi-selection" selector is an O(1) lookup instead of a scan of all nodes.
 */
export const getSelectedNodeCount = (nodes: Node[]): number => {
  const cached = selectedCountByNodes.get(nodes);
  if (cached !== undefined) {
    return cached;
  }
  const count = nodes.filter((node) => node.selected).length;
  selectedCountByNodes.set(nodes, count);

  return count;
};
