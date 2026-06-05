import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { MissingDependency } from "@/renderer/hooks/useMissingDependencies";
import { useTranslate } from "@/renderer/hooks/useTranslate";
import { useTheme } from "@/shared/context/ThemeContext";

interface DependencyHintProps {
  /** Unfilled fields the input depends on (from `useMissingDependencies`). */
  missing: MissingDependency[];
  children: ReactNode;
}

/**
 * Renders an input control followed by an inline caption listing the fields the
 * user must fill before the input's dynamic options can load. Mobile has no
 * hover, so the hint is always-visible text rather than a tooltip. Renders only
 * the children when there are no missing dependencies.
 */
const DependencyHint = ({ missing, children }: DependencyHintProps) => {
  const t = useTranslate();
  const { colors } = useTheme();

  return (
    <>
      {children}
      {missing.length > 0 && (
        <View style={styles.container}>
          <Text style={[styles.title, { color: colors.textMuted }]}>{t("renderer.dependencyHint.title")}</Text>
          {missing.map((dependency) => (
            <Text key={dependency.id} style={[styles.item, { color: colors.textMuted }]}>
              {"•"} {dependency.label}
            </Text>
          ))}
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: { gap: 2, marginTop: 4 },
  item: { fontSize: 12 },
  title: { fontSize: 12, fontWeight: "500" },
});

export default DependencyHint;
