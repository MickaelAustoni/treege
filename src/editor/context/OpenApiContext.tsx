import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ApiRoute, OpenApiDocument } from "@/editor/types/openapi";
import { extractApiRoutes, getBaseUrl, loadOpenApiDocument } from "@/editor/utils/openapi";

/**
 * The exact input the user fed to the OpenAPI dialog last time it loaded
 * successfully. Kept around so re-opening the dialog can pre-fill the field
 * (the user may want to tweak/re-load the same source).
 */
export type OpenApiSourceInput = { mode: "url"; value: string } | { mode: "json"; value: string };

interface OpenApiContextValue {
  /**
   * The currently loaded OpenAPI document, or `null` when none is set.
   */
  document: OpenApiDocument | null;
  /**
   * Memoized flat list of routes derived from `document`.
   */
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
  /**
   * Last source input (URL or pasted JSON) used to load the document. `null`
   * before the user has loaded anything.
   */
  lastSourceInput: OpenApiSourceInput | null;
  /**
   * Replace the loaded document. Pass `null` to clear.
   */
  setDocument: (next: OpenApiDocument | null) => void;
  /**
   * Replace the base URL override. Pass `""` to clear.
   */
  setBaseUrlOverride: (next: string) => void;
  /**
   * Record the last source input the user used to load the document.
   */
  setLastSourceInput: (next: OpenApiSourceInput | null) => void;
}

const EMPTY: OpenApiContextValue = {
  baseUrl: "",
  baseUrlOverride: "",
  document: null,
  lastSourceInput: null,
  routes: [],
  setBaseUrlOverride: () => {},
  setDocument: () => {},
  setLastSourceInput: () => {},
};

const OpenApiContext = createContext<OpenApiContextValue | null>(null);

interface OpenApiProviderProps {
  children: ReactNode;
  /**
   * Initial OpenAPI source. Accepts either a pre-parsed document or a URL
   * string — when a URL is given, the provider fetches it on mount and
   * toasts on failure (matching the runtime behavior of the dialog).
   */
  initialDocument?: OpenApiDocument | string | null;
  /**
   * Initial base URL. When set, takes precedence over the document's
   * `servers[0].url`. Empty string means "no override".
   */
  initialBaseUrl?: string;
}

/**
 * Holds the current OpenAPI document at editor scope. The document is
 * editor-local state (not persisted in the flow JSON), so reloading the
 * editor with a different consumer-supplied initial document is supported.
 */
export const OpenApiProvider = ({ children, initialDocument, initialBaseUrl }: OpenApiProviderProps) => {
  const [document, setDocument] = useState<OpenApiDocument | null>(typeof initialDocument === "object" ? (initialDocument ?? null) : null);
  const [baseUrlOverride, setBaseUrlOverride] = useState(initialBaseUrl ?? "");
  const [lastSourceInput, setLastSourceInput] = useState<OpenApiSourceInput | null>(
    typeof initialDocument === "string" ? { mode: "url", value: initialDocument } : null,
  );

  const routes = useMemo(() => (document ? extractApiRoutes(document) : []), [document]);

  const baseUrl = useMemo(() => {
    const trimmedOverride = baseUrlOverride.trim().replace(/\/$/, "");
    if (trimmedOverride) {
      return trimmedOverride;
    }
    return document ? getBaseUrl(document) : "";
  }, [document, baseUrlOverride]);

  const value = useMemo<OpenApiContextValue>(
    () => ({
      baseUrl,
      baseUrlOverride,
      document,
      lastSourceInput,
      routes,
      setBaseUrlOverride,
      setDocument,
      setLastSourceInput,
    }),
    [baseUrl, baseUrlOverride, document, lastSourceInput, routes],
  );

  /**
   * Auto-load the document when the consumer provided a URL. Runs once per
   * distinct URL — if the prop changes at runtime we re-fetch.
   */
  useEffect(() => {
    if (typeof initialDocument !== "string") {
      return;
    }
    const url = initialDocument;
    let cancelled = false;
    loadOpenApiDocument(url)
      .then((doc) => {
        if (!cancelled) {
          setDocument(doc);
          setLastSourceInput({ mode: "url", value: url });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : String(error));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [initialDocument]);

  return <OpenApiContext.Provider value={value}>{children}</OpenApiContext.Provider>;
};

/**
 * Read the OpenAPI context. Returns a no-op default outside of the provider
 * so consumers (e.g., URL combobox) don't have to null-check.
 */
export const useOpenApi = (): OpenApiContextValue => useContext(OpenApiContext) ?? EMPTY;
