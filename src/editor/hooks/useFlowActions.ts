import { useReactFlow } from "@xyflow/react";
import { nanoid } from "nanoid";
import { useCallback } from "react";
import { normalizeConditionalEdges } from "@/editor/utils/edge";

/**
 * Custom hook providing various actions to manipulate nodes and edges
 * within a React Flow instance.
 */
const useFlowActions = () => {
  const { setNodes, setEdges, getNodes } = useReactFlow();

  /**
   * Clears the selection of all nodes and edges in the flow.
   */
  const clearSelection = useCallback(() => {
    setNodes((nds) => nds.map(({ selected, ...node }) => node));
    setEdges((eds) => eds.map(({ selected, ...edge }) => edge));
  }, [setEdges, setNodes]);

  /**
   * Selects a single node by ID and clears any previously selected nodes and edges.
   * @param id - The ID of the node to select.
   */
  const selectNode = useCallback(
    (id: string) => {
      setNodes((nds) => nds.map((node) => ({ ...node, selected: node.id === id })));
      setEdges((eds) => eds.map(({ selected, ...edge }) => edge));
    },
    [setEdges, setNodes],
  );

  /**
   * Updates a node's data by its ID.
   * @param id - The ID of the node to update.
   * @param data - Partial data to merge into the node's existing data.
   */
  const updateNodeData = useCallback(
    <T extends Record<string, unknown>>(id: string, data: Partial<T>) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === id) {
            return {
              ...node,
              data: {
                ...node.data,
                ...data,
              },
            };
          }
          return node;
        }),
      );
    },
    [setNodes],
  );

  /**
   * Updates a node's type by ID, optionally setting a variant in `data.type`.
   * When the node type changes, the previous data is discarded; otherwise it is preserved.
   * @param id - The ID of the node to update.
   * @param type - The new node type (e.g. "input", "ui", "flow").
   * @param subType - Optional variant stored in `data.type` (e.g. "text", "title").
   */
  const updateNodeType = useCallback(
    (id: string, type: string, subType?: string) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id !== id) {
            return node;
          }

          const isSameType = node.type === type;
          const baseData = isSameType ? node.data : {};

          return {
            ...node,
            data: subType === undefined ? baseData : { ...baseData, type: subType },
            type,
          };
        }),
      );
    },
    [setNodes],
  );

  /**
   * Updates the type of the currently selected node, optionally setting a variant in `data.type`.
   * @param type - The new node type (e.g. "input", "ui", "flow").
   * @param subType - Optional variant stored in `data.type` (e.g. "text", "title").
   */
  const updateSelectedNodeType = useCallback(
    (type: string, subType?: string) => {
      const currentSelectedNode = getNodes().find((node) => node.selected);
      if (!currentSelectedNode) {
        return;
      }

      updateNodeType(currentSelectedNode.id, type, subType);
    },
    [getNodes, updateNodeType],
  );

  /**
   * Updates the data of the currently selected node.
   * If no node is selected, the function does nothing.
   * @param data - Partial data to merge into the selected node's existing data.
   */
  const updateSelectedNodeData = useCallback(
    <T extends Record<string, unknown>>(data: Partial<T>) => {
      const currentSelectedNode = getNodes().find((node) => node.selected);
      if (!currentSelectedNode) {
        return;
      }

      updateNodeData(currentSelectedNode.id, data);
    },
    [getNodes, updateNodeData],
  );

  /**
   * Deletes a node by ID along with its connected edges.
   * If the deleted node has exactly one parent and one child, a bridge edge is
   * created between them so the chain stays connected.
   * @param id - The ID of the node to delete.
   */
  const deleteNode = useCallback(
    (id: string) => {
      setNodes((nds) => nds.filter((node) => node.id !== id));
      setEdges((eds) => {
        const incomingEdges = eds.filter((edge) => edge.target === id);
        const outgoingEdges = eds.filter((edge) => edge.source === id);
        const affectedParents = new Set(incomingEdges.map((edge) => edge.source));
        const remainingEdges = eds.filter((edge) => edge.source !== id && edge.target !== id);

        // Bridge the parent to the child only in the unambiguous 1-to-1 case.
        // Other shapes (multi-parent, multi-child) would require arbitrary choices or could violate the
        // "only input nodes can have multiple outgoing edges" rule enforced by isValidConnection.
        if (incomingEdges.length === 1 && outgoingEdges.length === 1) {
          const [parentEdge] = incomingEdges;
          const [childEdge] = outgoingEdges;
          const bridgeEdge = {
            data: parentEdge.data,
            id: nanoid(),
            source: parentEdge.source,
            target: childEdge.target,
            type: parentEdge.type,
          };
          return normalizeConditionalEdges([...remainingEdges, bridgeEdge], affectedParents);
        }

        return normalizeConditionalEdges(remainingEdges, affectedParents);
      });
    },
    [setNodes, setEdges],
  );

  /**
   * Deletes the currently selected node and its connected edges.
   * If no node is selected, the function does nothing.
   */
  const deleteSelectedNode = useCallback(() => {
    const currentSelectedNode = getNodes().find((node) => node.selected);
    if (!currentSelectedNode) {
      return;
    }

    deleteNode(currentSelectedNode.id);
  }, [getNodes, deleteNode]);

  return {
    clearSelection,
    deleteNode,
    deleteSelectedNode,
    selectNode,
    updateNodeData,
    updateNodeType,
    updateSelectedNodeData,
    updateSelectedNodeType,
  };
};

export default useFlowActions;
