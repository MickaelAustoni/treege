import { ReactNode } from "react";
import { TreegeRendererProvider } from "@/renderer/context/TreegeRendererProvider";

export interface TreegeViewerProviderProps {
  children: ReactNode;
  /**
   * Light/dark theme applied to every `TreegeViewer` underneath.
   */
  theme?: "light" | "dark";
  /**
   * Base URL used to resolve relative file paths into absolute URLs.
   */
  baseUrl?: string;
  /**
   * Language used to resolve translatable labels/options.
   */
  language?: string;
}

/**
 * Config provider for {@link TreegeViewer}. It's a thin wrapper over
 * `TreegeRendererProvider` that exposes only the options a read-only viewer
 * actually uses — `theme`, `baseUrl` and `language` — so an app that consumes
 * `TreegeViewer` (without `TreegeRenderer`) gets a focused API and can set them
 * once for the whole subtree instead of on every viewer.
 *
 * Since it delegates to `TreegeRendererProvider`, `TreegeViewer` reads the values
 * through the same `useTreegeRendererConfig` context.
 */
const TreegeViewerProvider = ({ children, theme, baseUrl, language }: TreegeViewerProviderProps) => (
  <TreegeRendererProvider theme={theme} baseUrl={baseUrl} language={language}>
    {children}
  </TreegeRendererProvider>
);

export default TreegeViewerProvider;
