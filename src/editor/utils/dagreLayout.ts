import Dagre, { Graph } from "@dagrejs/dagre";
import { Edge, Node } from "@xyflow/react";
import { LAYOUT_DIRECTION, LAYOUT_HORIZONTAL_SPACING, LAYOUT_VERTICAL_SPACING } from "@/editor/constants/nodeSpacing";

export type LayoutDirection = "TB" | "LR";

export interface LayoutOptions {
  direction?: LayoutDirection;
  horizontalSpacing?: number;
  verticalSpacing?: number;
}

/**
 * Fallback sizes used when a node has not been measured yet by React Flow.
 */
const FALLBACK_NODE_WIDTH = 200;
const FALLBACK_NODE_HEIGHT = 100;

const isMeasured = (node: Node) => Boolean(node.measured?.width && node.measured?.height);

/**
 * Picks the node that will serve as the anchor to stabilize the layout.
 * For "TB" direction it's the one Dagre placed at the top (min y),
 * for "LR" it's the leftmost (min x). That node keeps its previous
 * position so the whole tree does not jump on every relayout.
 */
const findAnchor = (siblings: Node[], graph: Graph, direction: LayoutDirection) => {
  const axis = direction === "TB" ? "y" : "x";
  return siblings.reduce((anchor, node) => (graph.node(node.id)[axis] < graph.node(anchor.id)[axis] ? node : anchor), siblings[0]);
};

/**
 * Computes a layout scoped to a group of sibling nodes (same `parentId`).
 * Returns a map of `nodeId → new position` using React Flow's top-left convention.
 *
 * Dagre returns centered coordinates anchored at (0, 0); we translate the
 * whole result so the anchor node stays at its previous position. This keeps
 * user-placed trees visually stable across resizes and additions.
 */
const layoutSiblings = (siblings: Node[], edges: Edge[], config: Required<LayoutOptions>) => {
  const graph = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

  graph.setGraph({ nodesep: config.horizontalSpacing, rankdir: config.direction, ranksep: config.verticalSpacing });

  const siblingIds = new Set<string>();

  siblings.forEach((node) => {
    siblingIds.add(node.id);
    graph.setNode(node.id, {
      height: node.measured?.height ?? FALLBACK_NODE_HEIGHT,
      width: node.measured?.width ?? FALLBACK_NODE_WIDTH,
    });
  });

  edges.forEach((edge) => {
    if (siblingIds.has(edge.source) && siblingIds.has(edge.target)) {
      graph.setEdge(edge.source, edge.target);
    }
  });

  Dagre.layout(graph);

  const anchor = findAnchor(siblings, graph, config.direction);
  const anchorWidth = anchor.measured?.width ?? FALLBACK_NODE_WIDTH;
  const anchorHeight = anchor.measured?.height ?? FALLBACK_NODE_HEIGHT;
  const anchorComputed = graph.node(anchor.id);
  const offsetX = anchor.position.x - (anchorComputed.x - anchorWidth / 2);
  const offsetY = anchor.position.y - (anchorComputed.y - anchorHeight / 2);

  const positions = new Map<string, { x: number; y: number }>();

  siblings.forEach((node) => {
    const { x, y } = graph.node(node.id);
    const width = node.measured?.width ?? FALLBACK_NODE_WIDTH;
    const height = node.measured?.height ?? FALLBACK_NODE_HEIGHT;
    positions.set(node.id, { x: x - width / 2 + offsetX, y: y - height / 2 + offsetY });
  });

  return positions;
};

/**
 * Groups nodes by their `parentId` (undefined = top-level).
 * Each bucket is laid out independently so that group children are
 * positioned relative to their group, as React Flow expects.
 */
const groupByParent = (nodes: Node[]) => {
  const bucketsByParent = new Map<string | undefined, Node[]>();

  nodes.forEach((node) => {
    const bucket = bucketsByParent.get(node.parentId) ?? [];
    bucket.push(node);
    bucketsByParent.set(node.parentId, bucket);
  });

  return bucketsByParent;
};

/**
 * Runs Dagre to compute positions for the given nodes and returns a new
 * `nodes` array with updated `position` fields. Nodes not yet measured by
 * React Flow keep their current position.
 *
 * Respects group hierarchy: top-level nodes are laid out together, and
 * each group's children are laid out independently using parent-relative
 * coordinates.
 */
export const getLayoutedElements = (nodes: Node[], edges: Edge[], options: LayoutOptions = {}): Node[] => {
  const config: Required<LayoutOptions> = {
    direction: options.direction ?? LAYOUT_DIRECTION,
    horizontalSpacing: options.horizontalSpacing ?? LAYOUT_HORIZONTAL_SPACING,
    verticalSpacing: options.verticalSpacing ?? LAYOUT_VERTICAL_SPACING,
  };

  const positionsById = new Map<string, { x: number; y: number }>();

  groupByParent(nodes).forEach((siblings) => {
    const layoutable = siblings.filter(isMeasured);

    if (layoutable.length === 0) {
      return;
    }
    layoutSiblings(layoutable, edges, config).forEach((position, id) => {
      positionsById.set(id, position);
    });
  });

  return nodes.map((node) => {
    const nextPosition = positionsById.get(node.id);
    return nextPosition ? { ...node, position: nextPosition } : node;
  });
};
