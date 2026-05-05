import { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { InputRenderProps } from "@/renderer/types/renderer";
import { useTheme } from "@/shared/context/ThemeContext";

const DefaultNumberInput = ({ node, value, setValue, error, label, placeholder, helperText, name }: InputRenderProps<"number">) => {
  const { colors } = useTheme();
  const [textValue, setTextValue] = useState(value?.toString() ?? "");

  /**
   * Sync the local text buffer when the form value changes from outside
   * (default values, programmatic resets, reference fields).
   */
  useEffect(() => {
    setTextValue(value?.toString() ?? "");
  }, [value]);

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        {label || node.data.name}
        {node.data.required && <Text style={{ color: colors.error }}>*</Text>}
      </Text>
      <TextInput
        style={[
          styles.input,
          { backgroundColor: colors.input, borderColor: colors.border, color: colors.text },
          error && { borderColor: colors.error },
        ]}
        value={textValue}
        onChangeText={(text) => {
          setTextValue(text);

          if (text.trim() === "") {
            setValue(null);
            return;
          }

          const parsed = Number(text);
          if (!Number.isNaN(parsed)) {
            setValue(parsed);
          }
        }}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType="numeric"
        accessibilityLabel={name}
      />
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
  input: {
    borderRadius: 6,
    borderWidth: 1,
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
});

export default DefaultNumberInput;
