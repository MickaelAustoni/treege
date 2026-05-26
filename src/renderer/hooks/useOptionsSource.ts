import { useEffect, useMemo, useRef, useState } from "react";
import { useTreegeRendererContext } from "@/renderer/context/TreegeRendererContext";
import { extractOptionsFromResponse, makeHttpRequest, mergeHttpHeaders, replaceTemplateVariables } from "@/renderer/utils/http";
import { HttpHeader, InputOption, OptionsSource } from "@/shared/types/node";

const TEMPLATE_VAR_REGEX = /\{\{([\w-]+)}}/g;

const extractTemplateVars = (template: string): string[] => Array.from(template.matchAll(TEMPLATE_VAR_REGEX), (m) => m[1]);

interface UseOptionsSourceResult {
  /** Fetched options. `null` when no source configured, fetch hasn't completed, or fetch errored. */
  options: InputOption[] | null;
  /** True while a request is in flight. */
  isLoading: boolean;
  /** Error message if the latest fetch failed; otherwise `null`. */
  error: string | null;
  /** True when the source is configured well enough to attempt a fetch (URL + mapping + all template vars filled). */
  hasConfiguredSource: boolean;
}

/**
 * Fetches a list of options from a remote API and maps them to InputOption[]
 * using the provided mapping. Re-fetches when the URL's template variable
 * values change. Returns `options: null` until the first successful fetch
 * completes, so callers can fall back to static options seamlessly.
 *
 * Designed for option-based inputs (radio, checkbox, select, autocomplete)
 * whose option list comes from an API at runtime.
 */
export const useOptionsSource = (source: OptionsSource | undefined): UseOptionsSourceResult => {
  const { formValues, headers: globalHeaders } = useTreegeRendererContext();

  const [state, setState] = useState<{ options: InputOption[] | null; isLoading: boolean; error: string | null }>({
    error: null,
    isLoading: false,
    options: null,
  });

  // Keep latest values in refs so the effect can read them without
  // re-subscribing on every render (only on actual signal changes).
  const sourceRef = useRef(source);
  const formValuesRef = useRef(formValues);
  const globalHeadersRef = useRef(globalHeaders);
  useEffect(() => {
    sourceRef.current = source;
    formValuesRef.current = formValues;
    globalHeadersRef.current = globalHeaders;
  });

  const url = source?.url ?? "";
  const mapping = source?.mapping;

  /**
   * Stable string that changes only when the URL's template var values change.
   * Used as an effect dependency to trigger a refetch.
   */
  const templateVarValuesKey = useMemo(() => {
    const vars = extractTemplateVars(url);
    return vars.map((name) => `${name}:${String(formValues[name] ?? "")}`).join("|");
  }, [url, formValues]);

  const hasConfiguredSource = useMemo(() => {
    if (!url || !mapping?.valueField || !mapping?.labelField) {
      return false;
    }
    const vars = extractTemplateVars(url);
    return vars.every((name) => {
      const value = formValues[name];
      return value !== undefined && value !== null && value !== "";
    });
  }, [url, mapping?.valueField, mapping?.labelField, formValues]);

  useEffect(() => {
    if (!hasConfiguredSource) {
      setState({ error: null, isLoading: false, options: null });
      return;
    }

    const controller = new AbortController();
    setState((prev) => ({ ...prev, error: null, isLoading: true }));

    const run = async () => {
      const currentSource = sourceRef.current;
      if (!currentSource?.url || !currentSource.mapping) {
        return;
      }
      const currentFormValues = formValuesRef.current;
      const currentGlobalHeaders = globalHeadersRef.current;

      const replaceVars = (header: HttpHeader): HttpHeader => ({
        key: header.key,
        value: replaceTemplateVariables(header.value, currentFormValues),
      });

      const requestUrl = replaceTemplateVariables(currentSource.url, currentFormValues, { encode: true });
      const headers = mergeHttpHeaders(currentGlobalHeaders?.map(replaceVars), currentSource.headers?.map(replaceVars));
      const method = currentSource.method ?? "GET";
      const body =
        currentSource.body && ["POST", "PUT", "PATCH"].includes(method)
          ? replaceTemplateVariables(currentSource.body, currentFormValues, { json: true })
          : undefined;

      const result = await makeHttpRequest({ body, headers, method, signal: controller.signal, url: requestUrl });

      if (controller.signal.aborted) {
        return;
      }

      if (!result.success) {
        setState({ error: result.error ?? "Fetch failed", isLoading: false, options: null });
        return;
      }

      const options = extractOptionsFromResponse(result.data, currentSource.responsePath, currentSource.mapping);
      setState({ error: null, isLoading: false, options });
    };

    void run();
    return () => controller.abort();
    // hasConfiguredSource captures URL/mapping presence + template vars filled.
    // templateVarValuesKey re-triggers when those values change.
    // url is in deps so a URL change without template-var change still refetches.
  }, [hasConfiguredSource, templateVarValuesKey, url]);

  return { ...state, hasConfiguredSource };
};
