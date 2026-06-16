import { ApiRouteMethod, OpenApiDocument, OpenApiPathItem, OpenApiSchema } from "@/editor/types/openapi";
import { getBaseUrl } from "@/editor/utils/openapi";

const REF_PREFIX = "#/components/schemas/";

/** Resolve a stored URL back to an OpenAPI path key (stripping the base if present). */
const pathFromUrl = (doc: OpenApiDocument, url: string): string => {
  const base = getBaseUrl(doc);
  const path = base && url.startsWith(base) ? url.slice(base.length) : url;
  return path.startsWith("/") ? path : `/${path}`;
};

/**
 *  Resolve a `#/components/schemas/Name` reference against the document.
 * @param doc
 * @param ref
 */
const resolveRef = (doc: OpenApiDocument, ref: string): OpenApiSchema | undefined =>
  ref.startsWith(REF_PREFIX) ? doc.components?.schemas?.[ref.slice(REF_PREFIX.length)] : undefined;

/**
 * Find the JSON request-body schema for the route matching `url` + `method`,
 * or `undefined` when the route has no JSON request body.
 */
export const findRouteRequestSchema = (doc: OpenApiDocument, url: string, method: ApiRouteMethod): OpenApiSchema | undefined => {
  if (!url) {
    return undefined;
  }

  const item = doc.paths?.[pathFromUrl(doc, url)];
  const operation = item?.[method.toLowerCase() as keyof OpenApiPathItem];
  const content = operation?.requestBody?.content;
  if (!content) {
    return undefined;
  }

  // Prefer application/json, otherwise fall back to the first declared media type.
  return content["application/json"]?.schema ?? Object.values(content)[0]?.schema;
};

/**
 * Build a JSON skeleton from a schema: uses `example`/`default`/`enum` when
 * present, otherwise a typed placeholder (`""`, `0`, `false`, `{}`, `[…]`).
 * `$ref`s are resolved against `components.schemas`; cyclic refs are cut off.
 */
export const buildPayloadSkeleton = (
  doc: OpenApiDocument,
  schema: OpenApiSchema | undefined,
  seenRefs: Set<string> = new Set(),
): unknown => {
  if (!schema) {
    return null;
  }

  if (schema.$ref) {
    if (seenRefs.has(schema.$ref)) {
      return {}; // Stop on cyclic references.
    }
    return buildPayloadSkeleton(doc, resolveRef(doc, schema.$ref), new Set(seenRefs).add(schema.$ref));
  }

  if (schema.example !== undefined) {
    return schema.example;
  }
  if (schema.default !== undefined) {
    return schema.default;
  }
  if (schema.enum && schema.enum.length > 0) {
    return schema.enum[0];
  }

  if (schema.type === "object" || schema.properties) {
    const result: Record<string, unknown> = {};
    for (const [key, propSchema] of Object.entries(schema.properties ?? {})) {
      result[key] = buildPayloadSkeleton(doc, propSchema, seenRefs);
    }
    return result;
  }

  if (schema.type === "array") {
    const item = schema.items ? buildPayloadSkeleton(doc, schema.items, seenRefs) : null;
    return item === null ? [] : [item];
  }

  switch (schema.type) {
    case "string":
      return "";
    case "number":
    case "integer":
      return 0;
    case "boolean":
      return false;
    default:
      return null;
  }
};
