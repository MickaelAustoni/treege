import { createContext, PropsWithChildren, useContext } from "react";
import { FlowActions, useCreateFlowActions } from "@/editor/hooks/useFlowActions";
import { FlowConnections, useCreateFlowConnections } from "@/editor/hooks/useFlowConnections";

/**
 * Editor-wide instances of the flow action hooks. Every node card holds half a
 * dozen components that need an action or two; sharing one instance through
 * context keeps them from each subscribing to the React Flow store (and the
 * history store) just to obtain stable callbacks — with hundreds of nodes,
 * those subscriptions were most of the work done on every store update (each
 * pan frame, each keystroke).
 */
const FlowActionsContext = createContext<FlowActions | null>(null);
const FlowConnectionsContext = createContext<FlowConnections | null>(null);

/**
 * Creates the editor's single `useFlowActions` / `useFlowConnections`
 * instances and exposes them to the whole editor tree (nodes, edges, panels,
 * sheets, dialogs). Must be rendered inside `ReactFlowProvider`, above
 * `<ReactFlow>`.
 */
export const FlowActionsProvider = ({ children }: PropsWithChildren) => {
  const actions = useCreateFlowActions();
  const connections = useCreateFlowConnections();

  return (
    <FlowActionsContext.Provider value={actions}>
      <FlowConnectionsContext.Provider value={connections}>{children}</FlowConnectionsContext.Provider>
    </FlowActionsContext.Provider>
  );
};

/** The editor's shared actions on nodes and edges (select, update, delete…). */
export const useFlowActions = (): FlowActions => {
  const actions = useContext(FlowActionsContext);

  if (!actions) {
    throw new Error("useFlowActions must be used within a FlowActionsProvider");
  }

  return actions;
};

/** The editor's shared connection handlers and node-creating actions. */
export const useFlowConnections = (): FlowConnections => {
  const connections = useContext(FlowConnectionsContext);

  if (!connections) {
    throw new Error("useFlowConnections must be used within a FlowActionsProvider");
  }

  return connections;
};
