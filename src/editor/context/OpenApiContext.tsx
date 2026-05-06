import { createContext, ReactNode, useContext, useMemo, useState } from "react";
import { ApiRoute, OpenApiDocument } from "@/editor/types/openapi";
import { extractApiRoutes, getBaseUrl } from "@/editor/utils/openapi";

interface OpenApiContextValue {
  /** The currently loaded OpenAPI document, or `null` when none is set. */
  document: OpenApiDocument | null;
  /** Memoized flat list of routes derived from `document`. */
  routes: ApiRoute[];
  /**
   * User-provided base URL that overrides the document's `servers[0].url`.
   * Useful when the OpenAPI spec points at a different environment than the
   * one the user wants to call (e.g. staging vs prod). Empty string means
   * "no override — use the document's declared server".
   */
  baseUrlOverride: string;
  /**
   * Effective base URL: the override when non-empty, otherwise the document's
   * first declared server. Trailing slash trimmed.
   */
  baseUrl: string;
  /** Replace the loaded document. Pass `null` to clear. */
  setDocument: (next: OpenApiDocument | null) => void;
  /** Replace the base URL override. Pass `""` to clear. */
  setBaseUrlOverride: (next: string) => void;
}

const EMPTY: OpenApiContextValue = {
  baseUrl: "",
  baseUrlOverride: "",
  document: null,
  routes: [],
  setBaseUrlOverride: () => {},
  setDocument: () => {},
};

const OpenApiContext = createContext<OpenApiContextValue | null>(null);

interface OpenApiProviderProps {
  children: ReactNode;
  initialDocument?: OpenApiDocument | null;
}

/**
 * Holds the current OpenAPI document at editor scope. The document is
 * editor-local state (not persisted in the flow JSON), so reloading the
 * editor with a different consumer-supplied initial document is supported.
 */
export const OpenApiProvider = ({ children, initialDocument }: OpenApiProviderProps) => {
  const [document, setDocument] = useState<OpenApiDocument | null>(initialDocument ?? null);
  const [baseUrlOverride, setBaseUrlOverride] = useState("");
  const routes = useMemo(() => (document ? extractApiRoutes(document) : []), [document]);
  const baseUrl = useMemo(() => {
    const trimmedOverride = baseUrlOverride.trim().replace(/\/$/, "");
    if (trimmedOverride) {
      return trimmedOverride;
    }
    return document ? getBaseUrl(document) : "";
  }, [document, baseUrlOverride]);

  const value = useMemo<OpenApiContextValue>(
    () => ({ baseUrl, baseUrlOverride, document, routes, setBaseUrlOverride, setDocument }),
    [baseUrl, baseUrlOverride, document, routes],
  );

  return <OpenApiContext.Provider value={value}>{children}</OpenApiContext.Provider>;
};

/**
 * Read the OpenAPI context. Returns a no-op default outside of the provider
 * so consumers (e.g., URL combobox) don't have to null-check.
 */
export const useOpenApi = (): OpenApiContextValue => useContext(OpenApiContext) ?? EMPTY;
