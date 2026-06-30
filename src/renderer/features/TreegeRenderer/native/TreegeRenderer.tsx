import { useCallback, useMemo } from "react";
import { ScrollView, StyleSheet, Text, View, ViewStyle } from "react-native";
import { TreegeRenderRuntimeProvider } from "@/renderer/context/TreegeRenderRuntimeProvider";
import DefaultFormWrapper from "@/renderer/features/TreegeRenderer/native/components/DefaultFormWrapper";
import DefaultInputLabel from "@/renderer/features/TreegeRenderer/native/components/DefaultInputLabel";
import { defaultInputRenderers } from "@/renderer/features/TreegeRenderer/native/components/DefaultInputs";
import DefaultInputWrapper from "@/renderer/features/TreegeRenderer/native/components/DefaultInputWrapper";
import DefaultLoadingSkeleton from "@/renderer/features/TreegeRenderer/native/components/DefaultLoadingSkeleton";
import DefaultStep from "@/renderer/features/TreegeRenderer/native/components/DefaultStep";
import DefaultSubmitButton from "@/renderer/features/TreegeRenderer/native/components/DefaultSubmitButton";
import DefaultSubmitButtonWrapper from "@/renderer/features/TreegeRenderer/native/components/DefaultSubmitButtonWrapper";
import { defaultUI } from "@/renderer/features/TreegeRenderer/native/components/DefaultUI";
import { useTreegeRenderer } from "@/renderer/features/TreegeRenderer/useTreegeRenderer";
import { useRenderNode } from "@/renderer/hooks/useRenderNode";
import { TreegeRendererProps } from "@/renderer/types/renderer";
import { ThemeProvider, useTheme } from "@/shared/context/ThemeContext";

/**
 * Props for the TreegeRenderer component (React Native)
 * Same as TreegeRendererProps but:
 * - Omits className (not used in React Native)
 * - Adds style and contentContainerStyle (React Native specific)
 */
export type TreegeRendererNativeProps = Omit<TreegeRendererProps, "className" | "formId"> & {
  /**
   * Style for the ScrollView container
   */
  style?: ViewStyle;
  /**
   * Style for the ScrollView content container
   * Use this to center content vertically with flexGrow: 1 and justifyContent: 'center'
   */
  contentContainerStyle?: ViewStyle;
};

/**
 * Internal component that uses theme colors
 * Must be inside ThemeProvider to access useTheme
 */
