import { Node } from "@xyflow/react";
import { createContext, PropsWithChildren, useContext, useMemo } from "react";
import { FormValues } from "@/renderer/types/renderer";
import { Flow, HttpHeaders, InputNodeData } from "@/shared/types/node";

export interface TreegeRenderRuntimeContextValue {
  /**
   * Base URL prepended to every relative HTTP url issued by inputs. Absolute
   * urls are left untouched. Resolved from the renderer config and applied
   * after template-variable substitution.
   */
  baseUrl?: string;
  /**
   * The flow currently being rendered. `null` when the renderer has no flow
   * to display yet.
   */
  flow?: Flow | null;
  /**
   * Validation errors keyed by field id (`node.id`). Empty when the form
   * is valid. Renderers read their own entry to display field-level errors.
   */
  formErrors: Record<string, string>;
  /**
   * Current form values keyed by field id (`node.id`). Read by inputs to
   * resolve template variables (`{{fieldId}}` in URLs/headers/body) and to
   * drive conditional visibility from `useRenderNode`.
   */
  formValues: FormValues;
  /**
   * Google Maps Places API key for the address autocomplete input. When
   * unset, the address input falls back to the free Nominatim provider.
   */
  googleApiKey?: string;
  /**
   * Global HTTP headers (already merged from provider + props) to apply
   * to every request issued by inputs. Field-level headers override these
   * on key collision (case-insensitive).
   */
  headers?: HttpHeaders;
  /**
   * The flow's input nodes — exposed so renderers can resolve references
   * between fields (e.g. `convertFormValuesToNamedFormat`, reference-field
   * defaults).
   */
  inputNodes: Node<InputNodeData>[];
  /**
   * Active UI language (e.g. `"en"`, `"fr"`). Used both for static UI
   * strings (via `useTranslate`) and for resolving `Translatable` values
   * inside node data.
   */
  language: string;
  /**
   * Soft cap on the number of options rendered for option-based inputs
   * (radio, checkbox). When set, options past this count are replaced by
   * an ellipsis row. Used by the editor's `NodeInputPreview` to keep node
   * cards compact when an OpenAPI source returns hundreds of options.
   * Unset at runtime — every option is rendered.
   */
  optionsDisplayLimit?: number;
  /**
   * Update the value of a single field. Inputs call this from their
   * `onChange` to push edits up to the form's state.
   */
  setFieldValue: (fieldName: string, value: unknown) => void;
}

/**
 * Sensible defaults for every required field of `TreegeRenderRuntimeContextValue`.
 * Used both as the fallback when no provider is mounted, and as the base for
 * partial provider values (so callers like the editor's `NodeInputPreview`
 * can supply just `{ headers, language }` and let the rest stay no-op).
 */
const DEFAULT_CONTEXT_VALUE: TreegeRenderRuntimeContextValue = {
  baseUrl: undefined,
  flow: null,
  formErrors: {},
  formValues: {},
  googleApiKey: undefined,
  headers: undefined,
  inputNodes: [],
  language: "",
  optionsDisplayLimit: undefined,
  setFieldValue: () => {},
};

export interface TreegeRenderRuntimeProviderProps extends PropsWithChildren {
  /**
   * Any subset of `TreegeRenderRuntimeContextValue`. Missing fields default to
   * sensible no-op values, so callers only need to supply what they actually
   * want to expose to descendants.
   */
  value: Partial<TreegeRenderRuntimeContextValue>;
}

export const TreegeRenderRuntimeContext = createContext<TreegeRenderRuntimeContextValue | null>(null);

export const TreegeRenderRuntimeProvider = ({ children, value }: TreegeRenderRuntimeProviderProps) => {
  const merged = useMemo<TreegeRenderRuntimeContextValue>(() => ({ ...DEFAULT_CONTEXT_VALUE, ...value }), [value]);
  return <TreegeRenderRuntimeContext.Provider value={merged}>{children}</TreegeRenderRuntimeContext.Provider>;
};

export const useTreegeRenderRuntime = () => {
  const context = useContext(TreegeRenderRuntimeContext);
  const baseContext = context ?? DEFAULT_CONTEXT_VALUE;
  const edges = useMemo(() => baseContext.flow?.edges ?? [], [baseContext.flow]); // Convenience accessor (kept memoized for stable identity).

  return {
    ...baseContext,
    edges,
  };
};
