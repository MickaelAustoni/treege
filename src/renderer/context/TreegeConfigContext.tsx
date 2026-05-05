import { createContext, ReactNode, useContext } from "react";
import { TreegeRendererConfig } from "@/renderer/types/renderer";

const TreegeConfigContext = createContext<TreegeRendererConfig | undefined>(undefined);

/**
 * Hook to access the global Treege configuration
 * Returns undefined if used outside of TreegeConfigProvider
 */
export const useTreegeConfig = (): TreegeRendererConfig | undefined => {
  return useContext(TreegeConfigContext);
};

export type TreegeConfigProviderProps = TreegeRendererConfig & {
  children: ReactNode;
};

/**
 * Provider for global Treege configuration
 * Wrap your app with this provider to set default options for all TreegeRenderer instances
 */
export const TreegeConfigProvider = ({ children, ...config }: TreegeConfigProviderProps) => (
  <TreegeConfigContext.Provider value={config}>{children}</TreegeConfigContext.Provider>
);
