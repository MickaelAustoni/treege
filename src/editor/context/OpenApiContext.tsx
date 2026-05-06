import { createContext, ReactNode, useContext, useMemo, useState } from "react";
import { ApiRoute, OpenApiDocument } from "@/editor/types/openapi";
import { extractApiRoutes } from "@/editor/utils/openapi";

interface OpenApiContextValue {
  /** The currently loaded OpenAPI document, or `null` when none is set. */
  document: OpenApiDocument | null;
  /** Memoized flat list of routes derived from `document`. */
  routes: ApiRoute[];
  /** Replace the loaded document. Pass `null` to clear. */
  setDocument: (next: OpenApiDocument | null) => void;
}

const EMPTY: OpenApiContextValue = {
  document: null,
  routes: [],
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
  const routes = useMemo(() => (document ? extractApiRoutes(document) : []), [document]);
  const value = useMemo<OpenApiContextValue>(() => ({ document, routes, setDocument }), [document, routes]);

  return <OpenApiContext.Provider value={value}>{children}</OpenApiContext.Provider>;
};

/**
 * Read the OpenAPI context. Returns a no-op default outside of the provider
 * so consumers (e.g., URL combobox) don't have to null-check.
 */
export const useOpenApi = (): OpenApiContextValue => useContext(OpenApiContext) ?? EMPTY;
