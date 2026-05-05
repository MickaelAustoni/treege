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
  headers?: HttpHeader[];
  inputNodes: Node<InputNodeData>[];
  language: string;
  setFieldValue: (fieldName: string, value: unknown) => void;
}

export interface TreegeRendererProviderProps extends PropsWithChildren {
  value: TreegeRendererContextValue;
}

export const TreegeRendererContext = createContext<TreegeRendererContextValue | null>(null);

export const TreegeRendererProvider = ({ children, value }: TreegeRendererProviderProps) => (
  <TreegeRendererContext.Provider value={value}>{children}</TreegeRendererContext.Provider>
);

export const useTreegeRendererContext = () => {
  const context = useContext(TreegeRendererContext);

  const baseContext = context ?? {
    flows: null,
    formErrors: {},
    formValues: {},
    googleApiKey: undefined,
    headers: undefined,
    inputNodes: [],
    language: "",
    setFieldValue: () => {},
  };

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
