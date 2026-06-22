/**
 * Flow Renderer - Core Logic
 *
 * Exposes `getFlowRenderState`, which determines which nodes should be visible
 * based on form values and edge conditions. Runs on every form value change
 * and is optimized for performance (O(1) lookups, minimal iterations).
 */

import { Edge, Node } from "@xyflow/react";
import { FormValues } from "@/renderer/types/renderer";
import { evaluateConditions } from "@/renderer/utils/conditions";
import { checkFormFieldHasValue } from "@/renderer/utils/form";
import { ConditionalEdgeData } from "@/shared/types/edge";
import { TreegeNodeData } from "@/shared/types/node";
import { isInputNode } from "@/shared/utils/nodeTypeGuards";

/**
 * Result from computing the flow render state
 * Contains everything needed to render the form and determine its state
 *
 * This is the output of getFlowRenderState and represents which nodes should be visible
 * based on the current form values and conditional logic.
 */
export interface FlowRenderState {
  /**
   * Whether the end of the flow path has been reached (no more unexplored paths)
   * This does NOT mean the form is valid - just that we've traversed as far as possible
   *
   * Use case: Determines if the submit button should be enabled (endOfPathReached + valid form)
   */
  endOfPathReached: boolean;
  /**
   * Set of all visible node IDs for quick lookup
   *
   * Use case: O(1) check if a node is visible (includes parent groups)
   */
  visibleNodeIds: Set<string>;
  /**
   * All visible nodes (for validation, includes children of groups)
   *
   * Use case: Running validation on all visible input nodes
   */
  visibleNodes: Node<TreegeNodeData>[];
  /**
   * Visible nodes at root level (to render at top-level, ordered by flow)
   *
   * Use case: Rendering the form - only these nodes need to be rendered at the root
   * (their children will be rendered by group components)
   */
  visibleRootNodes: Node<TreegeNodeData>[];
}

/**
 * Build a map of node ID to outgoing edges for O(1) lookup during traversal
 */
const buildEdgeMap = (edges: Edge<ConditionalEdgeData>[]): Map<string, Edge<ConditionalEdgeData>[]> => {
  const map = new Map<string, Edge<ConditionalEdgeData>[]>();
  edges.forEach((edge) => {
    const existing = map.get(edge.source);
    if (existing) {
      existing.push(edge);
    } else {
      map.set(edge.source, [edge]);
    }
  });
  return map;
};

/**
 * Determine which edges to follow from a node
 * Core progressive rendering logic - categorizes edges and applies flow rules
 */
const determineEdgesToFollow = (
  edges: Edge<ConditionalEdgeData>[],
  formValues: FormValues,
  nodeMap: Map<string, Node<TreegeNodeData>>,
): { edgesToFollow: Edge<ConditionalEdgeData>[]; waitingForInput: boolean } => {
  // Categorize edges once for efficiency
  const unconditional: Edge<ConditionalEdgeData>[] = [];
  const conditional: Edge<ConditionalEdgeData>[] = [];
  const fallback: Edge<ConditionalEdgeData>[] = [];

  edges.forEach((edge) => {
    const isFallback = edge.data?.isFallback;
    const hasConditions = edge.data?.conditions?.length;

    if (isFallback) {
      fallback.push(edge);
    } else if (hasConditions) {
      conditional.push(edge);
    } else {
      unconditional.push(edge);
    }
  });

  // 1. Always follow unconditional edges
  const edgesToFollow = [...unconditional];

  // 2. No conditional edges: allow pure fallback navigation if present
  if (conditional.length === 0) {
    if (fallback.length > 0 && edgesToFollow.length === 0) {
      edgesToFollow.push(...fallback);
    }
    return { edgesToFollow, waitingForInput: false };
  }

  // 3. Check if all required fields are filled
  const allFieldsFilled = conditional.every((edge) => {
    const conditions = edge.data?.conditions;
    if (!conditions) {
      return false;
    }
    return conditions.every((cond) => {
      if (!cond.field) {
        return true;
      }
      const fieldNode = nodeMap.get(cond.field);
      const fieldName = isInputNode(fieldNode) ? fieldNode.id : cond.field;
      return checkFormFieldHasValue(fieldName, formValues);
    });
  });

  // 4. If fields not filled, follow fallback edges (no conditional edge can be true without values)
  if (!allFieldsFilled) {
    if (fallback.length > 0) {
      edgesToFollow.push(...fallback);
    }
    return { edgesToFollow, waitingForInput: edgesToFollow.length === 0 };
  }

  // 5. Evaluate conditions and follow matching edges
  const matching = conditional.filter((e) => evaluateConditions(e.data?.conditions, formValues, nodeMap));

  if (matching.length > 0) {
    edgesToFollow.push(...matching);
    return { edgesToFollow, waitingForInput: false };
  }

  // 6. No match - follow fallback edges if any
  edgesToFollow.push(...fallback);

  return { edgesToFollow, waitingForInput: false };
};

/**
 * Check if a node is the start node (has no incoming edges)
 * Used by UI components to determine if a node is the first in the flow
 */
export const isStartNode = (nodeId: string, edges: Edge[]): boolean => !edges.some((edge) => edge.target === nodeId);

/**
 * Find the start node (node without incoming edges)
 * Prefers input nodes as the start, otherwise takes the first node found
 */
