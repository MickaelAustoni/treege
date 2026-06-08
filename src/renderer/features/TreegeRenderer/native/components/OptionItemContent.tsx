import { Image, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/shared/context/ThemeContext";

interface OptionItemContentProps {
  /** Already-translated option label. */
  label: string;
  /** Already-translated option description (optional). */
  description?: string;
  /** Option image — base64 data URL or remote URL (optional). */
  image?: string;
  /** Muted styling when the option is disabled. */
  disabled?: boolean;
}

/**
 * Shared content for an option row in a dropdown/select modal: an optional
 * leading image, the label, and an optional muted description underneath. The
 * selection indicator is left to the caller so it can sit outside this block.
 */
const OptionItemContent = ({ label, description, image, disabled }: OptionItemContentProps) => {
  const { colors } = useTheme();

  return (
    <View style={styles.content}>
      {image ? <Image source={{ uri: image }} style={styles.image} /> : null}
      <View style={styles.textWrapper}>
        <Text style={[styles.label, { color: disabled ? colors.textMuted : colors.text }]}>{label}</Text>
        {description ? <Text style={[styles.description, { color: colors.textMuted }]}>{description}</Text> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  content: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 12,
  },
  description: {
    fontSize: 12,
    marginTop: 2,
  },
  image: {
    borderRadius: 6,
    height: 40,
    width: 40,
  },
  label: {
    fontSize: 14,
  },
  textWrapper: {
    flex: 1,
  },
});

export default OptionItemContent;
