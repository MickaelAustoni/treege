import { ComponentType, useMemo } from "react";
import { ScrollView, ScrollViewProps, StyleSheet, Text, View, ViewStyle } from "react-native";
import { useTreegeRendererConfig } from "@/renderer/context/TreegeRendererProvider";
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
 * - Omits className / style / disableSectionBorder / formId (web-only; the
 *   native step has no section border)
 * - Adds style and contentContainerStyle (React Native specific)
 */
export type TreegeRendererNativeProps = Omit<TreegeRendererProps, "className" | "disableSectionBorder" | "formId" | "style"> & {
  /**
   * Style for the ScrollView container
   */
  style?: ViewStyle;
  /**
   * Style for the ScrollView content container
   * Use this to center content vertically with flexGrow: 1 and justifyContent: 'center'
   */
  contentContainerStyle?: ViewStyle;
  /**
   * Scroll container to render the form in place of the default ScrollView, e.g. a keyboard-aware one
   * (`KeyboardAwareScrollView` of react-native-keyboard-controller) that follows the caret while typing.
   * It receives the ScrollView props; the default keyboard insets are then left to it.
   */
  ScrollComponent?: ComponentType<ScrollViewProps>;
};

/**
 * Internal component that uses theme colors
 * Must be inside ThemeProvider to access useTheme
 */
const TreegeRendererContent = ({
  ScrollComponent,
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
  title,
  validate,
  validationMode,
}: TreegeRendererNativeProps) => {
  const { colors } = useTheme();

  const {
    canContinue,
    canGoBack,
    clearSubmitMessage,
    config,
    currentStep,
    currentStepGroupNode,
    currentStepIndex,
    formErrors,
    formTitle,
    formValues,
    handleBack,
    handleContinue,
    handleSubmit,
    inputNodes,
    isFinalStep,
    isFirstStep,
    isSubmitting,
    missingRequiredFields,
    setFieldValue,
    stepLabel,
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
    isSubmitting: isSubmittingProp,
    language,
    onBack,
    onChange,
    onSubmit,
    showPoweredBy,
    theme,
    title,
    validate,
    validationMode,
  });

  const { FormWrapper, LoadingSkeleton, StepComponent, SubmitButtonWrapper, renderNode } = useRenderNode({
    config,
    DefaultFormWrapper,
    DefaultInputLabel,
    DefaultInputWrapper,
    DefaultLoadingSkeleton,
    DefaultStep,
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

  // A scroll container of the app's own handles the keyboard itself: the default one asks iOS to keep the focused
  // field above the keyboard, and taps on the form's buttons go through while it is up
  const ScrollContainer = ScrollComponent ?? ScrollView;

  return (
    <ScrollContainer
      nestedScrollEnabled
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets={!ScrollComponent}
      style={[styles.container, { backgroundColor: colors.background }, style]}
      contentContainerStyle={contentContainerStyle}
    >
      {formTitle ? <Text style={[styles.title, { color: colors.text }]}>{formTitle}</Text> : null}
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
                  isLastStep={isFinalStep}
                  canContinue={canContinue}
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
    </ScrollContainer>
  );
};

const TreegeRenderer = (props: TreegeRendererNativeProps) => {
  const globalConfig = useTreegeRendererConfig();
  // Props take precedence over the provider, color by color
  const colors = useMemo(() => ({ ...globalConfig?.colors, ...props.colors }), [globalConfig?.colors, props.colors]);

  return (
    <ThemeProvider theme={props.theme ?? globalConfig?.theme} colors={colors} storageKey="treege-renderer-theme">
      <TreegeRendererContent {...props} />
    </ThemeProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    // Not `flex: 1` (whose 0 flex-basis collapses to zero height inside
    // auto-sized parents like bottom sheets): auto basis sizes the ScrollView
    // by its content, while grow/shrink still fill bounded parents.
    flexBasis: "auto",
    flexGrow: 1,
    flexShrink: 1,
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
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
});

export default TreegeRenderer;
