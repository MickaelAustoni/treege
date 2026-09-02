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
 * The node ids an input's dynamic requests depend on — every `{{nodeId}}`
 * referenced in the url, query-param values, or body of its `httpConfig` /
 * `optionsSource`, and of its http default value (`defaultValue.httpSource`).
 * These are the fields that must be filled before the input can fetch its
 * options or derive its value. Headers are excluded: they carry auth/global
 * values, not user-filled form fields.
 */
export const getTemplateDependencyIds = (node: Node<InputNodeData>): string[] => {
  const { httpConfig, optionsSource, defaultValue } = node.data;
  const httpSource = defaultValue?.type === "http" ? defaultValue.httpSource : undefined;
  const configs = [httpConfig ?? optionsSource, httpSource].filter((config) => config !== undefined);

  return extractRefs(...configs.flatMap((config) => [config.url, config.body, ...Object.values(config.queryParams ?? {})]));
};

/**
 * The input's template dependencies that are not yet filled, paired with the
 * referenced field's translated label. Computed centrally in `useRenderNode`
 * and passed to every input renderer as `extra.missingDependencies`.
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
