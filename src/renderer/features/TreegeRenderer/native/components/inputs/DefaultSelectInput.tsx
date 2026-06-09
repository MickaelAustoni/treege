import { useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import OptionItemContent from "@/renderer/features/TreegeRenderer/native/components/OptionItemContent";
import { useTranslate } from "@/renderer/hooks/useTranslate";
import { InputRenderProps } from "@/renderer/types/renderer";
import { useTheme } from "@/shared/context/ThemeContext";

const DefaultSelectInput = ({ field, extra }: InputRenderProps<"select">) => {
  const [isOpen, setIsOpen] = useState(false);
  const { value, placeholder } = field;
  const { node, setValue, error, label, helperText } = extra;
  const { colors } = useTheme();
  const t = useTranslate();
  const options = node.data.options || [];
  const isMultiple = node.data.multiple;
  const selectedValues = Array.isArray(value) ? value : value ? [value] : [];

  const handleSelect = (optionValue: string) => {
    if (isMultiple) {
      const newValues = selectedValues.includes(optionValue)
        ? selectedValues.filter((v) => v !== optionValue)
        : [...selectedValues, optionValue];
      setValue(newValues);
    } else {
      setValue(optionValue);
      setIsOpen(false);
    }
  };

  const getDisplayText = () => {
    if (selectedValues.length === 0) {
      return placeholder || "Select...";
    }

    if (isMultiple) {
      const selectedLabels = options.filter((opt) => selectedValues.includes(opt.value)).map((opt) => t(opt.label) || opt.value);
      return selectedLabels.join(", ");
    }

    const selectedOption = options.find((opt) => opt.value === selectedValues[0]);
    return selectedOption ? t(selectedOption.label) || selectedOption.value : placeholder || "Select...";
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
        <Text style={[styles.triggerText, { color: colors.text }, selectedValues.length === 0 && { color: colors.textMuted }]}>
          {getDisplayText()}
        </Text>
        <Text style={[styles.arrow, { color: colors.textMuted }]}>▼</Text>
      </TouchableOpacity>

      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={() => setIsOpen(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsOpen(false)}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]} onStartShouldSetResponder={() => true}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{label || node.data.name}</Text>
              <TouchableOpacity onPress={() => setIsOpen(false)}>
                <Text style={[styles.closeButton, { color: colors.textMuted }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.optionsList}>
              {options.map((option) => {
                const isSelected = selectedValues.includes(option.value);

                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.option, isSelected && { backgroundColor: `${colors.primary}20` }]}
                    onPress={() => handleSelect(option.value)}
                    disabled={option.disabled}
                    activeOpacity={0.7}
                  >
                    <OptionItemContent
                      label={t(option.label) || option.value}
                      description={t(option.description)}
                      image={option.image}
                      disabled={option.disabled}
                    />
                    {isSelected && <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {isMultiple && (
              <TouchableOpacity style={[styles.doneButton, { backgroundColor: colors.primary }]} onPress={() => setIsOpen(false)}>
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            )}
          </View>
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
  doneButton: {
    alignItems: "center",
    borderRadius: 6,
    marginTop: 12,
    paddingVertical: 12,
  },
  doneButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
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
    maxHeight: 300,
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

export default DefaultSelectInput;
