import { StyleSheet, Switch, Text, View } from "react-native";
import { InputExtraProps, InputFieldProps } from "@/renderer/types/renderer";
import { useTheme } from "@/shared/context/ThemeContext";

const DefaultSwitchInput = (field: InputFieldProps<"switch">, extra: InputExtraProps<"switch">) => {
  const { value } = field;
  const { node, setValue, error, label, helperText } = extra;
  const { colors } = useTheme();
  const isEnabled = Boolean(value);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.labelContainer}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            {label || node.data.name}
            {node.data.required && <Text style={{ color: colors.error }}>*</Text>}
          </Text>
        </View>
        <Switch
          trackColor={{ false: colors.border, true: `${colors.primary}80` }}
          thumbColor={isEnabled ? colors.primary : colors.card}
          ios_backgroundColor={colors.border}
          onValueChange={setValue}
          value={isEnabled}
        />
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
  label: {
    fontSize: 14,
    fontWeight: "500",
  },
  labelContainer: {
    flex: 1,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

export default DefaultSwitchInput;
