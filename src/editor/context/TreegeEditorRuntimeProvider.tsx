import { createContext, PropsWithChildren, useCallback, useContext, useMemo, useState } from "react";
import { AIConfig } from "@/editor/types/ai";
import { HttpHeaders } from "@/shared/types/node";

export interface TreegeEditorRuntimeContextValue {
  /**
   * Current language of the editor UI. Also used as the default language for
   * the per-node translation editor in `InputNodeForm`.
   */
  language: string;
  /**
   * Set the editor UI language at runtime (driven by the language switcher in
   * the actions panel). Seeded from the `language` prop, then owned internally;
   * the consumer can observe changes via `TreegeEditor`'s `onLanguageChange`.
   */
  setLanguage: (language: string) => void;
  /**
   * Current flow ID
   */
  flowId?: string;
  /**
   * Global HTTP headers used by editor-time HTTP calls (e.g. the
   * "Detect fields" button). Forwarded by the consumer; same shape and
   * semantics as `TreegeRenderer`'s `headers`.
   */
  headers?: HttpHeaders;
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
   * True once the flow is mounted and laid out: node previews may issue their
   * remote requests without waiting for a hover/selection (see `NodeInputPreview`).
   */
  previewsWarm: boolean;
  /**
   * Mark the flow as mounted and laid out (called by `ProgressiveMount` when it
   * settles, or by the editor shortly after mounting a small flow).
   */
  warmUpPreviews: () => void;
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

export interface TreegeEditorRuntimeProviderProps extends PropsWithChildren {
  value: Omit<
    TreegeEditorRuntimeContextValue,
    | "isNodeSheetOpen"
    | "setIsNodeSheetOpen"
    | "pendingDeleteNodeId"
    | "openDeleteNodeConfirmation"
    | "closeDeleteNodeConfirmation"
    | "pendingNodeTypeChange"
    | "openNodeTypeChangeConfirmation"
    | "closeNodeTypeChangeConfirmation"
    | "previewsWarm"
    | "warmUpPreviews"
  >;
}

export const TreegeEditorRuntimeContext = createContext<TreegeEditorRuntimeContextValue | null>(null);

export const TreegeEditorRuntimeProvider = ({ children, value }: TreegeEditorRuntimeProviderProps) => {
  const [flowId, setFlowId] = useState(value?.flowId);
  const [isNodeSheetOpen, setIsNodeSheetOpen] = useState(false);
  const [pendingDeleteNodeId, setPendingDeleteNodeId] = useState<string | null>(null);
  const [pendingNodeTypeChange, setPendingNodeTypeChange] = useState<PendingNodeTypeChange | null>(null);
  const [previewsWarm, setPreviewsWarm] = useState(false);
  const warmUpPreviews = useCallback(() => setPreviewsWarm(true), []);

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
      previewsWarm,
      setFlowId,
      setIsNodeSheetOpen,
      warmUpPreviews,
    }),
    [flowId, value, isNodeSheetOpen, pendingDeleteNodeId, pendingNodeTypeChange, previewsWarm, warmUpPreviews],
  );

  return <TreegeEditorRuntimeContext.Provider value={valueMemo}>{children}</TreegeEditorRuntimeContext.Provider>;
};

export const useTreegeEditorRuntime = () => {
  const context = useContext(TreegeEditorRuntimeContext);

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
      previewsWarm: false,
      setFlowId: () => {},
      setIsNodeSheetOpen: () => {},
      setLanguage: () => {},
      warmUpPreviews: () => {},
    }
  );
};
