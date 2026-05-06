import { Node } from "@xyflow/react";
import { useEffect, useMemo, useState } from "react";
import { useTreegeRendererContext } from "@/renderer/context/TreegeRendererContext";
import { extractOptionsFromResponse, makeHttpRequest, mergeHttpHeaders, replaceTemplateVariables } from "@/renderer/utils/http";
import { HttpHeader, InputNodeData, InputOption, OptionsSourceMapping } from "@/shared/types/node";

const TEMPLATE_VAR_REGEX = /\{\{([\w-]+)}}/g;

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

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

/**
 * The user-facing `OptionsSource` config with everything resolved and
 * merged: template variables substituted, global + field-level headers
 * merged (field wins), default method applied. Ready to be sent as-is.
 */
interface ResolvedOptionsSource {
  url: string;
  method: HttpMethod;
  headers: HttpHeader[];
  body: string | undefined;
  responsePath: string | undefined;
  mapping: OptionsSourceMapping;
}

/**
 * Resolves the options for an option-based input (radio, checkbox, select,
 * autocomplete). If the node declares an `optionsSource`, options are fetched
 * from that API at runtime, with `{{templateVar}}` substitution from form
 * values and merging of global + field-level headers. While loading, before
 * the first successful fetch, or on error, falls back to the static
 * `options` array (if any).
 *
 * The fetch plan is computed once and serialized to JSON. The fetch effect
 * keys off this string: changes that don't affect the actual request (e.g.
 * an unrelated form field) produce the same JSON and don't re-trigger.
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

  /**
   * Build a fully-resolved fetch plan, serialized as JSON. Returns `null`
   * when the source isn't configured or any URL template variable is empty.
   * The string identity changes only when the resulting HTTP request would
   * actually differ — that's what makes it a clean effect dependency.
   */
  const resolvedSourceJson = useMemo<string | null>(() => {
    if (!(source?.url && source.mapping?.valueField && source.mapping?.labelField)) {
      return null;
    }

    const vars = Array.from(source.url.matchAll(TEMPLATE_VAR_REGEX), (m) => m[1]);
    const allFilled = vars.every((name) => {
      const value = formValues[name];
      return value !== undefined && value !== null && value !== "";
    });
    if (!allFilled) {
      return null;
    }

    const replaceHeaderVars = (header: HttpHeader): HttpHeader => ({
      key: header.key,
      value: replaceTemplateVariables(header.value, formValues),
    });

    const method = source.method ?? "GET";
    const resolved: ResolvedOptionsSource = {
      body:
        source.body && ["POST", "PUT", "PATCH"].includes(method)
          ? replaceTemplateVariables(source.body, formValues, { json: true })
          : undefined,
      headers: mergeHttpHeaders(globalHeaders?.map(replaceHeaderVars), source.headers?.map(replaceHeaderVars)),
      mapping: source.mapping,
      method,
      responsePath: source.responsePath,
      url: replaceTemplateVariables(source.url, formValues, { encode: true }),
    };

    return JSON.stringify(resolved);
  }, [source, formValues, globalHeaders]);

  /**
   * Fetch options whenever the plan's content changes. Aborts any in-flight
   * request on cleanup so a quick succession of changes doesn't race.
   */
  useEffect(() => {
    if (!resolvedSourceJson) {
      setState({ error: null, fetched: null, isLoading: false });
      return;
    }

    const resolved = JSON.parse(resolvedSourceJson);
    const controller = new AbortController();

    setState((prev) => ({ ...prev, error: null, isLoading: true }));

    (async () => {
      const result = await makeHttpRequest({
        body: resolved.body,
        headers: resolved.headers,
        method: resolved.method,
        signal: controller.signal,
        url: resolved.url,
      });

      if (controller.signal.aborted) {
        return;
      }

      if (!result.success) {
        setState({ error: result.error ?? "Fetch failed", fetched: null, isLoading: false });
        return;
      }

      const fetched = extractOptionsFromResponse(result.data, resolved.responsePath, resolved.mapping);
      setState({ error: null, fetched, isLoading: false });
    })();

    return () => controller.abort();
  }, [resolvedSourceJson]);

  const options = state.fetched ?? staticOptions ?? [];

  return {
    error: state.error,
    isLoading: state.isLoading,
    options,
  };
};
