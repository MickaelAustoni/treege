import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTranslate } from "@/renderer/hooks/useTranslate";
import { InputRenderProps } from "@/renderer/types/renderer";
import { useTheme } from "@/shared/context/ThemeContext";

const DefaultCheckboxInput = ({ node, value, setValue, error, label, helperText }: InputRenderProps<"checkbox">) => {
  const t = useTranslate();
  const { colors } = useTheme();
  const options = node.data.options || [];
  const hasOptions = options.length > 0;
  const selectedValues = Array.isArray(value) ? value : [];
  const isSingleChecked = typeof value === "boolean" ? value : false;

  const handleToggle = (optionValue: string) => {
    if (hasOptions) {
      // Checkbox group: always allow multiple selection
      const newValues = selectedValues.includes(optionValue)
        ? selectedValues.filter((v) => v !== optionValue)
        : [...selectedValues, optionValue];
      setValue(newValues);
    } else {
      // Single checkbox: simple boolean toggle
      setValue(!isSingleChecked);
    }
  };

  const isChecked = (optionValue: string) => {
    return hasOptions ? selectedValues.includes(optionValue) : isSingleChecked;
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        {label || node.data.name}
        {node.data.required && <Text style={{ color: colors.error }}>*</Text>}
      </Text>

      {options.length > 0 ? (
        options.map((option) => {
          const optionDescription = t(option.description);
          return (
            <TouchableOpacity
              key={option.value}
              style={styles.option}
              onPress={() => handleToggle(option.value)}
              disabled={option.disabled}
              activeOpacity={0.7}
              accessible={true}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isChecked(option.value), disabled: option.disabled }}
              accessibilityLabel={t(option.label) || option.value}
            >
              <View
                style={[
                  styles.checkbox,
                  { backgroundColor: colors.input, borderColor: colors.border },
                  isChecked(option.value) && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
              >
                {isChecked(option.value) && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={[styles.optionLabel, { color: colors.textSecondary }, option.disabled && { color: colors.textMuted }]}>
                  {t(option.label) || option.value}
                </Text>
                {optionDescription && <Text style={[styles.optionDescription, { color: colors.textMuted }]}>{optionDescription}</Text>}
              </View>
            </TouchableOpacity>
          );
        })
      ) : (
        // Single checkbox without options
        <TouchableOpacity
          style={styles.option}
          onPress={() => handleToggle("")}
          activeOpacity={0.7}
          accessible={true}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isSingleChecked }}
          accessibilityLabel={label || node.data.name}
        >
          <View
            style={[
              styles.checkbox,
              { backgroundColor: colors.input, borderColor: colors.border },
              isSingleChecked && { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
          >
            {isSingleChecked && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={[styles.optionLabel, { color: colors.textSecondary }]}>{label || node.data.name}</Text>
        </TouchableOpacity>
      )}

      {error && <Text style={[styles.error, { color: colors.error }]}>{error}</Text>}
      {helperText && !error && <Text style={[styles.helperText, { color: colors.textMuted }]}>{helperText}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  checkbox: {
    alignItems: "center",
    borderRadius: 4,
    borderWidth: 2,
    height: 20,
    justifyContent: "center",
    marginRight: 12,
    width: 20,
  },
  checkmark: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  container: {
    marginBottom: 16,
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
  option: {
    alignItems: "flex-start",
    flexDirection: "row",
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  optionLabel: {
    fontSize: 14,
  },
  optionTextContainer: {
    flex: 1,
  },
});

export default DefaultCheckboxInput;
