import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useTreegeRenderRuntime } from "@/renderer/context/TreegeRenderRuntimeProvider";
import { useTranslate } from "@/renderer/hooks/useTranslate";
import { InputRenderProps } from "@/renderer/types/renderer";
import { useTheme } from "@/shared/context/ThemeContext";

type AddressSuggestion = {
  label: string;
  value: string;
};

/**
 * Fetch address suggestions from Nominatim (OpenStreetMap)
 */
const fetchNominatimSuggestions = async (query: string, language?: string): Promise<AddressSuggestion[]> => {
  if (!query || query.trim().length < 3) {
    return [];
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=jsonv2&addressdetails=1&limit=5`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "Treege Renderer",
          ...(language && { "Accept-Language": language }),
        },
      },
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();

    return data.map((item: { display_name: string }) => ({
      label: item.display_name,
      value: item.display_name,
    }));
  } catch (error) {
    console.error("Nominatim fetch error:", error);
    return [];
  }
};

/**
 * Fetch address suggestions from Google Places API (REST)
 */
const fetchGooglePlacesSuggestions = async (query: string, apiKey: string): Promise<AddressSuggestion[]> => {
  if (!query || query.trim().length < 3) {
    return [];
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${apiKey}`,
    );

    if (!response.ok) {
      console.warn("Google Places API request failed:", response.status);
      return [];
    }

    const data = await response.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.warn("Google Places API status:", data.status);
      return [];
    }

    return (data.predictions || []).map((prediction: { description: string }) => ({
      label: prediction.description,
      value: prediction.description,
    }));
  } catch (error) {
    console.error("Google Places fetch error:", error);
    return [];
  }
};

const DefaultAddressInput = ({ field, extra }: InputRenderProps<"address">) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const { value, placeholder, id: _id, name: _name } = field;
  const { InputLabel, node, setValue, error, label, helperText } = extra;
  const { language, googleApiKey } = useTreegeRenderRuntime();
  const t = useTranslate();
  const { colors } = useTheme();

  const handleSelectSuggestion = useCallback(
    (suggestion: AddressSuggestion) => {
      setValue(suggestion.value);
      setSearchQuery(""); // Reset search
      setShowSuggestions(false);
      setSuggestions([]); // Clear suggestions
    },
    [setValue],
  );

  const handleClose = () => {
    setShowSuggestions(false);
  };

  /**
   * Fetch suggestions with debounce
   */
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 3) {
      setSuggestions([]);
      setLoading(false);
      return undefined;
    }

    setLoading(true);

    const timer = setTimeout(async () => {
      const results = googleApiKey
        ? await fetchGooglePlacesSuggestions(searchQuery, googleApiKey)
        : await fetchNominatimSuggestions(searchQuery, language);

      setSuggestions(results);
      setLoading(false);
    }, 300);

    return () => {
      clearTimeout(timer);
      setLoading(false);
    };
  }, [searchQuery, language, googleApiKey]);

  return (
    <View style={styles.container}>
      <InputLabel label={label} required={node.data.required} />

      <TouchableOpacity
        style={[styles.trigger, { backgroundColor: colors.input, borderColor: colors.border }, error && { borderColor: colors.error }]}
        onPress={() => setShowSuggestions(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.triggerText, { color: colors.text }, !value && { color: colors.textMuted }]} numberOfLines={1}>
          {value || placeholder || t("renderer.defaultAddressInput.enterAddress")}
        </Text>
        <Text style={styles.icon}>📍</Text>
      </TouchableOpacity>

      <Modal visible={showSuggestions} transparent animationType="fade" onRequestClose={handleClose}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={handleClose}>
          <TouchableOpacity style={[styles.modalContent, { backgroundColor: colors.card }]} activeOpacity={1} onPress={() => {}}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.separator }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {label || placeholder || t("renderer.defaultAddressInput.enterAddress")}
              </Text>
              <TouchableOpacity onPress={handleClose}>
                <Text style={[styles.closeButton, { color: colors.textMuted }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <TextInput
                style={[styles.searchInput, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.text }]}
                placeholder={placeholder || t("renderer.defaultAddressInput.enterAddress")}
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
                autoCapitalize="none"
                autoCorrect={false}
              />
              {loading && <ActivityIndicator size="small" color={colors.primary} style={styles.searchLoader} />}
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textMuted }]}>{t("renderer.defaultAddressInput.searching")}</Text>
              </View>
            ) : (
              <FlatList
                data={suggestions}
                keyExtractor={(_, index) => index.toString()}
                style={styles.suggestionsList}
                contentContainerStyle={styles.suggestionsListContent}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={
                  searchQuery.length >= 3 ? (
                    <View style={styles.emptyContainer}>
                      <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                        {t("renderer.defaultAddressInput.noAddressesFound")}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.emptyContainer}>
                      <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t("renderer.defaultAddressInput.typeMinChars")}</Text>
                    </View>
                  )
                }
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.suggestionItem} onPress={() => handleSelectSuggestion(item)} activeOpacity={0.7}>
                    <Text style={styles.suggestionIcon}>📍</Text>
                    <Text style={[styles.suggestionText, { color: colors.text }]} numberOfLines={2}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {error && <Text style={[styles.error, { color: colors.error }]}>{error}</Text>}
      {helperText && !error && <Text style={[styles.helperText, { color: colors.textMuted }]}>{helperText}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  closeButton: {
    fontSize: 24,
    fontWeight: "300",
  },
  container: {
    marginBottom: 16,
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
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
  icon: {
    fontSize: 16,
  },
  loadingContainer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 24,
  },
  loadingText: {
    fontSize: 14,
    marginLeft: 8,
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
  searchContainer: {
    marginBottom: 12,
    position: "relative",
  },
  searchInput: {
    borderRadius: 6,
    borderWidth: 1,
    fontSize: 14,
    paddingHorizontal: 12,
    paddingRight: 40,
    paddingVertical: 10,
  },
  searchLoader: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: [{ translateY: -10 }],
  },
  suggestionIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  suggestionItem: {
    alignItems: "center",
    borderRadius: 6,
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  suggestionsList: {
    flexGrow: 0,
    flexShrink: 1,
  },
  suggestionsListContent: {
    flexGrow: 0,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
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
  triggerText: {
    flex: 1,
    fontSize: 14,
  },
});

export default DefaultAddressInput;
