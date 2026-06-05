import { useMemo, useState } from "react";
import { FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useTranslate } from "@/renderer/hooks/useTranslate";
import { InputExtraProps, InputFieldProps } from "@/renderer/types/renderer";
import { useTheme } from "@/shared/context/ThemeContext";

const DefaultAutocompleteInput = (field: InputFieldProps<"autocomplete">, extra: InputExtraProps<"autocomplete">) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { value, placeholder } = field;
  const { node, setValue, error, label, helperText } = extra;
  const t = useTranslate();
  const { colors } = useTheme();
  const options = node.data.options || [];
  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) {
      return options;
    }

    const query = searchQuery.toLowerCase();
    return options.filter((option) => {
      const optionLabel = t(option.label);
      return optionLabel.toLowerCase().includes(query) || option.value.toLowerCase().includes(query);
    });
  }, [options, searchQuery, t]);

  const handleSelect = (optionValue: string) => {
    setValue(optionValue === value ? "" : optionValue);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleClose = () => {
    setIsOpen(false);
    setSearchQuery("");
  };

  const getDisplayText = () => {
    if (!(value && selectedOption)) {
      return placeholder || t("renderer.defaultAutocompleteInput.selectOption");
    }
    return t(selectedOption.label);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        {label || node.data.name}
        {node.data.required && <Text style={{ color: colors.error }}>*</Text>}
      </Text>

      <TouchableOpacity
        style={[styles.trigger, { backgroundColor: colors.input, borderColor: colors.border }, error && { borderColor: colors.error }]}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.triggerText, { color: colors.text }, !value && { color: colors.textMuted }]} numberOfLines={1}>
          {getDisplayText()}
        </Text>
        <Text style={[styles.arrow, { color: colors.textMuted }]}>▼</Text>
      </TouchableOpacity>

      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={handleClose}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={handleClose}>
          <TouchableOpacity style={[styles.modalContent, { backgroundColor: colors.card }]} activeOpacity={1} onPress={() => {}}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.separator }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{label || node.data.name}</Text>
              <TouchableOpacity onPress={handleClose}>
                <Text style={[styles.closeButton, { color: colors.textMuted }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <TextInput
                style={[styles.searchInput, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.text }]}
                placeholder={placeholder || t("renderer.defaultAutocompleteInput.search")}
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <FlatList
              data={filteredOptions}
              keyExtractor={(item) => item.value}
              style={styles.optionsList}
              contentContainerStyle={styles.optionsListContent}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t("renderer.defaultAutocompleteInput.noResults")}</Text>
                </View>
              }
              renderItem={({ item }) => {
                const isSelected = item.value === value;

                return (
                  <TouchableOpacity
                    style={[styles.option, isSelected && { backgroundColor: colors.primaryLight }]}
                    onPress={() => handleSelect(item.value)}
                    disabled={item.disabled}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.optionText, { color: colors.text }, item.disabled && { color: colors.textMuted }]}>
                      {t(item.label)}
                    </Text>
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
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
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
  triggerText: {
    flex: 1,
    fontSize: 14,
  },
});

export default DefaultAutocompleteInput;
