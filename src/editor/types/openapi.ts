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
 * OAuth2 with the `password` grant. The user provides username + password
 * directly, the editor exchanges them at `tokenUrl` and uses the returned
 * access token as a Bearer header.
 *
 * Other OAuth2 flows (`authorization_code`, `client_credentials`, `implicit`)
 * are out of scope — they require browser redirects, server-side state, or
 * PKCE.
 */
export interface OpenApiOAuth2PasswordScheme {
  type: "oauth2";
  /** Resolved against `servers[0].url` when the spec uses a relative path. */
  tokenUrl: string;
  description?: string;
}

/**
 * Security schemes the editor supports today. Other schemes (OAuth2 flows
 * other than password, cookie/query API keys, openIdConnect) are filtered
 * out at extraction time.
 */
export type OpenApiSecurityScheme = OpenApiHttpBearerScheme | OpenApiApiKeyHeaderScheme | OpenApiOAuth2PasswordScheme;

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
