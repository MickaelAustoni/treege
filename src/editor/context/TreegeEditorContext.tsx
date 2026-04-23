import { createContext, PropsWithChildren, useContext, useMemo, useState } from "react";
import { AIConfig } from "@/editor/types/ai";

export interface TreegeEditorContextValue {
  /**
   * Current language
   */
  language: string;
  /**
   * Current flow ID
   */
  flowId?: string;
  /**
   * Function to set the current flow ID
   * @param flow
   */
  setFlowId?: (flow?: string) => void;
  /**
   * AI configuration for tree generation
   */
  aiConfig?: AIConfig;
  /**
   * Whether the node actions sheet is open
   */
  isNodeSheetOpen: boolean;
  /**
   * Function to open or close the node actions sheet
   */
  setIsNodeSheetOpen: (open: boolean) => void;
  /**
   * ID of the node pending deletion confirmation, or null if no deletion is pending
   */
  pendingDeleteNodeId: string | null;
  /**
   * Open the deletion confirmation dialog for a given node
   */
  openDeleteNodeConfirmation: (id: string) => void;
  /**
   * Close the deletion confirmation dialog (cancels any pending deletion)
   */
  closeDeleteNodeConfirmation: () => void;
  /**
   * Pending node type change that requires user confirmation (when the target type only supports a single outgoing edge).
   */
  pendingNodeTypeChange: PendingNodeTypeChange | null;
  /**
   * Open the node type change confirmation dialog.
   */
  openNodeTypeChangeConfirmation: (payload: PendingNodeTypeChange) => void;
  /**
   * Close the node type change confirmation dialog (cancels the pending change).
   */
  closeNodeTypeChangeConfirmation: () => void;
}

export interface PendingNodeTypeChange {
  nodeId: string;
  type: string;
  subType?: string;
}

export interface TreegeEditorProviderProps extends PropsWithChildren {
  value: Omit<
    TreegeEditorContextValue,
    | "isNodeSheetOpen"
    | "setIsNodeSheetOpen"
    | "pendingDeleteNodeId"
    | "openDeleteNodeConfirmation"
    | "closeDeleteNodeConfirmation"
    | "pendingNodeTypeChange"
    | "openNodeTypeChangeConfirmation"
    | "closeNodeTypeChangeConfirmation"
  >;
}

export const TreegeEditorContext = createContext<TreegeEditorContextValue | null>(null);

export const TreegeEditorProvider = ({ children, value }: TreegeEditorProviderProps) => {
  const [flowId, setFlowId] = useState(value?.flowId);
  const [isNodeSheetOpen, setIsNodeSheetOpen] = useState(false);
  const [pendingDeleteNodeId, setPendingDeleteNodeId] = useState<string | null>(null);
  const [pendingNodeTypeChange, setPendingNodeTypeChange] = useState<PendingNodeTypeChange | null>(null);

  const valueMemo = useMemo(
    () => ({
      ...value,
      ...(value?.aiConfig && {
        aiConfig: {
          ...value.aiConfig,
          provider: value?.aiConfig.provider ?? "gemini",
        },
      }),
      closeDeleteNodeConfirmation: () => setPendingDeleteNodeId(null),
      closeNodeTypeChangeConfirmation: () => setPendingNodeTypeChange(null),
      flowId,
      isNodeSheetOpen,
      openDeleteNodeConfirmation: (id: string) => setPendingDeleteNodeId(id),
      openNodeTypeChangeConfirmation: (payload: PendingNodeTypeChange) => setPendingNodeTypeChange(payload),
      pendingDeleteNodeId,
      pendingNodeTypeChange,
      setFlowId,
      setIsNodeSheetOpen,
    }),
    [flowId, value, isNodeSheetOpen, pendingDeleteNodeId, pendingNodeTypeChange],
  );

  return <TreegeEditorContext.Provider value={valueMemo}>{children}</TreegeEditorContext.Provider>;
};

export const useTreegeEditorContext = () => {
  const context = useContext(TreegeEditorContext);

  return (
    context ?? {
      closeDeleteNodeConfirmation: () => {},
      closeNodeTypeChangeConfirmation: () => {},
      flowId: undefined,
      isNodeSheetOpen: false,
      language: "en",
      openDeleteNodeConfirmation: () => {},
      openNodeTypeChangeConfirmation: () => {},
      pendingDeleteNodeId: null,
      pendingNodeTypeChange: null,
      setFlowId: () => {},
      setIsNodeSheetOpen: () => {},
    }
  );
};
