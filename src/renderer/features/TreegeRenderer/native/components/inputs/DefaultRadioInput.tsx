import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTranslate } from "@/renderer/hooks/useTranslate";
import { InputRenderProps } from "@/renderer/types/renderer";
import { useTheme } from "@/shared/context/ThemeContext";

const DefaultRadioInput = ({ node, value, setValue, error, label, helperText }: InputRenderProps<"radio">) => {
  const t = useTranslate();
  const { colors } = useTheme();
  const options = node.data.options || [];
  const selectedValue = value || "";

  const handleSelect = (optionValue: string) => {
    setValue(optionValue);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        {label || node.data.name}
        {node.data.required && <Text style={{ color: colors.error }}>*</Text>}
      </Text>

      {options.map((option) => {
        const isSelected = selectedValue === option.value;

        return (
          <TouchableOpacity
            key={option.value}
            style={styles.option}
            onPress={() => handleSelect(option.value)}
            disabled={option.disabled}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.radio,
                { backgroundColor: colors.input, borderColor: colors.border },
                isSelected && { borderColor: colors.primary },
              ]}
            >
              {isSelected && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
            </View>
            {option.image && <Image source={{ uri: option.image }} style={styles.image} />}
            <Text style={[styles.optionLabel, { color: colors.textSecondary }, option.disabled && { color: colors.textMuted }]}>
              {t(option.label) || option.value}
            </Text>
          </TouchableOpacity>
        );
      })}

      {error && <Text style={[styles.error, { color: colors.error }]}>{error}</Text>}
      {helperText && !error && <Text style={[styles.helperText, { color: colors.textMuted }]}>{helperText}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
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
  image: {
    borderRadius: 4,
    height: 32,
    marginRight: 8,
    width: 32,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  option: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 8,
  },
  optionLabel: {
    fontSize: 14,
  },
  radio: {
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 2,
    height: 20,
    justifyContent: "center",
    marginRight: 12,
    width: 20,
  },
  radioInner: {
    borderRadius: 5,
    height: 10,
    width: 10,
  },
});

export default DefaultRadioInput;
