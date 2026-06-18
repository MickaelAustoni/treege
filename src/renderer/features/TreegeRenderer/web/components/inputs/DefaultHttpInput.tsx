import { Check, ChevronsUpDown, Loader2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTreegeRenderRuntime } from "@/renderer/context/TreegeRenderRuntimeProvider";
import DependencyHint from "@/renderer/features/TreegeRenderer/web/components/DependencyHint";
import OptionItemContent from "@/renderer/features/TreegeRenderer/web/components/OptionItemContent";
import { useTranslate } from "@/renderer/hooks/useTranslate";
import { InputRenderProps } from "@/renderer/types/renderer";
import { convertFormValuesToNamedFormat } from "@/renderer/utils/form";
import {
  appendQueryParams,
  getValueByPath,
  mergeHttpHeaders,
  resolveTemplateRecord,
  resolveUrl,
  tryParseJson,
} from "@/renderer/utils/http";
import { resolveTemplateToJson } from "@/renderer/utils/jsonTemplate";
import { sanitizeHttpResponse } from "@/renderer/utils/sanitize";
import { Button } from "@/shared/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/shared/components/ui/command";
import { FormDescription, FormError, FormItem } from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/components/ui/tooltip";
import { cn } from "@/shared/lib/utils";
import { normalizeLabel } from "@/shared/utils/normalizeLabel";

type HttpResponse = Record<string, unknown> | unknown[];

/**
 * Extracts variable names from a template string
 * Example: "https://api.com/users/{{userId}}/posts/{{postId}}" -> ["userId", "postId"]
 * Supports alphanumeric characters, underscores, and hyphens in variable names
 */
const extractTemplateVars = (template: string): string[] => {
  const matches = template.matchAll(/{{([\w-]+)}}/g);
  return Array.from(matches, (match) => match[1]);
};

/**
 * Checks if all template variables in a string have non-empty values
 * Returns true if all variables are filled, false otherwise
 */
const areTemplateVarsFilled = (template: string, formValues: Record<string, unknown>): boolean => {
  const vars = extractTemplateVars(template);
  return vars.every((varName) => {
    const value = formValues[varName];
    return value !== undefined && value !== null && value !== "";
  });
};

/**
 * Replaces template variables in a string with values from formValues
 * Example: "https://api.com/users/{{userId}}" -> "https://api.com/users/123"
 * Supports alphanumeric characters, underscores, and hyphens in variable names
 */
const replaceTemplateVars = (template: string, formValues: Record<string, unknown>, encode = false): string =>
  template.replace(/{{([\w-]+)}}/g, (_, key) => {
    const raw = formValues[key];
    const value = raw == null ? "" : String(raw);
    return encode ? encodeURIComponent(value) : value;
  });

