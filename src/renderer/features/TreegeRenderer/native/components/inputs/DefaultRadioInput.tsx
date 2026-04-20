import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTranslate } from "@/renderer/hooks/useTranslate";
import { InputRenderProps } from "@/renderer/types/renderer";
import { useTheme } from "@/shared/context/ThemeContext";

const DefaultRadioInput = ({ node, value, setValue, error, label, helperText }: InputRenderProps<"radio">) => {
  const t = useTranslate();
  const { colors } = useTheme();
  const options = node.data.options || [];
  const selectedValue = value || "";
  const isCard = node.data.variant === "card";

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
        const optionLabel = t(option.label) || option.value;
        const optionDescription = t(option.description);

        if (isCard) {
          return (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.card,
                { backgroundColor: colors.input, borderColor: colors.border },
                isSelected && { backgroundColor: `${colors.primary}10`, borderColor: colors.primary },
                option.disabled && { opacity: 0.5 },
              ]}
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
              {option.image && <Image source={{ uri: option.image }} style={styles.cardImage} />}
              <View style={styles.cardTextContainer}>
                <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>{optionLabel}</Text>
                {optionDescription && <Text style={[styles.cardDescription, { color: colors.textMuted }]}>{optionDescription}</Text>}
              </View>
            </TouchableOpacity>
          );
        }

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
            <View style={styles.optionTextContainer}>
              <Text style={[styles.optionLabel, { color: colors.textSecondary }, option.disabled && { color: colors.textMuted }]}>
                {optionLabel}
              </Text>
              {optionDescription && <Text style={[styles.optionDescription, { color: colors.textMuted }]}>{optionDescription}</Text>}
            </View>
          </TouchableOpacity>
        );
      })}

      {error && <Text style={[styles.error, { color: colors.error }]}>{error}</Text>}
      {helperText && !error && <Text style={[styles.helperText, { color: colors.textMuted }]}>{helperText}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    alignItems: "flex-start",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 8,
    padding: 12,
  },
  cardDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  cardImage: {
    borderRadius: 4,
    height: 40,
    marginRight: 12,
    width: 40,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  cardTextContainer: {
    flex: 1,
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
