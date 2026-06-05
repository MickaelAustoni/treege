import { Node } from "@xyflow/react";
import { useMemo } from "react";
import { useTreegeRendererContext } from "@/renderer/context/TreegeRendererContext";
import { MissingDependency } from "@/renderer/types/renderer";
import { getMissingDependencies } from "@/renderer/utils/templateDependencies";
import { InputNodeData } from "@/shared/types/node";

export type { MissingDependency };

/**
 * The fields an input's dynamic options depend on that are not yet filled.
 * Returns an empty array when the input has no template dependencies or all of
 * them are filled. Used to hint the user which fields to complete before the
 * input can load its options (e.g. an HTTP url with `{{otherFieldId}}`).
 */
export const useMissingDependencies = (node: Node<InputNodeData>): MissingDependency[] => {
  const { formValues, inputNodes, language } = useTreegeRendererContext();

  return useMemo(() => getMissingDependencies(node, formValues, inputNodes, language), [node, formValues, inputNodes, language]);
};
