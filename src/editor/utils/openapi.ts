import { ApiRoute, ApiRouteMethod, OpenApiDocument, OpenApiPathItem, OpenApiSecurityScheme } from "@/editor/types/openapi";

/**
 * The HTTP methods we project out of an OpenAPI path item. Each entry pairs
 * the lower-case key used by the spec with the upper-case method we expose
 * in `ApiRoute`.
 */
const METHOD_KEYS: Array<{ key: keyof OpenApiPathItem; method: ApiRouteMethod }> = [
  { key: "get", method: "GET" },
  { key: "post", method: "POST" },
  { key: "put", method: "PUT" },
  { key: "delete", method: "DELETE" },
  { key: "patch", method: "PATCH" },
];

/**
 * Type guard validating that `value` is a usable OpenAPI 3.x document.
 * Rejects 2.0 (Swagger) since we don't support it.
 */
export const isOpenApi3Document = (value: unknown): value is OpenApiDocument => {
  if (!value || typeof value !== "object") {
    return false;
  }
  const doc = value as Record<string, unknown>;
  if (typeof doc.openapi !== "string" || !doc.openapi.startsWith("3.")) {
    return false;
  }
  return Boolean(doc.paths && typeof doc.paths === "object");
};

/**
 * Heuristic to discriminate between an inlined JSON document and a URL.
 * A leading `{` is unambiguous: URLs never start with one.
 */
const isJsonLiteral = (input: string): boolean => input.startsWith("{");

/**
 * GET the URL and return its parsed JSON body. Throws on non-2xx responses
 * so callers don't have to inspect status codes.
 */
const fetchRawDocument = async (url: string): Promise<unknown> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`);
  }
  return response.json();
};

/**
 * Resolve raw JSON from either an inlined literal or a URL. The caller-facing
 * `loadOpenApiDocument` then validates the OpenAPI shape on top.
 */
const readRawDocument = (input: string): Promise<unknown> =>
  isJsonLiteral(input) ? Promise.resolve(JSON.parse(input)) : fetchRawDocument(input);

/**
 * Load an OpenAPI document from either a remote URL or a raw JSON string.
 * Throws when the input is empty, unreachable, malformed JSON, or not an
 * OpenAPI 3.x document.
 */
export const loadOpenApiDocument = async (input: string): Promise<OpenApiDocument> => {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Empty input");
  }
  const raw = await readRawDocument(trimmed);
  if (!isOpenApi3Document(raw)) {
    throw new Error("Not a valid OpenAPI 3.x document");
  }
  return raw;
};

/**
 * Flatten every (method, path) tuple defined in the document, preserving
 * the path declaration order.
 */
export const extractApiRoutes = (doc: OpenApiDocument): ApiRoute[] => {
  const routes: ApiRoute[] = [];

  for (const [path, item] of Object.entries(doc.paths ?? {})) {
    if (!item) {
      continue;
    }
    for (const { key, method } of METHOD_KEYS) {
      const operation = item[key];
      if (operation) {
        routes.push({
          method,
          operationId: operation.operationId,
          path,
          summary: operation.summary,
        });
      }
    }
  }
  return routes;
};

/** Returns the first declared server URL (with any trailing slash trimmed). */
export const getBaseUrl = (doc: OpenApiDocument): string => (doc.servers?.[0]?.url ?? "").replace(/\/$/, "");

/** Resolve a path to a full URL using the document's first server. */
export const resolveRouteUrl = (doc: OpenApiDocument, path: string): string => {
  const baseUrl = getBaseUrl(doc);
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};

/**
 * Extract every supported security scheme from the document. Schemes other
 * than `http+bearer` and `apiKey-in-header` are silently dropped — they're
 * out of MVP scope.
 */
export const extractSecuritySchemes = (doc: OpenApiDocument): Array<{ name: string; scheme: OpenApiSecurityScheme }> => {
  const schemes = doc.components?.securitySchemes ?? {};
  const result: Array<{ name: string; scheme: OpenApiSecurityScheme }> = [];

  for (const [name, scheme] of Object.entries(schemes)) {
    if (!scheme || typeof scheme !== "object") {
      continue;
    }
    const s = scheme as unknown as Record<string, unknown>;

    if (s.type === "http" && s.scheme === "bearer") {
      result.push({
        name,
        scheme: {
          bearerFormat: typeof s.bearerFormat === "string" ? s.bearerFormat : undefined,
          description: typeof s.description === "string" ? s.description : undefined,
          scheme: "bearer",
          type: "http",
        },
      });
    } else if (s.type === "apiKey" && s.in === "header" && typeof s.name === "string") {
      result.push({
        name,
        scheme: {
          description: typeof s.description === "string" ? s.description : undefined,
          in: "header",
          name: s.name,
          type: "apiKey",
        },
      });
    } else if (s.type === "oauth2" && s.flows && typeof s.flows === "object") {
      const flows = s.flows as Record<string, unknown>;
      const passwordFlow = flows.password as Record<string, unknown> | undefined;
      if (passwordFlow && typeof passwordFlow.tokenUrl === "string") {
        result.push({
          name,
          scheme: {
            description: typeof s.description === "string" ? s.description : undefined,
            tokenUrl: passwordFlow.tokenUrl,
            type: "oauth2",
          },
        });
      }
    }
  }

  return result;
};

/**
 * Resolve a `tokenUrl` (which the OpenAPI spec sometimes leaves relative)
 * against the document's first declared server URL.
 */
export const resolveTokenUrl = (tokenUrl: string, doc: OpenApiDocument): string => {
  if (/^https?:\/\//i.test(tokenUrl)) {
    return tokenUrl;
  }
  const baseUrl = getBaseUrl(doc);
  if (!baseUrl) {
    return tokenUrl;
  }
  return `${baseUrl}/${tokenUrl.replace(/^\//, "")}`;
};
