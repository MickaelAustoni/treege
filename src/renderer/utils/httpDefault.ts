import { Node } from "@xyflow/react";
import { FormValues } from "@/renderer/types/renderer";
import { applyReferenceTransformation, isFieldEmpty } from "@/renderer/utils/form";
import {
  getValueByPath,
  HttpRequestOptions,
  mergeHttpHeaders,
  replaceTemplateVariables,
  resolveTemplateRecord,
  resolveUrl,
} from "@/renderer/utils/http";
import { resolveTemplateToJson } from "@/renderer/utils/jsonTemplate";
import { getTemplateDependencyIds } from "@/renderer/utils/templateDependencies";
import { HttpDefaultSource, HttpHeaders, InputNodeData } from "@/shared/types/node";

const METHODS_WITH_BODY = ["POST", "PUT", "PATCH"];

/**
 * The remote source of an input whose `defaultValue` is of type `"http"`, or
 * `undefined` when the node has no usable one (no url).
 */
export const getHttpDefaultSource = (node: Node<InputNodeData>): HttpDefaultSource | undefined => {
  const { defaultValue } = node.data;

  if (defaultValue?.type !== "http" || !defaultValue.httpSource?.url) {
    return undefined;
  }

  return defaultValue.httpSource;
};

/**
 * True when one of the `{{nodeId}}` fields the source depends on is still
 * empty — the request cannot be issued yet.
 */
export const hasUnresolvedHttpDefaultDependencies = (node: Node<InputNodeData>, formValues: FormValues): boolean =>
  getTemplateDependencyIds(node).some((id) => isFieldEmpty(formValues[id]));

/**
 * Build the request for an http default: every template variable resolved
 * against the current form values, relative url resolved against `baseUrl`,
 * field-level headers merged over the global ones.
 */
export const resolveHttpDefaultRequest = (
  source: HttpDefaultSource,
  formValues: FormValues,
  options: { baseUrl?: string; headers?: HttpHeaders } = {},
): HttpRequestOptions => {
  const method = source.method ?? "GET";

  return {
    body: METHODS_WITH_BODY.includes(method) ? resolveTemplateToJson(source.body, formValues, []) : undefined,
    headers: mergeHttpHeaders(resolveTemplateRecord(options.headers, formValues), resolveTemplateRecord(source.headers, formValues)),
    method,
    queryParams: resolveTemplateRecord(source.queryParams, formValues) ?? {},
    url: resolveUrl(replaceTemplateVariables(source.url, formValues, { encode: true }), options.baseUrl),
  };
};

/**
 * Identity of a resolved request: the field is re-derived only when this
 * changes. Headers are excluded on purpose — a refreshed auth token must not
 * trigger a new derivation.
 */
export const getHttpDefaultRequestSignature = (request: HttpRequestOptions): string =>
  JSON.stringify({ body: request.body, method: request.method, queryParams: request.queryParams, url: request.url });

/**
 * Turn a response into the field value:
 * 1. narrow the response to `responsePath` (the whole response when unset);
 * 2. when a `template` is set, render it from the extracted value's own fields
 *    (`{{value}}` stands for a scalar extracted value) — duplicate whitespace is
 *    collapsed and separators left dangling by blank optional fields are trimmed;
 * 3. otherwise apply the node's `transformFunction`/`objectMapping`, like a
 *    reference default would.
 *
 * Returns `undefined` when nothing could be extracted, so the field is left untouched.
 */
export const deriveHttpDefaultValue = (
  responseData: unknown,
  source: HttpDefaultSource,
  defaultValue: NonNullable<InputNodeData["defaultValue"]>,
): unknown => {
  const extracted = getValueByPath(responseData, source.responsePath ?? "");

  if (extracted === undefined || extracted === null) {
    return undefined;
  }

  if (source.template) {
    const scope = typeof extracted === "object" && !Array.isArray(extracted) ? (extracted as FormValues) : { value: extracted };

    return replaceTemplateVariables(source.template, scope)
      .replace(/\s+/g, " ")
      .replace(/^[\s,]+|[\s,]+$/g, "");
  }

  return applyReferenceTransformation(extracted, defaultValue.transformFunction, defaultValue.objectMapping);
};
