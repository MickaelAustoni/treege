import { useConnection, useStore } from "@xyflow/react";
import { createContext, PropsWithChildren, useContext, useMemo } from "react";
import { getSelectedNodeCount } from "@/editor/utils/edge";

export interface CanvasInteractionState {
  /** A connection drag is in progress somewhere on the canvas. */
  isConnecting: boolean;
  /** More than one node is selected. */
  isMultiSelection: boolean;
}

const DEFAULT_STATE: CanvasInteractionState = { isConnecting: false, isMultiSelection: false };

const CanvasInteractionContext = createContext<CanvasInteractionState>(DEFAULT_STATE);

/**
 * Subscribes once to the canvas-wide interaction flags every node card reads
 * (connection in progress, multi-selection) and shares them through context.
 * Node cards re-render exactly when they did with per-node selectors — when a
 * flag flips — but the store no longer runs one selector per node per update.
 * Must be rendered inside `ReactFlowProvider`, above `<ReactFlow>`.
 */
export const CanvasInteractionProvider = ({ children }: PropsWithChildren) => {
  const isConnecting = useConnection((connection) => connection.inProgress);
  const isMultiSelection = useStore((state) => getSelectedNodeCount(state.nodes) > 1);
  const value = useMemo(() => ({ isConnecting, isMultiSelection }), [isConnecting, isMultiSelection]);

  return <CanvasInteractionContext.Provider value={value}>{children}</CanvasInteractionContext.Provider>;
};

export const useCanvasInteraction = () => useContext(CanvasInteractionContext);
