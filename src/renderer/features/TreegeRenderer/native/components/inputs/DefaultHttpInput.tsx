import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useTreegeRenderRuntime } from "@/renderer/context/TreegeRenderRuntimeProvider";
import DependencyHint from "@/renderer/features/TreegeRenderer/native/components/DependencyHint";
import OptionItemContent from "@/renderer/features/TreegeRenderer/native/components/OptionItemContent";
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
import { sanitizeHttpResponse } from "@/renderer/utils/sanitize.native";
import { useTheme } from "@/shared/context/ThemeContext";
import { normalizeLabel } from "@/shared/utils/normalizeLabel";

type HttpResponse = Record<string, unknown> | unknown[];

/**
 * Extracts variable names from a template string
 * Example: "https://api.com/users/{{userId}}/posts/{{postId}}" -> ["userId", "postId"]
 */
const extractTemplateVars = (template: string): string[] => {
  const matches = template.matchAll(/{{([\w-]+)}}/g);
  return Array.from(matches, (match) => match[1]);
};

/**
 * Checks if all template variables in a string have non-empty values
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
  const [modalOpen, setModalOpen] = useState(false);
  const { value, placeholder } = field;
  const { InputLabel, node, setValue, error, label, helperText, missingDependencies: missing } = extra;
  const { formValues, inputNodes, headers, baseUrl } = useTreegeRenderRuntime();
  const { colors } = useTheme();
  const { httpConfig } = node.data;
  const t = useTranslate();
  const hasFetchedOnMount = useRef(false);
  const isConfigInitialized = useRef(false);
  const lastFetchedTemplateValues = useRef<string>("");
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
   */
  const templateVarValuesKey = useMemo(() => {
    return templateVars.map((varName) => `${varName}:${String(formValues[varName] ?? "")}`).join("|");
  }, [templateVars, formValues]);

  /**
   * Check if we can make a fetch request
   */
  const canFetch = useMemo(() => {
    if (!httpConfig?.url) {
      return false;
    }
    if (!hasTemplateVars) {
      return true;
    }
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

        // Prepare body
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

        // Sanitize the response data
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
          // Store the raw data as the field value
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
    if (hasFetchedOnMount.current) {
      return;
    }

    hasFetchedOnMount.current = true;

    const currentHttpConfig = httpConfigRef.current;
    const currentFormValues = formValuesRef.current;
    const currentFetchData = fetchDataRef.current;

    const canFetchNow = currentHttpConfig?.url && areTemplateVarsFilled(currentHttpConfig.url, currentFormValues);

    if (currentHttpConfig?.fetchOnMount && canFetchNow && currentFetchData) {
      void currentFetchData();
      if (currentHttpConfig.url) {
        const currentTemplateVars = extractTemplateVars(currentHttpConfig.url);
        lastFetchedTemplateValues.current = currentTemplateVars
          .map((varName) => `${varName}:${String(currentFormValues[varName] ?? "")}`)
          .join("|");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Watch template variable values and refetch (debounced 500ms) when they
   * change after the initial mount. Skips when the URL has no template vars,
   * when the values are unchanged from the last fetch, or when not all
   * template vars are filled yet.
   */
  useEffect(() => {
    if (!hasFetchedOnMount.current) {
      return;
    }

    if (!hasTemplateVars) {
      return;
    }

    if (lastFetchedTemplateValues.current === templateVarValuesKey) {
      return;
    }

    if (!canFetch) {
      return;
    }

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

      return (
        <View style={styles.container}>
          <InputLabel label={label} required={node.data.required} />

          <DependencyHint missing={missing}>
            <TouchableOpacity
              style={[
                styles.trigger,
                { backgroundColor: colors.input, borderColor: colors.border },
                error && { borderColor: colors.error },
                missing.length > 0 && { backgroundColor: colors.muted },
              ]}
              onPress={() => setModalOpen(true)}
              disabled={missing.length > 0}
              activeOpacity={0.7}
            >
              <Text style={[styles.triggerText, { color: colors.text }, !selectedOption && { color: colors.textMuted }]} numberOfLines={1}>
                {selectedOption?.label || placeholder || t("renderer.defaultHttpInput.search")}
              </Text>
              {isLoading && <ActivityIndicator size="small" color={colors.primary} style={styles.triggerLoader} />}
              {normalizedValue ? (
                <TouchableOpacity
                  onPress={() => setValue("")}
                  hitSlop={{ bottom: 8, left: 8, right: 8, top: 8 }}
                  style={styles.clearButton}
                >
                  <Text style={[styles.clearIcon, { color: colors.textMuted }]}>✕</Text>
                </TouchableOpacity>
              ) : null}
              <Text style={[styles.arrow, { color: colors.textMuted }]}>▼</Text>
            </TouchableOpacity>
          </DependencyHint>

          <Modal visible={modalOpen} transparent animationType="fade" onRequestClose={() => setModalOpen(false)}>
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalOpen(false)}>
              <TouchableOpacity style={[styles.modalContent, { backgroundColor: colors.card }]} activeOpacity={1} onPress={() => {}}>
                <View style={[styles.modalHeader, { borderBottomColor: colors.separator }]}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    {label || placeholder || t("renderer.defaultHttpInput.search")}
                  </Text>
                  <TouchableOpacity onPress={() => setModalOpen(false)}>
                    <Text style={[styles.closeButton, { color: colors.textMuted }]}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.searchContainer}>
                  <TextInput
                    style={[styles.searchInput, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.text }]}
                    placeholder={t("renderer.defaultHttpInput.search")}
                    placeholderTextColor={colors.textMuted}
                    value={searchQuery}
                    onChangeText={(text) => {
                      setSearchQuery(text);
                      setFetchError(null);
                    }}
                    autoFocus
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={colors.primary} />
                  </View>
                ) : fetchError ? (
                  <View style={styles.errorContainer}>
                    <Text style={[styles.errorText, { color: colors.error }]}>{fetchError}</Text>
                    <TouchableOpacity onPress={() => fetchData(searchQuery)} style={styles.retryButton}>
                      <Text style={[styles.retryButtonText, { color: colors.primary }]}>{t("renderer.defaultHttpInput.retry")}</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <FlatList
                    data={options}
                    keyExtractor={(item) => item.value}
                    style={styles.optionsList}
                    contentContainerStyle={styles.optionsListContent}
                    ListEmptyComponent={
                      <View style={styles.emptyContainer}>
                        <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t("renderer.defaultHttpInput.noResults")}</Text>
                      </View>
                    }
                    renderItem={({ item }) => {
                      const isSelected = item.value === normalizedValue;

                      return (
                        <TouchableOpacity
                          style={[styles.option, isSelected && { backgroundColor: colors.primaryLight }]}
                          onPress={() => {
                            setValue(item.value);
                            setModalOpen(false);
                          }}
                          activeOpacity={0.7}
                        >
                          <OptionItemContent label={item.label} description={item.description} image={item.image} />
                          {isSelected && <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>}
                        </TouchableOpacity>
                      );
                    }}
                  />
                )}
              </TouchableOpacity>
            </TouchableOpacity>
          </Modal>

          {error && <Text style={[styles.error, { color: colors.error }]}>{error}</Text>}
          {helperText && !error && <Text style={[styles.helperText, { color: colors.textMuted }]}>{helperText}</Text>}
        </View>
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

    return (
      <View style={styles.container}>
        <InputLabel label={label} required={node.data.required} />

        <DependencyHint missing={missing}>
          <TouchableOpacity
            style={[
              styles.trigger,
              { backgroundColor: colors.input, borderColor: colors.border },
              error && { borderColor: colors.error },
              (isLoading || options.length === 0) && { backgroundColor: colors.muted },
            ]}
            onPress={() => setModalOpen(true)}
            disabled={isLoading || options.length === 0}
            activeOpacity={0.7}
          >
            <Text style={[styles.triggerText, { color: colors.text }, !selectedOption && { color: colors.textMuted }]} numberOfLines={1}>
              {selectedOption?.label || placeholder || t("renderer.defaultHttpInput.selectOption")}
            </Text>
            {isLoading && <ActivityIndicator size="small" color={colors.primary} style={styles.triggerLoader} />}
            {normalizedValue ? (
              <TouchableOpacity onPress={() => setValue("")} hitSlop={{ bottom: 8, left: 8, right: 8, top: 8 }} style={styles.clearButton}>
                <Text style={[styles.clearIcon, { color: colors.textMuted }]}>✕</Text>
              </TouchableOpacity>
            ) : null}
            <Text style={[styles.arrow, { color: colors.textMuted }]}>▼</Text>
          </TouchableOpacity>
        </DependencyHint>

        {fetchHint && <Text style={[styles.disabledMessage, { color: colors.error }]}>{fetchHint}</Text>}

        <Modal visible={modalOpen} transparent animationType="fade" onRequestClose={() => setModalOpen(false)}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalOpen(false)}>
            <TouchableOpacity style={[styles.modalContent, { backgroundColor: colors.card }]} activeOpacity={1} onPress={() => {}}>
              <View style={[styles.modalHeader, { borderBottomColor: colors.separator }]}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {label || placeholder || t("renderer.defaultHttpInput.selectOption")}
                </Text>
                <TouchableOpacity onPress={() => setModalOpen(false)}>
                  <Text style={[styles.closeButton, { color: colors.textMuted }]}>✕</Text>
                </TouchableOpacity>
              </View>

              <FlatList
                data={options}
                keyExtractor={(item) => item.value}
                style={styles.optionsList}
                contentContainerStyle={styles.optionsListContent}
                renderItem={({ item }) => {
                  const isSelected = item.value === normalizedValue;

                  return (
                    <TouchableOpacity
                      style={[styles.option, isSelected && { backgroundColor: colors.primaryLight }]}
                      onPress={() => {
                        setValue(item.value);
                        setModalOpen(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <OptionItemContent label={item.label} description={item.description} image={item.image} />
                      {isSelected && <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>}
                    </TouchableOpacity>
                  );
                }}
              />
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {error && <Text style={[styles.error, { color: colors.error }]}>{error}</Text>}
        {helperText && !error && <Text style={[styles.helperText, { color: colors.textMuted }]}>{helperText}</Text>}
      </View>
    );
  }

  // If no responseMapping, render the value as text (read-only)
  return (
    <View style={styles.container}>
      <InputLabel label={label} required={node.data.required} />
      <TextInput
        style={[styles.input, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.textMuted }]}
        value={typeof value === "string" ? value : JSON.stringify(value)}
        editable={false}
      />
      {error && <Text style={[styles.error, { color: colors.error }]}>{error}</Text>}
      {helperText && !error && <Text style={[styles.helperText, { color: colors.textMuted }]}>{helperText}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  arrow: {
    fontSize: 12,
  },
  checkmark: {
    fontSize: 18,
    fontWeight: "700",
  },
  clearButton: {
    marginRight: 8,
    paddingHorizontal: 2,
  },
  clearIcon: {
    fontSize: 14,
  },
  closeButton: {
    fontSize: 24,
    fontWeight: "300",
  },
  container: {
    marginBottom: 16,
  },
  disabledMessage: {
    fontSize: 12,
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 14,
  },
  error: {
    fontSize: 12,
    marginTop: 4,
  },
  errorContainer: {
    alignItems: "center",
    paddingVertical: 16,
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
  input: {
    borderRadius: 6,
    borderWidth: 1,
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 24,
  },
  modalContent: {
    borderRadius: 12,
    maxHeight: "80%",
    padding: 16,
    width: "90%",
  },
  modalHeader: {
    alignItems: "center",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingBottom: 12,
  },
  modalOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    flex: 1,
    justifyContent: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  option: {
    alignItems: "center",
    borderRadius: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  optionsList: {
    flexGrow: 0,
    flexShrink: 1,
  },
  optionsListContent: {
    flexGrow: 0,
  },
  retryButton: {
    marginTop: 12,
  },
  retryButtonText: {
    fontSize: 14,
    textDecorationLine: "underline",
  },
  searchContainer: {
    marginBottom: 12,
  },
  searchInput: {
    borderRadius: 6,
    borderWidth: 1,
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  trigger: {
    alignItems: "center",
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  triggerLoader: {
    marginRight: 8,
  },
  triggerText: {
    flex: 1,
    fontSize: 14,
  },
});

export default DefaultHttpInput;
