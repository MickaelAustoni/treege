/**
 * Minimal OpenAPI 3.x types — only what the editor needs to suggest API
 * routes and authenticate against an API. Not a full OpenAPI definition.
 *
 * Swagger 2.0 (`swagger: "2.0"`) is intentionally not supported.
 */

export interface OpenApiDocument {
  openapi: string;
  info?: { title?: string; version?: string; description?: string };
  servers?: Array<{ url: string; description?: string }>;
  paths: Record<string, OpenApiPathItem | undefined>;
  components?: {
    securitySchemes?: Record<string, OpenApiSecurityScheme | undefined>;
  };
}

export interface OpenApiPathItem {
  get?: OpenApiOperation;
  put?: OpenApiOperation;
  post?: OpenApiOperation;
  delete?: OpenApiOperation;
  patch?: OpenApiOperation;
}

export interface OpenApiOperation {
  summary?: string;
  description?: string;
  tags?: string[];
  operationId?: string;
}

/** HTTP Bearer auth scheme. */
export interface OpenApiHttpBearerScheme {
  type: "http";
  scheme: "bearer";
  bearerFormat?: string;
  description?: string;
}

/** Header-based API key auth scheme. */
export interface OpenApiApiKeyHeaderScheme {
  type: "apiKey";
  in: "header";
  name: string;
  description?: string;
}

/**
 * Security schemes the editor supports today. Other schemes (OAuth2,
 * cookie/query API keys, openIdConnect) are filtered out at extraction time.
 */
export type OpenApiSecurityScheme = OpenApiHttpBearerScheme | OpenApiApiKeyHeaderScheme;

export type ApiRouteMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

/**
 * One operation extracted from an OpenAPI document, flattened to a single
 * (method, path) record for easy listing.
 */
export interface ApiRoute {
  method: ApiRouteMethod;
  path: string;
  summary?: string;
  operationId?: string;
}
