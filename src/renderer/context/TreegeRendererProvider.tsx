import { createContext, ReactNode, useContext } from "react";
import { TreegeRendererConfig } from "@/renderer/types/renderer";

const TreegeRendererContext = createContext<TreegeRendererConfig | undefined>(undefined);

/**
 * Hook to access the global Treege configuration
 * Returns undefined if used outside of TreegeRendererProvider
 */
export const useTreegeRendererConfig = (): TreegeRendererConfig | undefined => {
  return useContext(TreegeRendererContext);
};

export type TreegeRendererProviderProps = TreegeRendererConfig & {
  children: ReactNode;
};

/**
 * Provider for global Treege configuration
 * Wrap your app with this provider to set default options for all TreegeRenderer instances
 */
export const TreegeRendererProvider = ({ children, ...config }: TreegeRendererProviderProps) => (
  <TreegeRendererContext.Provider value={config}>{children}</TreegeRendererContext.Provider>
);
