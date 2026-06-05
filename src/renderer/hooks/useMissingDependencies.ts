import { Node } from "@xyflow/react";
import { useMemo } from "react";
import { useTreegeRendererContext } from "@/renderer/context/TreegeRendererContext";
import { resolveNodeLabel } from "@/renderer/utils/node";
import { getTemplateDependencyIds } from "@/renderer/utils/templateDependencies";
import { InputNodeData } from "@/shared/types/node";

export interface MissingDependency {
  /** The referenced node id. */
  id: string;
  /** The referenced field's translated, end-user-facing label. */
  label: string;
}

const isEmpty = (value: unknown): boolean => value === undefined || value === null || value === "";

/**
 * The fields an input's dynamic options depend on that are not yet filled.
 * Returns an empty array when the input has no template dependencies or all of
 * them are filled. Used to hint the user which fields to complete before the
 * input can load its options (e.g. an HTTP url with `{{otherFieldId}}`).
 */
export const useMissingDependencies = (node: Node<InputNodeData>): MissingDependency[] => {
  const { formValues, inputNodes, language } = useTreegeRendererContext();

  return useMemo(() => {
    return getTemplateDependencyIds(node)
      .filter((id) => isEmpty(formValues[id]))
      .map((id) => {
        const refNode = inputNodes.find((n) => n.id === id);
        return { id, label: refNode ? resolveNodeLabel(refNode, language) : id };
      });
  }, [node, formValues, inputNodes, language]);
};