const DefaultHttpInput = ({ field, extra }: InputRenderProps<"http">) => {
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [options, setOptions] = useState<Array<{ value: string; label: string; description?: string; image?: string }>>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const { id, name, value, placeholder } = field;
  const { InputLabel, node, setValue, error, label, helperText, missingDependencies: missing } = extra;
  const { formValues, inputNodes, headers, baseUrl } = useTreegeRenderRuntime();
  const { httpConfig } = node.data;
  const hasFetchedOnMount = useRef(false);
  const isConfigInitialized = useRef(false);
  const lastFetchedTemplateValues = useRef<string>("");
  const t = useTranslate();
  const httpConfigRef = useRef(httpConfig);
  const formValuesRef = useRef(formValues);
  const inputNodesRef = useRef(inputNodes);
  const headersRef = useRef(headers);
  const baseUrlRef = useRef(baseUrl);
  const setValueRef = useRef(setValue);
  const fetchDataRef = useRef<((search?: string) => Promise<void>) | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  // API labels are normalized to a uniform Title Case form unless the node opts
  // out. Kept in a ref so the memoized `fetchData` always reads the latest flag.
  const normalizeOptionLabelsRef = useRef(node.data.normalizeOptionLabels !== false);

  /**
   * Extract template variables from URL (memoized)
   */
  const templateVars = useMemo(() => {
    if (!httpConfig?.url) {
      return [];
    }
    return extractTemplateVars(httpConfig.url);
  }, [httpConfig?.url]);

  /**
   * Check if URL has template variables
   */
  const hasTemplateVars = templateVars.length > 0;

  /**
   * Get current values of template variables (for dependency tracking)
   * Returns a stable string key that only changes when the actual template variable values change
   */
  const templateVarValuesKey = useMemo(() => {
    return templateVars.map((varName) => `${varName}:${String(formValues[varName] ?? "")}`).join("|");
  }, [templateVars, formValues]);

  /**
   * Check if we can make a fetch request
   * Returns true only if URL exists and all template variables are filled
   */
  const canFetch = useMemo(() => {
    if (!httpConfig?.url) {
      return false;
    }
    // If no template vars, we can always fetch
    if (!hasTemplateVars) {
      return true;
    }
    // If, has template vars, check they're all filled
    return areTemplateVarsFilled(httpConfig.url, formValues);
  }, [httpConfig?.url, hasTemplateVars, formValues]);

  const fetchData = useCallback(
    async (search?: string) => {
      // Cancel any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      const currentHttpConfig = httpConfigRef.current;
      const currentFormValues = formValuesRef.current;
      const currentSetValue = setValueRef.current;

      if (!currentHttpConfig?.url) {
        setFetchError(t("renderer.defaultHttpInput.noUrlConfigured"));
        abortControllerRef.current = null;
        return;
      }

      // Check if we can fetch (all template vars filled)
      if (currentHttpConfig.url && !areTemplateVarsFilled(currentHttpConfig.url, currentFormValues)) {
        abortControllerRef.current = null;
        return;
      }

      setLoading(true);
      setFetchError(null);

      try {
        // Replace template variables in URL, prepend the configured base URL
        // when relative, then add the search param if configured
        const resolvedUrl = resolveUrl(replaceTemplateVars(currentHttpConfig.url, currentFormValues, true), baseUrlRef.current);

        const urlWithSearch =
          currentHttpConfig.searchParam && search
            ? `${resolvedUrl}${resolvedUrl.includes("?") ? "&" : "?"}${currentHttpConfig.searchParam}=${encodeURIComponent(search)}`
            : resolvedUrl;

        // Append configured query params (e.g. ?limit=10), resolving template variables in their values
        const url = appendQueryParams(urlWithSearch, resolveTemplateRecord(currentHttpConfig.queryParams, currentFormValues));

        // Replace template variables in headers, merge with global ones
        // (field-level headers override globals on key collision).
        const mergedHeaders = mergeHttpHeaders(
          { "Content-Type": "application/json" },
          resolveTemplateRecord(headersRef.current, currentFormValues),
          resolveTemplateRecord(currentHttpConfig.headers, currentFormValues),
        );

        // Prepare body: use all form data if sendAllFormValues is true, otherwise use custom body
        const body = ["POST", "PUT", "PATCH"].includes(currentHttpConfig.method || "")
          ? currentHttpConfig.sendAllFormValues
            ? JSON.stringify(convertFormValuesToNamedFormat(currentFormValues, inputNodesRef.current))
            : resolveTemplateToJson(currentHttpConfig.body, currentFormValues, inputNodesRef.current)
          : undefined;

        const timeoutId = setTimeout(() => abortController.abort(), 30000);
        const response = await fetch(url, {
          body: body || undefined,
          headers: Object.fromEntries(Object.entries(mergedHeaders).filter(([, value]) => value)),
          method: currentHttpConfig.method || "GET",
          signal: abortController.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          setFetchError(`HTTP Error ${response.status}: ${response.statusText}`);
          return;
        }

        // Parse the body defensively: a relative url resolved against the app
        // origin (no baseUrl) or an auth redirect returns an HTML page, so
        // `response.json()` would throw a cryptic "Unexpected token '<'". Read
        // the text first and surface a clear, actionable error instead.
        const parsed = tryParseJson(await response.text());
        if (!parsed.ok) {
          setFetchError(t("renderer.defaultHttpInput.invalidJson"));
          return;
        }

        // Sanitize the response data to prevent XSS attacks (plainTextOnly: true by default)
        const sanitizedData = sanitizeHttpResponse(parsed.value) as HttpResponse;

        // Extract data using responsePath
        const extractedData = currentHttpConfig.responsePath
          ? getValueByPath(sanitizedData, currentHttpConfig.responsePath)
          : sanitizedData;

        // If responseMapping is configured, map the data to options
        if (currentHttpConfig.responseMapping && Array.isArray(extractedData)) {
          const { valueField = "value", labelField = "label", descriptionField, imageField } = currentHttpConfig.responseMapping;

          const normalizeLabels = normalizeOptionLabelsRef.current;
          const mappedOptions = extractedData.map((item) => {
            const description = descriptionField ? getValueByPath(item as HttpResponse, descriptionField) : undefined;
            const image = imageField ? getValueByPath(item as HttpResponse, imageField) : undefined;
            const rawLabel = String(getValueByPath(item as HttpResponse, labelField) || "");

            return {
              description: description != null && description !== "" ? String(description) : undefined,
              image: typeof image === "string" && image !== "" ? image : undefined,
              label: normalizeLabels ? normalizeLabel(rawLabel) : rawLabel,
              value: String(getValueByPath(item as HttpResponse, valueField) || ""),
            };
          });

          setOptions(mappedOptions);
        } else {
          // Store the raw data as the field value (converting to string)
          currentSetValue(typeof extractedData === "string" ? extractedData : JSON.stringify(extractedData));
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          // Superseded by a newer request: it now owns the loading state and the
          // active controller, so bail without touching either.
          return;
        }
        const errorMessage = err instanceof Error ? err.message : t("renderer.defaultHttpInput.fetchFailed");
        setFetchError(errorMessage);
        console.error("HTTP Input fetch error:", err);
      } finally {
        // Only the most recent request clears loading / the active controller. A
        // request aborted by a newer fetch must not flip loading off while that
        // newer fetch is still in flight — otherwise the spinner vanishes
        // mid-load (notably on the StrictMode-doubled fetchOnMount call).
        if (abortControllerRef.current === abortController) {
          setLoading(false);
          abortControllerRef.current = null;
        }
      }
    },
    [t],
  );

  /**
   * Mirror the latest props/state into refs so the async `fetchData` (and
   * the mount/refetch effects below) always see the freshest values without
   * needing every changing identity in their dependency arrays.
   */
  useEffect(() => {
    httpConfigRef.current = httpConfig;
    formValuesRef.current = formValues;
    inputNodesRef.current = inputNodes;
    headersRef.current = headers;
    baseUrlRef.current = baseUrl;
    setValueRef.current = setValue;
    fetchDataRef.current = fetchData;
    normalizeOptionLabelsRef.current = node.data.normalizeOptionLabels !== false;
  }, [httpConfig, formValues, inputNodes, headers, baseUrl, setValue, fetchData, node.data.normalizeOptionLabels]);

  /**
   * Abort any in-flight request when the component unmounts so we don't
   * call `setValue`/`setOptions` after teardown.
   */
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      // Allow the mount fetch to run again if the component remounts. Without
      // this, React StrictMode (dev) aborts the first fetch on its simulated
      // unmount, then the remount skips the fetch because the guard is still
      // set — leaving the field empty ("No data available"). Reset the config
      // guard too so the remount is treated as a fresh mount (no spurious
      // config-change refetch).
      hasFetchedOnMount.current = false;
      isConfigInitialized.current = false;
    };
  }, []);

  /**
   * Initial mount fetch: fires once if `fetchOnMount` is enabled AND all
   * URL template variables are filled. Records the template-var fingerprint
   * to prevent the watcher effect below from re-fetching for the same values.
   */
  useEffect(() => {
    // Mark that we've processed the initial mount
    if (hasFetchedOnMount.current) {
      return;
    }

    hasFetchedOnMount.current = true;

    // Check conditions using refs to get current values
    const currentHttpConfig = httpConfigRef.current;
    const currentFormValues = formValuesRef.current;
    const currentFetchData = fetchDataRef.current;

    // Only fetch if conditions are met
    const canFetchNow = currentHttpConfig?.url && areTemplateVarsFilled(currentHttpConfig.url, currentFormValues);

    if (currentHttpConfig?.fetchOnMount && canFetchNow && currentFetchData) {
      void currentFetchData();
      // Store the current template values
      if (currentHttpConfig.url) {
        const currentTemplateVars = extractTemplateVars(currentHttpConfig.url);
        lastFetchedTemplateValues.current = currentTemplateVars
          .map((varName) => `${varName}:${String(currentFormValues[varName] ?? "")}`)
          .join("|");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  /**
   * Watch template variable values and refetch (debounced 500ms) when they
   * change after the initial mount. Skips when the URL has no template vars,
   * when the values are unchanged from the last fetch, or when not all
   * template vars are filled yet.
   */
  useEffect(() => {
    // Skip if we haven't done the initial mount fetch yet
    if (!hasFetchedOnMount.current) {
      return;
    }

    // Only watch if URL has template variables
    if (!hasTemplateVars) {
      return;
    }

    // Skip if template values haven't changed
    if (lastFetchedTemplateValues.current === templateVarValuesKey) {
      return;
    }

    // Skip if we can't fetch yet
    if (!canFetch) {
      return;
    }

    // Debounce to avoid multiple calls when user is typing
    const timer = setTimeout(() => {
      void fetchData();
      lastFetchedTemplateValues.current = templateVarValuesKey;
    }, 500);

    return () => clearTimeout(timer);
  }, [templateVarValuesKey, hasTemplateVars, canFetch, fetchData]);

  /**
   * Fingerprint of the fetch-relevant HTTP config. Excludes form values
   * (template-variable changes are handled by the watcher above), so it only
   * changes when the configuration itself does — e.g. the editor re-saves the
   * tree with a new url/mapping or flips `fetchOnMount` on.
   */
  const httpConfigKey = useMemo(
    () =>
      JSON.stringify({
        body: httpConfig?.body,
        fetchOnMount: httpConfig?.fetchOnMount,
        headers: httpConfig?.headers,
        method: httpConfig?.method,
        queryParams: httpConfig?.queryParams,
        responseMapping: httpConfig?.responseMapping,
        responsePath: httpConfig?.responsePath,
        searchParam: httpConfig?.searchParam,
        sendAllFormValues: httpConfig?.sendAllFormValues,
        url: httpConfig?.url,
      }),
    [httpConfig],
  );

  /**
   * Re-fetch when the HTTP configuration changes after the initial mount. The
   * mount fetch only runs once, so without this the field keeps showing stale
   * options/data when the tree is re-saved with an updated config. Gated on
   * `fetchOnMount` so manual fetch-on-demand fields aren't auto-refreshed.
   */
  useEffect(() => {
    // The mount effect owns the initial fetch; only react to later changes.
    if (!isConfigInitialized.current) {
      isConfigInitialized.current = true;
      return;
    }

    const currentHttpConfig = httpConfigRef.current;
    const currentFormValues = formValuesRef.current;
    const currentFetchData = fetchDataRef.current;

    const canFetchNow = currentHttpConfig?.url && areTemplateVarsFilled(currentHttpConfig.url, currentFormValues);

    if (currentHttpConfig?.fetchOnMount && canFetchNow && currentFetchData) {
      void currentFetchData();
      if (currentHttpConfig.url) {
        lastFetchedTemplateValues.current = extractTemplateVars(currentHttpConfig.url)
          .map((varName) => `${varName}:${String(currentFormValues[varName] ?? "")}`)
          .join("|");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [httpConfigKey]);

  /**
   * Debounce combobox search-as-you-type: refetch with the current query
   * 300ms after the user stops typing. Only active when the HTTP config
   * declares a `searchParam` (which is what enables the combobox UI).
   */
  useEffect(() => {
    if (!(httpConfig?.searchParam && searchQuery)) {
      return undefined;
    }

    const timer = setTimeout(() => {
      void fetchData(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, httpConfig?.searchParam, fetchData]);

  // If responseMapping is configured
  if (httpConfig?.responseMapping) {
    const normalizedValue = Array.isArray(value) ? value[0] : value;
    const selectedOption = options.find((option) => option.value === normalizedValue);

    // Render as Combobox if searchParam is configured
    if (httpConfig.searchParam) {
      const isLoading = loading && httpConfig?.showLoading;
      const buttonContent = selectedOption?.label || placeholder || t("renderer.defaultHttpInput.search");

      return (
        <FormItem className="tg:mb-4">
          <InputLabel htmlFor={id} label={label} required={node.data.required} />
          <DependencyHint missing={missing}>
            <div className="tg:relative">
              <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id={id}
                    variant="outline"
                    role="combobox"
                    aria-label={label || node.data.name}
                    aria-expanded={comboboxOpen}
                    disabled={missing.length > 0}
                    className={cn("tg:w-full tg:justify-between", (normalizedValue || isLoading) && "tg:pr-14")}
                  >
                    <span className="tg:truncate">{buttonContent}</span>
                    <ChevronsUpDown className="tg:ml-2 tg:h-4 tg:w-4 tg:shrink-0 tg:opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="tg:w-[var(--radix-popover-trigger-width)] tg:p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder={t("renderer.defaultHttpInput.search")}
                      value={searchQuery}
                      onValueChange={(searchValue) => {
                        setSearchQuery(searchValue);
                        setFetchError(null); // Clear error on new search
                      }}
                    />
                    <CommandList>
                      {loading && (
                        <div className="tg:flex tg:items-center tg:justify-center tg:p-4">
                          <Loader2 className="tg:h-4 tg:w-4 tg:animate-spin" />
                        </div>
                      )}
                      {!loading && fetchError && (
                        <div className="tg:p-4 tg:text-destructive tg:text-sm">
                          <div>{fetchError}</div>
                          <button
                            type="button"
                            onClick={() => fetchData(searchQuery)}
                            className="tg:mt-2 tg:block tg:text-primary tg:hover:underline"
                          >
                            {t("renderer.defaultHttpInput.retry")}
                          </button>
                        </div>
                      )}
                      {!(loading || fetchError) && (
                        <>
                          <CommandEmpty>{t("renderer.defaultHttpInput.noResults")}</CommandEmpty>
                          <CommandGroup>
                            {options.map((option) => (
                              <CommandItem
                                key={option.value}
                                value={option.value}
                                onSelect={() => {
                                  // Toggle off when the already-selected option is picked again.
                                  setValue(option.value === value ? "" : option.value);
                                  setComboboxOpen(false);
                                }}
                              >
                                <Check
                                  className={cn("tg:mr-2 tg:h-4 tg:w-4", value === option.value ? "tg:opacity-100" : "tg:opacity-0")}
                                />
                                <OptionItemContent label={option.label} description={option.description} image={option.image} />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {isLoading && (
                <Loader2 className="tg:-translate-y-1/2 tg:pointer-events-none tg:absolute tg:top-1/2 tg:right-8 tg:size-4 tg:animate-spin tg:text-muted-foreground" />
              )}
              {normalizedValue && !isLoading && missing.length === 0 && (
                <button
                  type="button"
                  aria-label={t("common.clear")}
                  onClick={() => setValue("")}
                  className="tg:-translate-y-1/2 tg:absolute tg:top-1/2 tg:right-8 tg:rounded-sm tg:p-0.5 tg:text-muted-foreground tg:opacity-70 tg:transition-opacity tg:hover:opacity-100"
                >
                  <X className="tg:size-4" />
                </button>
              )}
            </div>
          </DependencyHint>
          {error && <FormError>{error}</FormError>}
          {helperText && !error && <FormDescription>{helperText}</FormDescription>}
        </FormItem>
      );
    }

    // Render as Select (no search)
    const isLoading = loading && httpConfig?.showLoading;

    // Fetch-state hint, shown only once dependencies are satisfied — missing
    // dependencies are surfaced by DependencyHint instead.
    const fetchHint =
      missing.length === 0 && options.length === 0 && !isLoading
        ? (fetchError ?? t("renderer.defaultHttpInput.noDataAvailable"))
        : undefined;

    const selectValue = Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
    const selectElement = (
      <div className="tg:relative">
        <Select value={selectValue} onValueChange={(val) => setValue(val)} disabled={isLoading || options.length === 0} name={name}>
          <SelectTrigger
            id={id}
            name={name}
            aria-label={label || node.data.name}
            className={cn("tg:w-full", (selectValue || isLoading) && "tg:pr-14")}
          >
            <SelectValue placeholder={placeholder || t("renderer.defaultHttpInput.selectOption")} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {options.map((option, index) => (
                <SelectItem key={option.value + index} value={option.value}>
                  <OptionItemContent label={option.label} description={option.description} image={option.image} />
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        {isLoading && (
          <Loader2 className="tg:-translate-y-1/2 tg:pointer-events-none tg:absolute tg:top-1/2 tg:right-8 tg:size-4 tg:animate-spin tg:text-muted-foreground" />
        )}
        {selectValue && !isLoading && (
          <button
            type="button"
            aria-label={t("common.clear")}
            onClick={() => setValue("")}
            className="tg:-translate-y-1/2 tg:absolute tg:top-1/2 tg:right-8 tg:rounded-sm tg:p-0.5 tg:text-muted-foreground tg:opacity-70 tg:transition-opacity tg:hover:opacity-100"
          >
            <X className="tg:size-4" />
          </button>
        )}
      </div>
    );

    return (
      <FormItem className="tg:mb-4">
        <InputLabel htmlFor={id} label={label} required={node.data.required} />
        <DependencyHint missing={missing}>
          {fetchHint ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="tg:w-full">{selectElement}</div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{fetchHint}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            selectElement
          )}
        </DependencyHint>
        {error && <FormError>{error}</FormError>}
        {helperText && !error && <FormDescription>{helperText}</FormDescription>}
      </FormItem>
    );
  }

  // If no responseMapping, render the value as text (hidden or display-only)
  return (
    <FormItem className="tg:mb-4">
      <InputLabel htmlFor={id} label={label} required={node.data.required} />
      <Input
        type="text"
        name={name}
        id={id}
        aria-label={label || node.data.name}
        value={typeof value === "string" ? value : JSON.stringify(value)}
        readOnly
        disabled
      />
      {error && <FormError>{error}</FormError>}
      {helperText && !error && <FormDescription>{helperText}</FormDescription>}
    </FormItem>
  );
};

export default DefaultHttpInput;