export const findStartNode = (nodes: Node<TreegeNodeData>[], edges: Edge[]): Node<TreegeNodeData> | undefined => {
  const nodesWithoutIncoming = nodes.filter((node) => isStartNode(node.id, edges));
  return nodesWithoutIncoming.find(isInputNode) || nodesWithoutIncoming[0];
};

/**
 * Walks the parent chain starting at `parentId` and returns the ancestor group
 * IDs in order (closest first). `seen` guards against parent cycles.
 */
const collectAncestorGroupIds = (
  parentId: string | undefined,
  nodeMap: Map<string, Node<TreegeNodeData>>,
  seen: Set<string> = new Set<string>(),
): string[] => {
  if (!parentId || seen.has(parentId)) {
    return [];
  }

  seen.add(parentId);
  return [parentId, ...collectAncestorGroupIds(nodeMap.get(parentId)?.parentId, nodeMap, seen)];
};

/**
 * Add parent groups to visible node IDs and assign them order indices
 * Mutates visibleNodeIds and orderIndex for efficiency
 */
const addParentGroupsToVisibleNodes = (
  orderedNodeIds: Set<string>,
  visibleNodeIds: Set<string>,
  orderIndex: Map<string, number>,
  nodeMap: Map<string, Node<TreegeNodeData>>,
): void => {
  orderedNodeIds.forEach((nodeId) => {
    const childOrder = orderIndex.get(nodeId);
    const ancestorGroupIds = collectAncestorGroupIds(nodeMap.get(nodeId)?.parentId, nodeMap);

    ancestorGroupIds.forEach((parentId) => {
      visibleNodeIds.add(parentId);
      // If this parent group doesn't have an order yet, use this child's order
      if (!orderIndex.has(parentId) && childOrder !== undefined) {
        orderIndex.set(parentId, childOrder);
      }
    });
  });
};

/**
 * Get the complete render state for the flow
 *
 * This is the MAIN function that computes everything needed to render the form:
 * 1. Finds the start node (node without incoming edges)
 * 2. Determines which nodes should be visible based on form values and edge conditions
 * 3. Orders them in the correct flow sequence for rendering
 * 4. Detects if we've reached the end of the path (important for submit button state)
 *
 * Progressive Rendering Logic:
 * - Start from the first node (no incoming edges)
 * - Show the current node
 * - If the node has outgoing edges:
 *   - Unconditional edges: always follow
 *   - Conditional edges: only follow if conditions are met AND all required fields are filled
 *   - Fallback edges: follow only if no conditional edges match
 * - If we encounter a node where conditional fields are not yet filled, STOP (wait for user input)
 * - Continue until no more nodes can be revealed
 *
 * @param nodes - All nodes from the editor
 * @param edges - All edges from the editor
 * @param formValues - Current form values
 * @returns Complete flow render state (visible nodes, end-of-path flag, etc.)
 */
export const getFlowRenderState = (
  nodes: Node<TreegeNodeData>[],
  edges: Edge<ConditionalEdgeData>[],
  formValues: FormValues,
): FlowRenderState => {
  // Early return for empty flow
  const startNode = findStartNode(nodes, edges);
  if (!startNode) {
    return {
      endOfPathReached: true,
      visibleNodeIds: new Set<string>(),
      visibleNodes: [],
      visibleRootNodes: [],
    };
  }

  // Build lookup maps for O(1) access during traversal
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const edgeMap = buildEdgeMap(edges);

  // State for recursive traversal
  const orderedNodes: Node<TreegeNodeData>[] = [];
  const orderedNodeIds = new Set<string>();
  const visited = new Set<string>();
  let hasUnexploredPaths = false;

  /**
   * Recursive function to traverse the graph and collect visible nodes
   */
  const traverse = (nodeId: string): void => {
    if (visited.has(nodeId)) {
      return;
    }

    visited.add(nodeId);
    const node = nodeMap.get(nodeId);
    if (!node) {
      return;
    }

    orderedNodeIds.add(nodeId);
    orderedNodes.push(node);

    const outgoingEdges = edgeMap.get(nodeId) || [];
    const { edgesToFollow, waitingForInput } = determineEdgesToFollow(outgoingEdges, formValues, nodeMap);

    if (waitingForInput) {
      hasUnexploredPaths = true;
      return;
    }

    edgesToFollow.forEach((edge) => {
      traverse(edge.target);
    });
  };

  traverse(startNode.id);

  // Create order index from flow traversal to maintain correct order
  const orderIndex = new Map(orderedNodes.map((node, i) => [node.id, i]));

  // Add parent groups to visible nodes and assign them order indices
  const visibleNodeIds = new Set(orderedNodeIds);
  addParentGroupsToVisibleNodes(orderedNodeIds, visibleNodeIds, orderIndex, nodeMap);

  // Sort all visible nodes by flow order (important for group children)
  const visibleNodes = nodes
    .filter((node) => visibleNodeIds.has(node.id))
    .sort((a, b) => (orderIndex.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (orderIndex.get(b.id) ?? Number.MAX_SAFE_INTEGER));

  // Get root nodes (no parent or parent not visible)
  const visibleRootNodes = visibleNodes.filter((node) => !(node.parentId && visibleNodeIds.has(node.parentId)));

  return {
    endOfPathReached: !hasUnexploredPaths,
    visibleNodeIds,
    visibleNodes,
    visibleRootNodes,
  };
};
