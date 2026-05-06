import { Node } from "@xyflow/react";
import { createContext, PropsWithChildren, useContext, useMemo } from "react";
import { FormValues } from "@/renderer/types/renderer";
import { mergeFlows } from "@/renderer/utils/flow";
import { Flow, HttpHeader, InputNodeData } from "@/shared/types/node";

export interface TreegeRendererContextValue {
  flows?: Flow | null;
  formErrors: Record<string, string>;
  formValues: FormValues;
  googleApiKey?: string;
  /**
   * Global HTTP headers (already merged from provider + props) to apply
   * to every request issued by inputs. Field-level headers override these.
   */
  headers?: HttpHeader[];
  inputNodes: Node<InputNodeData>[];
  language: string;
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
