import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useTreegeRendererContext } from "@/renderer/context/TreegeRendererContext";
import { useTranslate } from "@/renderer/hooks/useTranslate";
import { InputRenderProps } from "@/renderer/types/renderer";
import { convertFormValuesToNamedFormat } from "@/renderer/utils/form";
import { getValueByPath, mergeHttpHeaders } from "@/renderer/utils/http";
import { getFieldNameFromNodeId } from "@/renderer/utils/node";
import { sanitizeHttpResponse } from "@/renderer/utils/sanitize.native";
import { useTheme } from "@/shared/context/ThemeContext";

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

const DefaultHttpInput = ({
  node,
  value,
  setValue,
  error,
  label,
  placeholder,
  helperText,
  id: _id,
  name: _name,
}: InputRenderProps<"http">) => {
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [options, setOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const { formValues, inputNodes, headers } = useTreegeRendererContext();
  const { colors } = useTheme();
  const { httpConfig } = node.data;
  const t = useTranslate();
  const hasFetchedOnMount = useRef(false);
  const lastFetchedTemplateValues = useRef<string>("");
  // Refs to store latest values without triggering re-renders
  const httpConfigRef = useRef(httpConfig);
  const formValuesRef = useRef(formValues);
  const inputNodesRef = useRef(inputNodes);
  const headersRef = useRef(headers);
  const setValueRef = useRef(setValue);
  const fetchDataRef = useRef<((search?: string) => Promise<void>) | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

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
        // Replace template variables in URL and add search param if configured
        const baseUrl = replaceTemplateVars(currentHttpConfig.url, currentFormValues, true);

        const url =
          currentHttpConfig.searchParam && search
            ? `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}${currentHttpConfig.searchParam}=${encodeURIComponent(search)}`
            : baseUrl;

        // Replace template variables in headers, merge with global ones
        // (field-level headers override globals on key collision).
        const replaceVars = (header: { key: string; value: string }) => ({
          key: header.key,
          value: replaceTemplateVars(header.value, currentFormValues),
        });
        const mergedHeaders = mergeHttpHeaders(
          [{ key: "Content-Type", value: "application/json" }],
          headersRef.current?.map(replaceVars),
          currentHttpConfig.headers?.map(replaceVars),
        );

        // Prepare body
        const body = ["POST", "PUT", "PATCH"].includes(currentHttpConfig.method || "")
          ? currentHttpConfig.sendAllFormValues
            ? JSON.stringify(convertFormValuesToNamedFormat(currentFormValues, inputNodesRef.current))
            : currentHttpConfig.body
              ? replaceTemplateVars(currentHttpConfig.body, currentFormValues)
              : undefined
          : undefined;

        const timeoutId = setTimeout(() => abortController.abort(), 30000);
        const response = await fetch(url, {
          body: body || undefined,
          headers: Object.fromEntries(mergedHeaders.filter((h) => h.key && h.value).map((h) => [h.key, h.value])),
          method: currentHttpConfig.method || "GET",
          signal: abortController.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          setFetchError(`HTTP Error ${response.status}: ${response.statusText}`);
          setLoading(false);
          return;
        }

        const data: HttpResponse = await response.json();

        // Sanitize the response data
        const sanitizedData = sanitizeHttpResponse(data) as HttpResponse;

        // Extract data using responsePath
        const extractedData = currentHttpConfig.responsePath
          ? getValueByPath(sanitizedData, currentHttpConfig.responsePath)
          : sanitizedData;

        // If responseMapping is configured, map the data to options
        if (currentHttpConfig.responseMapping && Array.isArray(extractedData)) {
          const { valueField = "value", labelField = "label" } = currentHttpConfig.responseMapping;

          const mappedOptions = extractedData.map((item) => ({
            label: String(getValueByPath(item as HttpResponse, labelField) || ""),
            value: String(getValueByPath(item as HttpResponse, valueField) || ""),
          }));

          setOptions(mappedOptions);
        } else {
          // Store the raw data as the field value
          currentSetValue(typeof extractedData === "string" ? extractedData : JSON.stringify(extractedData));
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          // Request was cancelled, don't update state
          return;
        }
        const errorMessage = err instanceof Error ? err.message : t("renderer.defaultHttpInput.fetchFailed");
        setFetchError(errorMessage);
        console.error("HTTP Input fetch error:", err);
      } finally {
        setLoading(false);
        abortControllerRef.current = null;
      }
    },
    [t],
  );

  /**
   * Update refs
   */
  useEffect(() => {
    httpConfigRef.current = httpConfig;
    formValuesRef.current = formValues;
    inputNodesRef.current = inputNodes;
    headersRef.current = headers;
    setValueRef.current = setValue;
    fetchDataRef.current = fetchData;
  }, [httpConfig, formValues, inputNodes, headers, setValue, fetchData]);

  /**
   * Cleanup: abort any pending request on unmount
   */
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  /**
   * Effect 1: Fetch on mount if fetchOnMount is true
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
   * Effect 2: Watch template variables and refetch when they change (debounced)
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
   * Effect 3: Debounced search for combobox
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
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            {label || node.data.name}
            {node.data.required && <Text style={{ color: colors.error }}>*</Text>}
          </Text>

          <TouchableOpacity
            style={[styles.trigger, { backgroundColor: colors.input, borderColor: colors.border }, error && { borderColor: colors.error }]}
            onPress={() => setModalOpen(true)}
            activeOpacity={0.7}
          >
            {isLoading ? (
              <View style={styles.loadingTrigger}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.triggerText, { color: colors.textMuted }]} numberOfLines={1}>
                  {selectedOption?.label || placeholder || t("renderer.defaultHttpInput.search")}
                </Text>
              </View>
            ) : (
              <Text style={[styles.triggerText, { color: colors.text }, !selectedOption && { color: colors.textMuted }]} numberOfLines={1}>
                {selectedOption?.label || placeholder || t("renderer.defaultHttpInput.search")}
              </Text>
            )}
            <Text style={[styles.arrow, { color: colors.textMuted }]}>▼</Text>
          </TouchableOpacity>

          <Modal visible={modalOpen} transparent animationType="fade" onRequestClose={() => setModalOpen(false)}>
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalOpen(false)}>
              <TouchableOpacity style={[styles.modalContent, { backgroundColor: colors.card }]} activeOpacity={1} onPress={() => {}}>
                <View style={[styles.modalHeader, { borderBottomColor: colors.separator }]}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>{label || node.data.name}</Text>
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
                          <Text style={[styles.optionText, { color: colors.text }]}>{item.label}</Text>
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

    // Build tooltip/helper message for disabled state
    const emptyVars = templateVars.filter((varName) => {
      const value = formValues[varName];
      return value === undefined || value === null || value === "";
    });

    const emptyVarNames = emptyVars.map((varName) => getFieldNameFromNodeId(varName, inputNodes) || varName);

    const disabledMessage =
      options.length === 0 && !isLoading
        ? fetchError
          ? fetchError
          : emptyVars.length > 0
            ? `${t("renderer.defaultHttpInput.waitingForRequiredFields")}: ${emptyVarNames.join(", ")}`
            : t("renderer.defaultHttpInput.noDataAvailable")
        : undefined;

    return (
      <View style={styles.container}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {label || node.data.name}
          {node.data.required && <Text style={{ color: colors.error }}>*</Text>}
        </Text>

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
          {isLoading && <ActivityIndicator size="small" color={colors.primary} style={styles.triggerLoader} />}
          <Text style={[styles.triggerText, { color: colors.text }, !selectedOption && { color: colors.textMuted }]} numberOfLines={1}>
            {selectedOption?.label || placeholder || t("renderer.defaultHttpInput.selectOption")}
          </Text>
          <Text style={[styles.arrow, { color: colors.textMuted }]}>▼</Text>
        </TouchableOpacity>

        {disabledMessage && <Text style={[styles.disabledMessage, { color: colors.error }]}>{disabledMessage}</Text>}

        <Modal visible={modalOpen} transparent animationType="fade" onRequestClose={() => setModalOpen(false)}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalOpen(false)}>
            <TouchableOpacity style={[styles.modalContent, { backgroundColor: colors.card }]} activeOpacity={1} onPress={() => {}}>
              <View style={[styles.modalHeader, { borderBottomColor: colors.separator }]}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>{label || node.data.name}</Text>
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
                      <Text style={[styles.optionText, { color: colors.text }]}>{item.label}</Text>
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
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        {label || node.data.name}
        {node.data.required && <Text style={{ color: colors.error }}>*</Text>}
      </Text>
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
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 24,
  },
  loadingTrigger: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 8,
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
  optionText: {
    flex: 1,
    fontSize: 14,
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
