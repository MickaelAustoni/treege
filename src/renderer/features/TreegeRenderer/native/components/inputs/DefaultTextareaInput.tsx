import { StyleSheet, Text, TextInput, View } from "react-native";
import { InputRenderProps } from "@/renderer/types/renderer";
import { useTheme } from "@/shared/context/ThemeContext";

const DefaultTextareaInput = ({ field, extra }: InputRenderProps<"textarea">) => {
  const { value, placeholder, name } = field;
  const { InputLabel, node, setValue, error, label, helperText } = extra;
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <InputLabel label={label} required={node.data.required} />
      <TextInput
        style={[
          styles.textarea,
          { backgroundColor: colors.input, borderColor: colors.border, color: colors.text },
          error && { borderColor: colors.error },
        ]}
        value={value ?? ""}
        onChangeText={setValue}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
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
  textarea: {
    borderRadius: 6,
    borderWidth: 1,
    fontSize: 14,
    minHeight: 100,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});

export default DefaultTextareaInput;
