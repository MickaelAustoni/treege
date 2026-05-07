import { addEdge, Node, OnConnect, OnConnectEnd, OnEdgesDelete, useReactFlow } from "@xyflow/react";
import { nanoid } from "nanoid";
import { useCallback } from "react";
import { DEFAULT_NODE } from "@/editor/constants/defaultNode";
import { HORIZONTAL_NODE_OFFSET, VERTICAL_NODE_SPACING } from "@/editor/constants/nodeSpacing";
import useUndoRedo from "@/editor/hooks/useUndoRedo";
import { normalizeConditionalEdges } from "@/editor/utils/edge";
import { isInputNode } from "@/shared/utils/nodeTypeGuards";

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
    (
      sourceNode: Node,
      position: { x: number; y: number },
      shouldSelectNode = false,
      nodeInit?: { type: string; data?: Record<string, unknown> },
    ) => {
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
   * Handles the connection of two nodes in the flow.
   */
  const onConnect: OnConnect = useCallback(
    (params) => {
      takeSnapshot();
      setEdges((edgesSnapshot) => {
        const newEdges = addEdge(params, edgesSnapshot);
        const sourceId = params.source;
        const sourceNode = getNode(sourceId);
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
    [setEdges, getNode, takeSnapshot],
  );

  /**
   * Adds a new node below the source node and connects them
   * This is used when clicking the "+" handle button
   */
  const onAddFromHandle = useCallback(
    (sourceNodeId: string, nodeInit?: { type: string; data?: Record<string, unknown> }) => {
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
   * Handles the end of a connection attempt in the flow.
   */
  const onConnectEnd: OnConnectEnd = useCallback(
    (event, connectionState) => {
      if (!connectionState.isValid) {
        const { clientX, clientY } = "changedTouches" in event ? event.changedTouches[0] : event;
        const sourceNode = connectionState.fromNode;

        if (!sourceNode) {
          return; // no valid start node, abort
        }

        // Convert screen coordinates to flow position
        const flowPosition = screenToFlowPosition({ x: clientX, y: clientY });

        // If the source node is in a group, convert to parent-relative coordinates
        const parentNode = sourceNode.parentId ? getNode(sourceNode.parentId) : undefined;
        const parentPosition = parentNode?.position ?? { x: 0, y: 0 };
        const position = parentNode ? { x: flowPosition.x - parentPosition.x, y: flowPosition.y - parentPosition.y } : flowPosition;

        // Use the shared function to create node and connect
        createNodeAndConnect(sourceNode, position, true);
      }
    },
    [createNodeAndConnect, getNode, screenToFlowPosition],
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
      const existingEdgesFromSource = edges.filter((edge) => edge.source === connection.source);

      // If source already has at least one edge and is NOT an input node, block the connection
      return !(existingEdgesFromSource.length > 0 && !isInputNode(sourceNode));
    },
    [getNode, getEdges],
  );

  return {
    isValidConnection,
    onAddFromHandle,
    onConnect,
    onConnectEnd,
    onEdgesDelete,
  };
};

export default useFlowConnections;
