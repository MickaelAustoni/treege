import { Node } from "@xyflow/react";
import { createContext, PropsWithChildren, useContext, useMemo } from "react";
import { FormValues } from "@/renderer/types/renderer";
import { mergeFlows } from "@/renderer/utils/flow";
import { Flow, HttpHeader, InputNodeData } from "@/shared/types/node";

export interface TreegeRendererContextValue {
  /**
   * The flow currently being rendered (already merged when several flows
   * are linked through `FlowNode`s). `null` when the renderer has no flow
   * to display yet.
   */
  flows?: Flow | null;
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
  headers?: HttpHeader[];
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
 * Sensible defaults for every required field of `TreegeRendererContextValue`.
 * Used both as the fallback when no provider is mounted, and as the base for
 * partial provider values (so callers like the editor's `NodeInputPreview`
 * can supply just `{ headers, language }` and let the rest stay no-op).
 */
const DEFAULT_CONTEXT_VALUE: TreegeRendererContextValue = {
  flows: null,
  formErrors: {},
  formValues: {},
  googleApiKey: undefined,
  headers: undefined,
  inputNodes: [],
  language: "",
  optionsDisplayLimit: undefined,
  setFieldValue: () => {},
};

export interface TreegeRendererProviderProps extends PropsWithChildren {
  /**
   * Any subset of `TreegeRendererContextValue`. Missing fields default to
   * sensible no-op values, so callers only need to supply what they actually
   * want to expose to descendants.
   */
  value: Partial<TreegeRendererContextValue>;
}

export const TreegeRendererContext = createContext<TreegeRendererContextValue | null>(null);

export const TreegeRendererProvider = ({ children, value }: TreegeRendererProviderProps) => {
  const merged = useMemo<TreegeRendererContextValue>(() => ({ ...DEFAULT_CONTEXT_VALUE, ...value }), [value]);
  return <TreegeRendererContext.Provider value={merged}>{children}</TreegeRendererContext.Provider>;
};

export const useTreegeRendererContext = () => {
  const context = useContext(TreegeRendererContext);
  const baseContext = context ?? DEFAULT_CONTEXT_VALUE;

  // Compute edges from flows for convenience (cached with useMemo)
  const edges = useMemo(() => {
    if (!baseContext.flows) {
      return [];
    }

    return mergeFlows(baseContext.flows).edges;
  }, [baseContext.flows]);

  return {
    ...baseContext,
    edges,
  };
};