const TreegeRendererContent = ({
  baseUrl,
  components,
  contentContainerStyle,
  extraPayload,
  flow,
  googleApiKey,
  headers,
  initialValues,
  isLoading = false,
  isSubmitting: isSubmittingProp = false,
  language,
  onBack,
  onChange,
  onSubmit,
  showPoweredBy,
  style,
  theme,
  validate,
  validationMode,
}: TreegeRendererNativeProps) => {
  const { colors } = useTheme();

  const {
    canContinueStep,
    canSubmit,
    clearSubmitMessage,
    config,
    currentStep,
    currentStepGroupNode,
    currentStepIndex,
    formErrors,
    formValues,
    goToNextStep,
    goToPreviousStep,
    handleSubmit,
    inputNodes,
    isFirstStep,
    isLastStep,
    isSubmitting: isSubmittingInternal,
    missingRequiredFields,
    setFieldValue,
    steps,
    submitMessage,
    t,
  } = useTreegeRenderer({
    baseUrl,
    components,
    extraPayload,
    flow,
    googleApiKey,
    headers,
    initialValues,
    language,
    onChange,
    onSubmit,
    showPoweredBy,
    theme,
    validate,
    validationMode,
  });

  // Consumer-driven submitting state (e.g. async onSubmit) is OR-ed with the
  // renderer's own internal state so the button shows a loader for both.
  const isSubmitting = isSubmittingProp || isSubmittingInternal;

  const { FormWrapper, SubmitButtonWrapper, renderNode } = useRenderNode({
    config,
    DefaultFormWrapper,
    DefaultInputLabel,
    DefaultInputWrapper,
    DefaultSubmitButton,
    DefaultSubmitButtonWrapper,
    defaultInputRenderers,
    defaultUI,
    formErrors,
    formValues,
    inputNodes,
    isSubmitting,
    missingRequiredFields,
    setFieldValue,
  });

  const StepComponent = config.components.step ?? DefaultStep;
  const LoadingSkeleton = config.components.loadingSkeleton ?? DefaultLoadingSkeleton;
  const stepLabel = useMemo(() => t(currentStepGroupNode?.data?.label), [t, currentStepGroupNode]);

  const handleContinue = useCallback(() => {
    if (isLastStep) {
      void handleSubmit();
      return;
    }
    goToNextStep();
  }, [isLastStep, handleSubmit, goToNextStep]);

  /**
   * Back handler. On intermediate steps it navigates back inside the flow; on
   * the first step it delegates to the consumer's `onBack` (e.g. to step back
   * in a parent modal). With no `onBack`, the first step has no Back button.
   */
  const handleBack = useCallback(() => {
    if (isFirstStep) {
      onBack?.();
      return;
    }
    goToPreviousStep();
  }, [isFirstStep, onBack, goToPreviousStep]);

  const canGoBack = !isFirstStep || Boolean(onBack);

  return (
    <ScrollView
      nestedScrollEnabled
      style={[styles.container, { backgroundColor: colors.background }, style]}
      contentContainerStyle={contentContainerStyle}
    >
      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <TreegeRenderRuntimeProvider
          value={{
            baseUrl: config.baseUrl,
            flow,
            formErrors,
            formValues,
            googleApiKey: config.googleApiKey,
            headers: config.headers,
            inputNodes,
            language: config.language,
            setFieldValue,
          }}
        >
          <FormWrapper onSubmit={handleSubmit}>
            {currentStep && (
              <SubmitButtonWrapper missingFields={missingRequiredFields}>
                <StepComponent
                  step={currentStep}
                  groupNode={currentStepGroupNode}
                  stepIndex={currentStepIndex}
                  totalSteps={steps.length}
                  isFirstStep={isFirstStep}
                  isLastStep={isLastStep}
                  canContinue={canContinueStep && (!isLastStep || canSubmit)}
                  canGoBack={canGoBack}
                  isSubmitting={isSubmitting}
                  onBack={handleBack}
                  onContinue={handleContinue}
                  label={stepLabel}
                >
                  {currentStep.nodes.map((node) => renderNode(node))}
                </StepComponent>
              </SubmitButtonWrapper>
            )}

            {/* Powered by Treege */}
            {config.showPoweredBy && <Text style={[styles.poweredBy, { color: colors.textMuted }]}>Powered by Treege</Text>}
          </FormWrapper>

          {/* Submit message (success/error) */}
          {submitMessage && (
            <View
              style={[
                styles.message,
                {
                  backgroundColor: submitMessage.type === "success" ? colors.successBg : colors.errorBg,
                },
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  {
                    color: submitMessage.type === "success" ? colors.success : colors.error,
                  },
                ]}
              >
                {submitMessage.message}
              </Text>
              <Text
                style={[
                  styles.messageClose,
                  {
                    color: submitMessage.type === "success" ? colors.success : colors.error,
                  },
                ]}
                onPress={clearSubmitMessage}
              >
                {t("common.close")}
              </Text>
            </View>
          )}
        </TreegeRenderRuntimeProvider>
      )}
    </ScrollView>
  );
};

const TreegeRenderer = (props: TreegeRendererNativeProps) => {
  return (
    <ThemeProvider theme={props.theme} storageKey="treege-renderer-theme">
      <TreegeRendererContent {...props} />
    </ThemeProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  message: {
    borderRadius: 6,
    marginVertical: 16,
    padding: 16,
  },
  messageClose: {
    fontSize: 14,
    marginTop: 8,
    textDecorationLine: "underline",
  },
  messageText: {
    fontSize: 14,
    fontWeight: "500",
  },
  poweredBy: {
    fontSize: 12,
    paddingVertical: 8,
    textAlign: "right",
  },
});

export default TreegeRenderer;
