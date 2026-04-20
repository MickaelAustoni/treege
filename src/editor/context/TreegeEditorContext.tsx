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
}

export interface TreegeEditorProviderProps extends PropsWithChildren {
  value: Omit<TreegeEditorContextValue, "isNodeSheetOpen" | "setIsNodeSheetOpen">;
}

export const TreegeEditorContext = createContext<TreegeEditorContextValue | null>(null);

export const TreegeEditorProvider = ({ children, value }: TreegeEditorProviderProps) => {
  const [flowId, setFlowId] = useState(value?.flowId);
  const [isNodeSheetOpen, setIsNodeSheetOpen] = useState(false);

  const valueMemo = useMemo(
    () => ({
      ...value,
      ...(value?.aiConfig && {
        aiConfig: {
          ...value.aiConfig,
          provider: value?.aiConfig.provider ?? "gemini",
        },
      }),
      flowId,
      isNodeSheetOpen,
      setFlowId,
      setIsNodeSheetOpen,
    }),
    [flowId, value, isNodeSheetOpen],
  );

  return <TreegeEditorContext.Provider value={valueMemo}>{children}</TreegeEditorContext.Provider>;
};

export const useTreegeEditorContext = () => {
  const context = useContext(TreegeEditorContext);

  return (
    context ?? {
      flowId: undefined,
      isNodeSheetOpen: false,
      language: "en",
      setFlowId: () => {},
      setIsNodeSheetOpen: () => {},
    }
  );
};
