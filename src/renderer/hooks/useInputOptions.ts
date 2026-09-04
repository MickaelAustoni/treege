import { Node } from "@xyflow/react";
import { useEffect, useMemo, useState } from "react";
import { useTreegeRenderRuntime } from "@/renderer/context/TreegeRenderRuntimeProvider";
import {
  extractOptionsFromResponse,
  makeHttpRequest,
  mergeHttpHeaders,
  replaceTemplateVariables,
  resolveTemplateRecord,
  resolveUrl,
} from "@/renderer/utils/http";
import { resolveTemplateToJson } from "@/renderer/utils/jsonTemplate";
import { HttpHeaders, InputNodeData, InputOption, OptionsSourceMapping, QueryParams } from "@/shared/types/node";
import { normalizeTranslatableLabel } from "@/shared/utils/normalizeLabel";

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
interface FetchState {
  fetched: InputOption[] | null;
  isLoading: boolean;
  error: string | null;
}

const IDLE_STATE: FetchState = { error: null, fetched: null, isLoading: false };

interface ResolvedOptionsSource {
  url: string;
  method: HttpMethod;
  headers: HttpHeaders;
  queryParams: QueryParams;
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
  const { baseUrl, deferRemoteFetch, formValues, headers: globalHeaders, optionsCache } = useTreegeRenderRuntime();
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

    const method = source.method ?? "GET";
    const resolved: ResolvedOptionsSource = {
      body: ["POST", "PUT", "PATCH"].includes(method) ? resolveTemplateToJson(source.body, formValues, []) : undefined,
      headers: mergeHttpHeaders(resolveTemplateRecord(globalHeaders, formValues), resolveTemplateRecord(source.headers, formValues)),
      mapping: source.mapping,
      method,
      queryParams: resolveTemplateRecord(source.queryParams, formValues) ?? {},
      responsePath: source.responsePath,
      url: resolveUrl(replaceTemplateVariables(source.url, formValues, { encode: true }), baseUrl),
    };

    return JSON.stringify(resolved);
  }, [baseUrl, source, formValues, globalHeaders]);

  // Seeded from the cache so a remounted input renders its options on its
  // first frame — at its final height, which keeps node measurements stable.
  const [state, setState] = useState<FetchState>(() => ({
    error: null,
    fetched: resolvedSourceJson ? (optionsCache?.get(resolvedSourceJson) ?? null) : null,
    isLoading: false,
  }));

  /**
   * Fetch options whenever the plan's content changes. Without a cache the
   * request belongs to this input and is aborted on cleanup, so a quick
   * succession of changes doesn't race. With a cache the request is shared
   * (see `OptionsCache`) and runs to completion so its result is memoized even
   * when this input unmounts mid-flight; only this input's state is dropped.
   */
  useEffect(() => {
    // Editor previews defer remote fetches until the node is hovered/selected.
    if (!resolvedSourceJson || deferRemoteFetch) {
      setState(IDLE_STATE);
      return;
    }

    const cached = optionsCache?.get(resolvedSourceJson);
    if (cached) {
      // Already seeded from the cache on mount: keep the same state object, React then skips the render.
      setState((previous) => (previous.fetched === cached ? previous : { error: null, fetched: cached, isLoading: false }));
      return;
    }

    const resolved: ResolvedOptionsSource = JSON.parse(resolvedSourceJson);
    const controller = new AbortController();

    const request = (): Promise<InputOption[]> =>
      makeHttpRequest({
        body: resolved.body,
        headers: resolved.headers,
        method: resolved.method,
        queryParams: resolved.queryParams,
        signal: optionsCache ? undefined : controller.signal,
        url: resolved.url,
      }).then((result) => {
        if (!result.success) {
          throw new Error(result.error ?? "Fetch failed");
        }
        return extractOptionsFromResponse(result.data, resolved.responsePath, resolved.mapping);
      });

    setState((previous) => ({ ...previous, error: null, isLoading: true }));

    const options = optionsCache ? optionsCache.resolve(resolvedSourceJson, request) : request();
    options.then(
      (fetched) => {
        if (!controller.signal.aborted) {
          setState({ error: null, fetched, isLoading: false });
        }
      },
      (error: unknown) => {
        if (!controller.signal.aborted) {
          setState({ error: error instanceof Error ? error.message : "Fetch failed", fetched: null, isLoading: false });
        }
      },
    );

    return () => controller.abort();
  }, [resolvedSourceJson, deferRemoteFetch, optionsCache]);

  // Normalize only API-fetched labels (not manually-typed static options),
  // and only when the node hasn't opted out. Defaults to on when unset.
  const normalize = node.data.normalizeOptionLabels !== false;
  const options = useMemo<InputOption[]>(() => {
    if (!state.fetched) {
      return staticOptions ?? [];
    }
    if (!normalize) {
      return state.fetched;
    }
    return state.fetched.map((option) => ({ ...option, label: normalizeTranslatableLabel(option.label) }));
  }, [state.fetched, staticOptions, normalize]);

  return {
    error: state.error,
    isLoading: state.isLoading,
    options,
  };
};
