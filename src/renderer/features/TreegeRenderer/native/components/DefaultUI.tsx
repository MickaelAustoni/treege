import { StyleSheet, Text, View } from "react-native";
import { useTranslate } from "@/renderer/hooks/useTranslate";
import { UiRenderProps } from "@/renderer/types/renderer";
import { useTheme } from "@/shared/context/ThemeContext";

const DefaultTitleUI = ({ node }: UiRenderProps) => {
  const t = useTranslate();
  const { colors } = useTheme();
  const label = t(node.data?.label);

  return <Text style={[styles.title, { color: colors.text }]}>{label}</Text>;
};

const DefaultDividerUI = () => {
  const { colors } = useTheme();
  return <View style={[styles.divider, { backgroundColor: colors.separator }]} />;
};

const styles = StyleSheet.create({
  divider: {
    height: 1,
    marginBottom: 16,
    marginTop: 0,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
  },
});

// Export individual components
export { DefaultDividerUI, DefaultTitleUI };

// Default UI renderers mapping
export const defaultUI = {
  divider: DefaultDividerUI,
  title: DefaultTitleUI,
};
