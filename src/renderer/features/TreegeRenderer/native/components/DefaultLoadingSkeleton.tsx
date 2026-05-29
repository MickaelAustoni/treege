import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, ViewStyle } from "react-native";
import { useTheme } from "@/shared/context/ThemeContext";

/**
 * Single pulsing bar — the native equivalent of the web `Skeleton` primitive.
 * Uses an opacity loop (Animated) since React Native has no CSS `animate-pulse`.
 */
const SkeletonBar = ({ style }: { style?: ViewStyle | ViewStyle[] }) => {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { duration: 600, toValue: 1, useNativeDriver: true }),
        Animated.timing(opacity, { duration: 600, toValue: 0.5, useNativeDriver: true }),
      ]),
    );

    animation.start();

    return () => animation.stop();
  }, [opacity]);

  return <Animated.View style={[styles.bar, { backgroundColor: colors.muted, opacity }, style]} />;
};

/**
 * Default loading skeleton displayed by `TreegeRenderer` (native) while
 * `isLoading` is true. Mimics the visual structure of a step (title, a few
 * fields and the continue/submit button) so the layout doesn't shift once the
 * real form renders.
 */
const DefaultLoadingSkeleton = () => (
  <View accessibilityState={{ busy: true }}>
    {/* Step title */}
    <SkeletonBar style={styles.title} />

    {/* Fields */}
    <View style={styles.fields}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={styles.field}>
          <SkeletonBar style={styles.fieldLabel} />
          <SkeletonBar style={styles.fieldInput} />
        </View>
      ))}
    </View>

    {/* Navigation button (continue/submit only) */}
    <View style={styles.actions}>
      <SkeletonBar style={styles.button} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  actions: {
    alignItems: "flex-end",
    marginTop: 24,
  },
  bar: {
    borderRadius: 6,
  },
  button: {
    height: 44,
    width: 120,
  },
  field: {
    gap: 8,
  },
  fieldInput: {
    height: 44,
    width: "100%",
  },
  fieldLabel: {
    height: 16,
    width: "25%",
  },
  fields: {
    gap: 24,
  },
  title: {
    height: 24,
    marginBottom: 24,
    width: "33%",
  },
});

export default DefaultLoadingSkeleton;
