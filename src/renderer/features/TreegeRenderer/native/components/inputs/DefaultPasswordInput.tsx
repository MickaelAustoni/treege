import { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { InputRenderProps } from "@/renderer/types/renderer";
import { useTheme } from "@/shared/context/ThemeContext";

const DefaultPasswordInput = ({ field, extra }: InputRenderProps<"password">) => {
  const [showPassword, setShowPassword] = useState(false);
  const { value, placeholder, name } = field;
  const { InputLabel, node, setValue, error, label, helperText } = extra;
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <InputLabel label={label} required={node.data.required} />
      <View style={styles.inputWrapper}>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: colors.input, borderColor: colors.border, color: colors.text },
            error && { borderColor: colors.error },
          ]}
          value={value ?? ""}
          onChangeText={setValue}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={!showPassword}
          accessibilityLabel={name}
        />
        <TouchableOpacity style={styles.toggleButton} onPress={() => setShowPassword(!showPassword)} activeOpacity={0.7}>
          <Text style={[styles.toggleText, { color: colors.primary }]}>{showPassword ? "Hide" : "Show"}</Text>
        </TouchableOpacity>
      </View>
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
    flex: 1,
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inputWrapper: {
    alignItems: "center",
    flexDirection: "row",
    position: "relative",
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    position: "absolute",
    right: 0,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: "600",
  },
});

export default DefaultPasswordInput;
