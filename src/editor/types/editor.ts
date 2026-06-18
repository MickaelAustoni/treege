import { Edge, Node } from "@xyflow/react";
import { ReactNode } from "react";
import { AIConfig } from "@/editor/types/ai";
import { OpenApiDocument } from "@/editor/types/openapi";
import { Flow, HttpHeaders } from "@/shared/types/node";

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
   * Called (debounced) whenever the canvas changes, with the current flow
   * (id + nodes + edges). Use it for live preview or autosave. Unlike `onSave`
   * it is not gated on having input nodes, so it also reports an emptied canvas
   * after Clear. Unlike `onSave`/`onExportJson` it does NOT strip sensitive
   * headers — live consumers (e.g. `TreegeRenderer`) need the real flow, so do
   * not persist its output verbatim if that matters to you.
   */
  onChange?: (data: Flow) => void;
  /**
   * Theme for the editor interface.
   */
  theme?: "dark" | "light";
  /**
   * Controlled editor UI language. When provided, the editor runs in controlled
   * mode: this value always wins and the built-in switcher only fires
   * `onLanguageChange` — you must update this prop to actually change the
   * language. Leave undefined to let the editor manage it itself (see
   * `defaultLanguage`).
   */
  language?: string;
  /**
   * Initial editor UI language in uncontrolled mode. The editor seeds its
   * internal state with this value, then owns it so the user can switch at
   * runtime via the actions panel. Ignored when `language` is provided.
   * @default "en"
   */
  defaultLanguage?: string;
  /**
   * Called whenever the user switches the editor language via the built-in
   * switcher, with the newly selected language. Required to react to the change
   * in controlled mode; optional in uncontrolled mode (use it to persist or
   * sync the choice).
   */
  onLanguageChange?: (language: string) => void;
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
   * Base URL the produced tree is meant to run against. Pass the same value you
   * give to `TreegeRenderer`'s `baseUrl`. It drives two things in the editor:
   * - HTTP/Options-source urls are stored **relative** to it (route picker emits
   *   relative paths), so the exported JSON stays environment-agnostic.
   * - it is shown as a read-only prefix on URL fields and used to resolve the
   *   "Detect fields" probe, so editor-time previews hit a real host.
   *
   * Works with or without OpenAPI. When an OpenAPI document is loaded, its
   * `servers[0].url` (or the Authorize dialog override) takes precedence for
   * route resolution; otherwise this value is the base.
   */
  baseUrl?: string;
  /**
   * Global HTTP headers applied to in-editor requests (e.g. the "Detect
   * fields" button in `OptionsSourceForm`). Pass the same value you give to
   * `TreegeRenderer` so editor-time previews use the same auth and headers
   * that the runtime form will use.
   */
  headers?: HttpHeaders;
  /**
   * Called when the user submits the Authorize dialog. Receives the resulting
   * HTTP headers (`Authorization`, API key headers…). The consumer is expected
   * to forward those headers to `TreegeRenderer` (or `TreegeRendererProvider`)
   * via its `headers` prop so every request issued by the form is authenticated.
   */
  onAuthorize?: (headers: HttpHeaders) => void;
  /**
   * Called whenever the user edits the global headers via the editor's
   * built-in "Global headers" dialog. The component is controlled — the
   * parent is expected to update its `headers` state in response and pass
   * the new list back via the `headers` prop, so every editor-time and
   * runtime request reflects the change.
   */
  onHeadersChange?: (headers: HttpHeaders) => void;
}
