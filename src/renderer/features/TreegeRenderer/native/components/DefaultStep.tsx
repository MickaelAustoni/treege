import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTranslate } from "@/renderer/hooks/useTranslate";
import type { StepRenderProps } from "@/renderer/types/renderer";
import { useTheme } from "@/shared/context/ThemeContext";

const DefaultStep = ({ label, children, isFirstStep, isLastStep, canContinue, isSubmitting, onBack, onContinue }: StepRenderProps) => {
  const t = useTranslate();
  const { colors } = useTheme();
  const continueDisabled = !canContinue || isSubmitting;

  return (
    <View>
      {label ? <Text style={[styles.label, { color: colors.text }]}>{label}</Text> : null}

      <View style={styles.content}>{children}</View>

      <View style={styles.actions}>
        {isFirstStep ? (
          <View />
        ) : (
          <TouchableOpacity
            style={[styles.backButton, { borderColor: colors.border }, isSubmitting && styles.disabled]}
            onPress={onBack}
            disabled={isSubmitting}
            activeOpacity={0.7}
          >
            <Text style={[styles.backButtonText, { color: colors.text }]}>{t("renderer.step.back")}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.continueButton,
            { backgroundColor: colors.primary },
            continueDisabled && { backgroundColor: colors.primaryDisabled, opacity: 0.6 },
          ]}
          onPress={onContinue}
          disabled={continueDisabled}
          activeOpacity={0.7}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <Text style={[styles.continueButtonText, { color: colors.primaryForeground }]}>
              {isLastStep ? t("renderer.defaultSubmitButton.submit") : t("renderer.step.continue")}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  actions: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
  },
  backButton: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  content: {
    gap: 8,
  },
  continueButton: {
    alignItems: "center",
    borderRadius: 6,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  continueButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
});

export default DefaultStep;
