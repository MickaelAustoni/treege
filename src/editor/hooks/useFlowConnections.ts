import { addEdge, Node, OnConnect, OnConnectEnd, OnEdgesDelete, useReactFlow } from "@xyflow/react";
import { nanoid } from "nanoid";
import { useCallback } from "react";
import { DEFAULT_NODE } from "@/editor/constants/defaultNode";
import { HORIZONTAL_NODE_OFFSET, VERTICAL_NODE_SPACING } from "@/editor/constants/nodeSpacing";
import useUndoRedo from "@/editor/hooks/useUndoRedo";
import { buildConvergence, edgeExists, normalizeConditionalEdges, wouldCreateCycle } from "@/editor/utils/edge";
import { isInputNode } from "@/shared/utils/nodeTypeGuards";

/**
 * Shape passed to the node-creating actions (`onAddFromHandle`, `onInsertAfter`,
 * and the internal `createNodeAndConnect`). Lets callers seed the new node's
 * `type` and `data` while React Flow handles position, id, etc.
 */
export type NodeInit = {
  type: string;
  data?: Record<string, unknown>;
};

/**
 * Custom hook to manage flow connections, including connecting nodes,
 * handling connection ends, and deleting edges with conditional logic.
 */
const useFlowConnections = () => {
  const { setNodes, setEdges, screenToFlowPosition, getNode, getNodes, getEdges } = useReactFlow();
  const { takeSnapshot } = useUndoRedo();

  /**
   * Internal function to create a new node and connect it
   * Used by both onConnectEnd (drag) and onAddFromHandle (click "+")
   */
  const createNodeAndConnect = useCallback(
    (sourceNode: Node, position: { x: number; y: number }, shouldSelectNode = false, nodeInit?: NodeInit) => {
      const sourceId = sourceNode.id;
      const edges = getEdges();
      const existingEdgesFromSource = edges.filter((edge) => edge.source === sourceId);
      const isSourceInputNode = isInputNode(sourceNode);

      // Block creation if source already has children and is NOT an input node
      if (existingEdgesFromSource.length > 0 && !isSourceInputNode) {
        return;
      }

      takeSnapshot();
      const nodeId = nanoid();

      const newNode: Node = {
        ...DEFAULT_NODE,
        ...(nodeInit && { data: nodeInit.data ?? {}, type: nodeInit.type }),
        id: nodeId,
        position,
        selected: shouldSelectNode,
      };

      // If the source node is part of a group, the new node inherits the same group (metadata only).
      // No `extent: "parent"` constraint — groups are invisible badges, not visual containers,
      // so children must stay freely positionable on the canvas.
      if (sourceNode?.parentId) {
        newNode.parentId = sourceNode.parentId;
      }

      // Add the new node first
      setNodes((node) => node.concat(newNode));

      // Create a new edge with conditional logic if needed
      setEdges((edgesSnapshot) => {
        const childrenEdges = edgesSnapshot.filter((edge) => edge.source === sourceId);
        const willHaveSiblings = childrenEdges.length > 0;

        const newEdge = {
          data:
            willHaveSiblings && isSourceInputNode
              ? {
                  conditions: [{ field: sourceId, operator: "===", value: "" }],
                }
              : undefined,
          id: nanoid(),
          source: sourceId,
          target: nodeId,
          type: willHaveSiblings && isSourceInputNode ? "conditional" : "default",
        };

        // If the source node will have siblings and is an input node, update all its edges to be "conditional"
        if (willHaveSiblings && isSourceInputNode) {
          return edgesSnapshot
            .map((edge) => {
              if (edge.source === sourceId) {
                return {
                  ...edge,
                  data: {
                    ...edge.data,
                    conditions: edge.data?.conditions || [{ field: sourceId, operator: "===", value: "" }],
                  },
                  type: "conditional",
                };
              }
              return edge;
            })
            .concat(newEdge);
        }

        return edgesSnapshot.concat(newEdge);
      });

      // Deselect all nodes and edges, then select the new node (only if requested)
      // Defer to the next frame to run after ReactFlow's internal selection handlers
      // (e.g. Handle click selecting the source, dropdown close firing pane click)
      if (shouldSelectNode) {
        requestAnimationFrame(() => {
          setNodes((nodes) => nodes.map((n) => ({ ...n, selected: n.id === nodeId })));
          setEdges((edges) => edges.map((edge) => ({ ...edge, selected: false })));
        });
      }
    },
    [getEdges, setNodes, setEdges, takeSnapshot],
  );

  /**
   * Converge two leaf nodes (ends of different branches) into a brand-new
   * common child node, wiring `sourceNode` → common and `targetNode` → common.
   * The two leaves keep their own parents; the new node becomes their shared
   * continuation. Triggered from `onConnectEnd` when a leaf's connection is
   * released over another leaf.
   */
  const createCommonNode = useCallback(
    (sourceNode: Node, targetNode: Node) => {
      takeSnapshot();

      const rawNodeHeight = getComputedStyle(document.documentElement).getPropertyValue("--node-height");
      const nodeHeight = parseFloat(rawNodeHeight) || 100;

      const { node: commonNode, edges: commonEdges } = buildConvergence(sourceNode, targetNode, {
        baseNode: DEFAULT_NODE,
        commonNodeId: nanoid(),
        nodeHeight,
        verticalSpacing: VERTICAL_NODE_SPACING,
      });

      setNodes((nodes) => nodes.concat(commonNode));
      setEdges((edgesSnapshot) => edgesSnapshot.concat(...commonEdges));

      // Defer the explicit selection pass to the next frame so it overrides
      // React Flow's own selection handlers (mirrors `createNodeAndConnect`).
      requestAnimationFrame(() => {
        setNodes((nodes) => nodes.map((node) => ({ ...node, selected: node.id === commonNode.id })));
        setEdges((edges) => edges.map((edge) => ({ ...edge, selected: false })));
      });
    },
    [setNodes, setEdges, takeSnapshot],
  );

  /**
   * Handles the connection of two nodes in the flow. Leaf → leaf drops are
   * delegated to `onConnectEnd` (they converge into a common node); everything
   * else creates the edge here, upgrading the source's edges to conditional
   * when an input node ends up with multiple children.
   */
  const onConnect: OnConnect = useCallback(
    (params) => {
      const sourceId = params.source;
      const sourceNode = getNode(sourceId);
      const currentEdges = getEdges();

      const sourceIsLeaf = !currentEdges.some((edge) => edge.source === sourceId);
      const targetIsLeaf = !currentEdges.some((edge) => edge.source === params.target);

      // Leaf → leaf convergence is handled in onConnectEnd (so it works when the
      // pointer is released anywhere over the target node, not only on its small
      // handle). Skip here to avoid creating a direct source → target edge.
      if (sourceIsLeaf && targetIsLeaf) {
        return;
      }

      takeSnapshot();
      setEdges((edgesSnapshot) => {
        const newEdges = addEdge(params, edgesSnapshot);
        const childrenEdges = newEdges.filter((edge) => edge.source === sourceId);

        // If parent has more than one child, set all its edges to be "conditional"
        // Only create conditional edges if the source node is an input node
        if (childrenEdges.length > 1 && sourceNode && isInputNode(sourceNode)) {
          return newEdges.map((edge) => {
            if (edge.source === sourceId) {
              return {
                ...edge,
                data: {
                  ...edge.data,
                  conditions: edge.data?.conditions || [{ field: sourceId, operator: "===", value: "" }],
                },
                type: "conditional",
              };
            }
            return edge;
          });
        }

        return newEdges;
      });
    },
    [setEdges, getNode, getEdges, takeSnapshot],
  );

  /**
   * Adds a new node below the source node and connects them
   * This is used when clicking the "+" handle button
   */
  const onAddFromHandle = useCallback(
    (sourceNodeId: string, nodeInit?: NodeInit) => {
      const sourceNode = getNode(sourceNodeId);
      if (!sourceNode) {
        return;
      }

      // Calculate position for the new node (below the source node)
      const rawNodeHeight = getComputedStyle(document.documentElement).getPropertyValue("--node-height");
      const rawNodeWidth = getComputedStyle(document.documentElement).getPropertyValue("--node-width");
      const nodeHeight = parseFloat(rawNodeHeight) || 100;
      const nodeWidth = parseFloat(rawNodeWidth) || 100;

      // Calculate position for the new node
      const newY = sourceNode.position.y + nodeHeight + VERTICAL_NODE_SPACING;

      // Find existing siblings (nodes that share the same parent/source)
      const allNodes = getNodes();
      const allEdges = getEdges();
      const existingSiblings = allNodes.filter((node) => allEdges.some((edge) => edge.source === sourceNodeId && edge.target === node.id));

      // Calculate X position: alternate right/left to balance siblings around the source
      // 0 siblings: centered on source; odd count: to the right of rightmost; even count: to the left of leftmost
      const siblingXs = existingSiblings.map((node) => node.position.x);
      const newX =
        siblingXs.length === 0
          ? sourceNode.position.x
          : siblingXs.length % 2 === 1
            ? Math.max(...siblingXs) + nodeWidth + HORIZONTAL_NODE_OFFSET
            : Math.min(...siblingXs) - nodeWidth - HORIZONTAL_NODE_OFFSET;

      // Use the shared function to create node and connect, with selection enabled
      createNodeAndConnect(sourceNode, { x: newX, y: newY }, true, nodeInit);
    },
    [getNode, getNodes, getEdges, createNodeAndConnect],
  );

  /**
   * Creates a branch from `sourceNodeId` by adding two child nodes at once,
   * placed symmetrically below the source. Both connecting edges are made
   * "conditional" (and any pre-existing edge from the source is upgraded too),
   * since a fork is only meaningful for input nodes that gate on their value.
   * No-op when the source is not an input node.
   */
  const onCreateBranch = useCallback(
    (sourceNodeId: string, nodeInit?: NodeInit) => {
      const sourceNode = getNode(sourceNodeId);
      if (!(sourceNode && isInputNode(sourceNode))) {
        return;
      }

      takeSnapshot();

      const rawNodeHeight = getComputedStyle(document.documentElement).getPropertyValue("--node-height");
      const rawNodeWidth = getComputedStyle(document.documentElement).getPropertyValue("--node-width");
      const nodeHeight = parseFloat(rawNodeHeight) || 100;
      const nodeWidth = parseFloat(rawNodeWidth) || 100;

      const newY = sourceNode.position.y + nodeHeight + VERTICAL_NODE_SPACING;
      const halfSpan = nodeWidth / 2 + HORIZONTAL_NODE_OFFSET / 2;

      const makeNode = (x: number, selected: boolean): Node => {
        const node: Node = {
          ...DEFAULT_NODE,
          ...(nodeInit ? { type: nodeInit.type } : {}),
          data: { ...(nodeInit?.data ?? DEFAULT_NODE.data) },
          id: nanoid(),
          position: { x, y: newY },
          selected,
        };
        if (sourceNode.parentId) {
          node.parentId = sourceNode.parentId;
        }
        return node;
      };

      const leftNode = makeNode(sourceNode.position.x - halfSpan, true);
      const rightNode = makeNode(sourceNode.position.x + halfSpan, false);

      setNodes((nodes) => nodes.concat(leftNode, rightNode));

      setEdges((edgesSnapshot) => {
        const makeConditions = () => [{ field: sourceNodeId, operator: "===", value: "" }];

        const branchEdges = [leftNode, rightNode].map((node) => ({
          data: { conditions: makeConditions() },
          id: nanoid(),
          source: sourceNodeId,
          target: node.id,
          type: "conditional",
        }));

        // Upgrade any edge already leaving the source so the whole fork stays conditional.
        const upgraded = edgesSnapshot.map((edge) =>
          edge.source === sourceNodeId
            ? { ...edge, data: { ...edge.data, conditions: edge.data?.conditions || makeConditions() }, type: "conditional" }
            : edge,
        );

        return upgraded.concat(branchEdges);
      });

      // Defer the explicit selection pass to the next frame so it overrides
      // ReactFlow's own selection handlers (mirrors `createNodeAndConnect`).
      requestAnimationFrame(() => {
        setNodes((nodes) => nodes.map((node) => ({ ...node, selected: node.id === leftNode.id })));
        setEdges((edges) => edges.map((edge) => ({ ...edge, selected: false })));
      });
    },
    [getNode, setNodes, setEdges, takeSnapshot],
  );

  /**
   * Inserts a new node between `sourceNodeId` and its sole successor. Re-routes
   * the existing outgoing edge to start from the new node and shifts the whole
   * descendant sub-graph down by one row to make room. Only valid when the
   * source has exactly one outgoing edge (i.e. it is part of a vertical stack).
   */
  const onInsertAfter = useCallback(
    (sourceNodeId: string, nodeInit?: NodeInit) => {
      const sourceNode = getNode(sourceNodeId);
      if (!sourceNode) {
        return;
      }

      const allEdges = getEdges();
      const outgoingEdges = allEdges.filter((edge) => edge.source === sourceNodeId);
      if (outgoingEdges.length !== 1) {
        return;
      }

      const outgoingEdge = outgoingEdges[0];
      const successorNode = getNode(outgoingEdge.target);
      if (!successorNode) {
        return;
      }

      takeSnapshot();

      const rawNodeHeight = getComputedStyle(document.documentElement).getPropertyValue("--node-height");
      const nodeHeight = parseFloat(rawNodeHeight) || 100;
      const deltaY = nodeHeight + VERTICAL_NODE_SPACING;

      // BFS through the successor's descendants so we shift the whole sub-graph
      // (including branches that hang off the stack) by the same delta.
      const descendantIds = new Set<string>([successorNode.id]);
      const queue: string[] = [successorNode.id];
      while (queue.length > 0) {
        const current = queue.shift() as string;
        allEdges
          .filter((edge) => edge.source === current)
          .forEach((edge) => {
            if (!descendantIds.has(edge.target)) {
              descendantIds.add(edge.target);
              queue.push(edge.target);
            }
          });
      }

      const newNodeId = nanoid();
      const newNode: Node = {
        ...DEFAULT_NODE,
        ...(nodeInit && { data: nodeInit.data ?? {}, type: nodeInit.type }),
        id: newNodeId,
        position: { x: successorNode.position.x, y: successorNode.position.y },
        selected: true,
      };

      if (sourceNode.parentId) {
        newNode.parentId = sourceNode.parentId;
      }

      setNodes((nodes) =>
        nodes
          .map((node) => {
            if (descendantIds.has(node.id)) {
              return {
                ...node,
                position: { x: node.position.x, y: node.position.y + deltaY },
              };
            }
            return node;
          })
          .concat(newNode),
      );

      setEdges((edges) =>
        edges
          .map((edge) => (edge.id === outgoingEdge.id ? { ...edge, source: newNodeId } : edge))
          .concat({
            id: nanoid(),
            source: sourceNodeId,
            target: newNodeId,
            type: "default",
          }),
      );

      // Mirror `createNodeAndConnect`: defer the explicit deselect-all-then-select
      // pass to the next frame so it overrides ReactFlow's own selection handlers.
      requestAnimationFrame(() => {
        setNodes((nodes) => nodes.map((node) => ({ ...node, selected: node.id === newNodeId })));
        setEdges((edges) => edges.map((edge) => ({ ...edge, selected: false })));
      });
    },
    [getNode, getEdges, setNodes, setEdges, takeSnapshot],
  );

  /**
   * Swaps two adjacent stacked nodes, where `upperId` is the current predecessor
   * in the stack and `lowerId` its sole stack successor. Reverses the stack edge
   * between them, re-targets any incoming edges of `upperId` onto `lowerId`,
   * re-sources any outgoing edges of `lowerId` from `upperId`, and swaps their
   * Y positions so the visual order matches the new chain.
   */
  const swapAdjacentStacked = useCallback(
    (upperId: string, lowerId: string) => {
      const upperNode = getNode(upperId);
      const lowerNode = getNode(lowerId);
      if (!(upperNode && lowerNode)) {
        return;
      }

      takeSnapshot();

      setEdges((edges) =>
        edges.map((edge) => {
          if (edge.source === upperId && edge.target === lowerId) {
            return { ...edge, source: lowerId, target: upperId };
          }
          if (edge.target === upperId) {
            return { ...edge, target: lowerId };
          }
          if (edge.source === lowerId) {
            return { ...edge, source: upperId };
          }
          return edge;
        }),
      );

      setNodes((nodes) =>
        nodes.map((node) => {
          if (node.id === upperId) {
            return { ...node, position: { x: node.position.x, y: lowerNode.position.y } };
          }
          if (node.id === lowerId) {
            return { ...node, position: { x: node.position.x, y: upperNode.position.y } };
          }
          return node;
        }),
      );
    },
    [getNode, setNodes, setEdges, takeSnapshot],
  );

  /**
   * Moves a stacked node one slot up by swapping it with its sole stack
   * predecessor. No-op when the node is the stack head, not stacked, or itself
   * a decision node — swapping a node whose outgoing edges carry conditions
   * referencing its own id would push that id downstream and break the gate.
   */
  const moveStackNodeUp = useCallback(
    (nodeId: string) => {
      const allEdges = getEdges();
      const incoming = allEdges.filter((edge) => edge.target === nodeId);
      if (incoming.length !== 1) {
        return;
      }
      // Safety: bail out if the moved node has multiple outgoing edges (decision node).
      const ownOutgoingCount = allEdges.filter((edge) => edge.source === nodeId).length;
      if (ownOutgoingCount > 1) {
        return;
      }
      const predecessorId = incoming[0].source;
      const predecessorOutgoingCount = allEdges.filter((edge) => edge.source === predecessorId).length;
      if (predecessorOutgoingCount !== 1) {
        return;
      }
      swapAdjacentStacked(predecessorId, nodeId);
    },
    [getEdges, swapAdjacentStacked],
  );

  /**
   * Moves a stacked node one slot down by swapping it with its sole stack
   * successor. No-op when the node is the stack tail, not stacked, or the
   * successor is a decision node — see `moveStackNodeUp` for the rationale.
   */
  const moveStackNodeDown = useCallback(
    (nodeId: string) => {
      const allEdges = getEdges();
      const outgoing = allEdges.filter((edge) => edge.source === nodeId);
      if (outgoing.length !== 1) {
        return;
      }
      const successorId = outgoing[0].target;
      const successorIncomingCount = allEdges.filter((edge) => edge.target === successorId).length;
      if (successorIncomingCount !== 1) {
        return;
      }
      // Safety: bail out if the successor is a decision node (multiple outgoing).
      const successorOutgoingCount = allEdges.filter((edge) => edge.source === successorId).length;
      if (successorOutgoingCount > 1) {
        return;
      }
      swapAdjacentStacked(nodeId, successorId);
    },
    [getEdges, swapAdjacentStacked],
  );

  /**
   * Handles the end of a connection attempt in the flow.
   */
  const onConnectEnd: OnConnectEnd = useCallback(
    (event, connectionState) => {
      const sourceNode = connectionState.fromNode;
      if (!sourceNode) {
        return; // no valid start node, abort
      }

      const { clientX, clientY } = "changedTouches" in event ? event.changedTouches[0] : event;

      // Find the node under the pointer at release. `connectionState.toNode` is
      // only populated when a handle sits within the connection radius, so fall
      // back to a DOM hit-test against the node element — this lets the user
      // drop anywhere over the target node, not only on its small top handle.
      const elementNodeId =
        (document.elementFromPoint(clientX, clientY) as HTMLElement | null)?.closest?.(".react-flow__node")?.getAttribute("data-id") ??
        null;
      const droppedOnNodeId = elementNodeId ?? connectionState.toNode?.id ?? null;

      if (droppedOnNodeId && droppedOnNodeId !== sourceNode.id) {
        const targetNode = getNode(droppedOnNodeId);
        const edges = getEdges();
        const sourceIsLeaf = !edges.some((edge) => edge.source === sourceNode.id);
        const targetIsLeaf = !edges.some((edge) => edge.source === droppedOnNodeId);

        // Released over another leaf: converge both into a new common node.
        if (targetNode && sourceIsLeaf && targetIsLeaf) {
          createCommonNode(sourceNode, targetNode);
        }

        // Released over an existing node: never drop an overlapping stray node.
        return;
      }

      // Released on empty canvas: create a new node connected to the source.
      if (!connectionState.isValid) {
        const flowPosition = screenToFlowPosition({ x: clientX, y: clientY });

        // If the source node is in a group, convert to parent-relative coordinates
        const parentNode = sourceNode.parentId ? getNode(sourceNode.parentId) : undefined;
        const parentPosition = parentNode?.position ?? { x: 0, y: 0 };
        const position = parentNode ? { x: flowPosition.x - parentPosition.x, y: flowPosition.y - parentPosition.y } : flowPosition;

        createNodeAndConnect(sourceNode, position, true);
      }
    },
    [createCommonNode, createNodeAndConnect, getNode, getEdges, screenToFlowPosition],
  );

  /**
   * Handles the deletion of edges in the flow.
   */
  const onEdgesDelete: OnEdgesDelete = useCallback(
    (deletedEdges) => {
      setEdges((edges) => {
        const remainingEdges = edges.filter((edge) => !deletedEdges.find((deleted) => deleted.id === edge.id));
        const affectedParents = new Set(deletedEdges.map((edge) => edge.source));
        return normalizeConditionalEdges(remainingEdges, affectedParents);
      });
    },
    [setEdges],
  );

  /**
   * Validates if a connection can be created between two nodes.
   * Prevents multiple edges from non-input nodes (only input nodes can have conditional edges).
   */
  const isValidConnection = useCallback(
    (connection: { source: string; target: string }) => {
      // Prevent self-loops
      if (connection.source === connection.target) {
        return false;
      }

      const sourceNode = getNode(connection.source);

      if (!sourceNode) {
        return false;
      }

      const edges = getEdges();

      // Reject duplicate edges and any connection that would close a cycle.
      if (edgeExists(edges, connection.source, connection.target) || wouldCreateCycle(edges, connection.source, connection.target)) {
        return false;
      }

      const existingEdgesFromSource = edges.filter((edge) => edge.source === connection.source);

      // If source already has at least one edge and is NOT an input node, block the connection
      return !(existingEdgesFromSource.length > 0 && !isInputNode(sourceNode));
    },
    [getNode, getEdges],
  );

  return {
    isValidConnection,
    moveStackNodeDown,
    moveStackNodeUp,
    onAddFromHandle,
    onConnect,
    onConnectEnd,
    onCreateBranch,
    onEdgesDelete,
    onInsertAfter,
  };
};

export default useFlowConnections;
