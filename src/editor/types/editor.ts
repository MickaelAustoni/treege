import { Edge, Node } from "@xyflow/react";
import { ReactNode } from "react";
import { AIConfig } from "@/editor/types/ai";
import { OpenApiDocument } from "@/editor/types/openapi";
import { Flow, HttpHeader } from "@/shared/types/node";

export interface ExtraMenuItem {
  /**
   * Label displayed in the menu item.
   */
  label: ReactNode;
  /**
   * Optional icon rendered before the label.
   */
  icon?: ReactNode;
  /**
   * Callback triggered when the menu item is clicked.
   */
  onClick?: () => void;
  /**
   * When true, styles the item as destructive.
   */
  destructive?: boolean;
}

export interface TreegeEditorProps {
  /**
   * Default flow structure containing combined nodes and edges.
   * Note: Individual defaultNodes/defaultEdges props take precedence over this.
   */
  flow?: Flow | null;
  /**
   * Callback function triggered when exporting JSON data.
   */
  onExportJson?: () => { nodes: Node[]; edges: Edge[] } | undefined;
  /**
   * Callback function triggered when saving the flow data.
   * @param data
   */
  onSave?: (data: Flow) => void;
  /**
   * Theme for the editor interface.
   */
  theme?: "dark" | "light";
  /**
   * Language for the editor interface.
   */
  language?: string;
  /**
   * AI configuration for tree generation
   */
  aiConfig?: AIConfig;
  /**
   * Additional CSS class names for custom styling.
   */
  className?: string;
  /**
   * Extra menu items to append to the "more" dropdown of the actions panel.
   */
  extraMenuItems?: ExtraMenuItem[];
  /**
   * OpenAPI 3.x source used to power URL/route suggestions inside HTTP and
   * Options-source forms, and to drive the Authorize flow. Accepts either:
   * - a pre-parsed `OpenApiDocument` object
   * - a URL string (the editor fetches it on mount and toasts on failure)
   *
   * Users can still load one at runtime via the editor's "OpenAPI" button.
   */
  openApi?: OpenApiDocument | string;
  /**
   * Base URL used for OpenAPI route resolution. When set, it takes precedence
   * over the document's `servers[0].url` — useful when the spec points at a
   * different environment than the one to call (e.g. staging vs prod).
   */
  openApiBaseUrl?: string;
  /**
   * Global HTTP headers applied to in-editor requests (e.g. the "Detect
   * fields" button in `OptionsSourceForm`). Pass the same value you give to
   * `TreegeRenderer` so editor-time previews use the same auth and headers
   * that the runtime form will use.
   */
  headers?: HttpHeader[];
  /**
   * Called when the user submits the Authorize dialog. Receives the resulting
   * HTTP headers (`Authorization`, API key headers…). The consumer is expected
   * to forward those headers to `TreegeRenderer` (or `TreegeConfigProvider`)
   * via its `headers` prop so every request issued by the form is authenticated.
   */
  onAuthorize?: (headers: HttpHeader[]) => void;
  /**
   * Called whenever the user edits the global headers via the editor's
   * built-in "Global headers" dialog. The component is controlled — the
   * parent is expected to update its `headers` state in response and pass
   * the new list back via the `headers` prop, so every editor-time and
   * runtime request reflects the change.
   */
  onHeadersChange?: (headers: HttpHeader[]) => void;
}
