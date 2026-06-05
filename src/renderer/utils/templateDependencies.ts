import { Node } from "@xyflow/react";
import { FormValues, MissingDependency } from "@/renderer/types/renderer";
import { resolveNodeLabel } from "@/renderer/utils/node";
import { InputNodeData } from "@/shared/types/node";

const TEMPLATE_VAR_REGEX = /\{\{([\w-]+)}}/g;

const isEmpty = (value: unknown): boolean => value === undefined || value === null || value === "";

/** Collect every `{{nodeId}}` reference in the given strings, de-duplicated and order-preserving. */
const extractRefs = (...templates: (string | undefined)[]): string[] => {
  const ids: string[] = [];

  for (const template of templates) {
    if (!template) {
      continue;
    }
    for (const match of template.matchAll(TEMPLATE_VAR_REGEX)) {
      if (!ids.includes(match[1])) {
        ids.push(match[1]);
      }
    }
  }

  return ids;
};

/**
 * The node ids an input's dynamic request depends on — every `{{nodeId}}`
 * referenced in its `httpConfig` or `optionsSource` url, query-param values, or
 * body. These are the fields that must be filled before the input can fetch its
 * options. Headers are excluded: they carry auth/global values, not user-filled
 * form fields.
 */
export const getTemplateDependencyIds = (node: Node<InputNodeData>): string[] => {
  const config = node.data.httpConfig ?? node.data.optionsSource;

  if (!config) {
    return [];
  }

  const queryValues = config.queryParams?.map((param) => param.value) ?? [];
  return extractRefs(config.url, config.body, ...queryValues);
};

/**
 * The input's template dependencies that are not yet filled, paired with the
 * referenced field's translated label. Pure counterpart of
 * `useMissingDependencies` — used where hooks can't run (e.g. the render loop
 * in `useRenderNode`).
 */
export const getMissingDependencies = (
  node: Node<InputNodeData>,
  formValues: FormValues,
  inputNodes: Node<InputNodeData>[],
  language: string,
): MissingDependency[] =>
  getTemplateDependencyIds(node)
    .filter((id) => isEmpty(formValues[id]))
    .map((id) => {
      const refNode = inputNodes.find((n) => n.id === id);
      return { id, label: refNode ? resolveNodeLabel(refNode, language) : id };
    });
