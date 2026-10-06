import { StyleSheet, Switch, Text, View } from "react-native";
import { InputRenderProps } from "@/renderer/types/renderer";
import { useTheme } from "@/shared/context/ThemeContext";

/**
 * The thumb is white in both themes and in both states, as the platforms' own switches draw it: it stands out
 * from the green track when on and from the grey one when off.
 */
const SWITCH_THUMB_COLOR = "#FFFFFF";

const DefaultSwitchInput = ({ field, extra }: InputRenderProps<"switch">) => {
  const { value } = field;
  const { InputLabel, node, setValue, error, label, helperText } = extra;
  const { colors } = useTheme();
  const isEnabled = Boolean(value);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.labelContainer}>
          <InputLabel label={label} required={node.data.required} />
        </View>
        <Switch
          trackColor={{ false: colors.borderFocus, true: colors.success }}
          thumbColor={SWITCH_THUMB_COLOR}
          ios_backgroundColor={colors.borderFocus}
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
