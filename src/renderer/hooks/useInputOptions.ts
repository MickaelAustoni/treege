import { Node } from "@xyflow/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTreegeRendererContext } from "@/renderer/context/TreegeRendererContext";
import { extractOptionsFromResponse, makeHttpRequest, mergeHttpHeaders, replaceTemplateVariables } from "@/renderer/utils/http";
import { HttpHeader, InputNodeData, InputOption } from "@/shared/types/node";

const TEMPLATE_VAR_REGEX = /\{\{([\w-]+)}}/g;

const extractTemplateVars = (template: string): string[] => Array.from(template.matchAll(TEMPLATE_VAR_REGEX), (m) => m[1]);

interface UseInputOptionsResult {
  /**
   * Resolved options for the input. When the node has an `optionsSource`,
   * these are the fetched options (or the static fallback while loading or
   * if the fetch errors). Otherwise the static `options` from the node data.
   */
  options: InputOption[];
  /** True while a remote fetch is in flight. */
  isLoading: boolean;
  /** Error message if the latest remote fetch failed; otherwise `null`. */
  error: string | null;
}

/**
 * Resolves the options for an option-based input (radio, checkbox, select,
 * autocomplete). If the node declares an `optionsSource`, options are fetched
 * from that API at runtime, with `{{templateVar}}` substitution from form
 * values and merging of global + field-level headers. While loading, before
 * the first successful fetch, or on error, falls back to the static
 * `options` array (if any).
 *
 * Re-fetches when the URL or its template variable values change.
 */
export const useInputOptions = (node: Node<InputNodeData>): UseInputOptionsResult => {
  const [state, setState] = useState<{ fetched: InputOption[] | null; isLoading: boolean; error: string | null }>({
    error: null,
    fetched: null,
    isLoading: false,
  });
  const { formValues, headers: globalHeaders } = useTreegeRendererContext();
  const source = node.data.optionsSource;
  const staticOptions = node.data.options;
  // Refs that mirror the latest props/context so the fetch effect can read
  // them without re-subscribing on every render.
  const sourceRef = useRef(source);
  const formValuesRef = useRef(formValues);
  const globalHeadersRef = useRef(globalHeaders);
  const url = source?.url ?? "";
  const mapping = source?.mapping;

  /**
   * Stable string that changes only when the URL's template var values change.
   * Used as a re-trigger signal for the fetch effect.
   */
  const templateVarValuesKey = useMemo(() => {
    const vars = extractTemplateVars(url);
    return vars.map((name) => `${name}:${String(formValues[name] ?? "")}`).join("|");
  }, [url, formValues]);

  const canFetch = useMemo(() => {
    if (!(url && mapping?.valueField && mapping?.labelField)) {
      return false;
    }
    const vars = extractTemplateVars(url);
    return vars.every((name) => {
      const value = formValues[name];
      return value !== undefined && value !== null && value !== "";
    });
  }, [url, mapping?.valueField, mapping?.labelField, formValues]);

  /**
   * Mirror the latest source/formValues/globalHeaders into refs whenever
   * any of them changes, so the async `run` below always reads fresh values
   * without forcing a re-subscription of the fetch effect.
   */
  useEffect(() => {
    sourceRef.current = source;
    formValuesRef.current = formValues;
    globalHeadersRef.current = globalHeaders;
  }, [source, formValues, globalHeaders]);

  /**
   * Fetch the option list whenever the source becomes fetchable, the URL
   * changes, or any template variable value referenced in the URL changes.
   * Replaces template variables in URL/body/headers, merges global +
   * field-level headers (field wins), and aborts any in-flight request when
   * the effect cleans up.
   *
   * `url` and `templateVarValuesKey` are intentional re-trigger signals: the
   * body reads everything via refs, but we need a refetch when the URL changes
   * or when template variable values change, even if `canFetch` stays true.
   */
  // biome-ignore lint/correctness/useExhaustiveDependencies: trigger-only deps
  useEffect(() => {
    if (!canFetch) {
      setState({ error: null, fetched: null, isLoading: false });
      return;
    }

    const controller = new AbortController();
    setState((prev) => ({ ...prev, error: null, isLoading: true }));

    const run = async () => {
      const currentSource = sourceRef.current;
      if (!(currentSource?.url && currentSource.mapping)) {
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
        setState({ error: result.error ?? "Fetch failed", fetched: null, isLoading: false });
        return;
      }

      const fetched = extractOptionsFromResponse(result.data, currentSource.responsePath, currentSource.mapping);
      setState({ error: null, fetched, isLoading: false });
    };

    void run();
    return () => controller.abort();
  }, [canFetch, templateVarValuesKey, url]);

  const options = state.fetched ?? staticOptions ?? [];

  return {
    error: state.error,
    isLoading: state.isLoading,
    options,
  };
};
