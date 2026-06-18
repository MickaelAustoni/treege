import { type StyleProp, StyleSheet, Text, type TextStyle } from "react-native";
import type { InputLabelRenderProps } from "@/renderer/types/renderer";
import { useTheme } from "@/shared/context/ThemeContext";

/**
 * Default input label (native). Renders nothing when no end-user label is
 * configured, so the technical node key (`node.data.name`) never leaks into the
 * rendered form. Native inputs keep an accessible name through the
 * `accessibilityLabel` fallback on the control itself. Override globally via
 * `components.inputLabel`.
 */
const DefaultInputLabel = ({ label, required, style }: InputLabelRenderProps) => {
  const { colors } = useTheme();

  if (!label) {
    return null;
  }

  return (
    <Text style={[styles.label, { color: colors.textSecondary }, style as StyleProp<TextStyle>]}>
      {label}
      {required && <Text style={{ color: colors.error }}>*</Text>}
    </Text>
  );
};

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
});

export default DefaultInputLabel;
