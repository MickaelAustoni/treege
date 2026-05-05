import { ScrollView, StyleSheet, Text, View, ViewStyle } from "react-native";
import { TreegeRendererProvider } from "@/renderer/context/TreegeRendererContext";
import DefaultFormWrapper from "@/renderer/features/TreegeRenderer/native/components/DefaultFormWrapper";
import DefaultGroup from "@/renderer/features/TreegeRenderer/native/components/DefaultGroup";
import { defaultInputRenderers } from "@/renderer/features/TreegeRenderer/native/components/DefaultInputs";
import DefaultInputWrapper from "@/renderer/features/TreegeRenderer/native/components/DefaultInputWrapper";
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
export type TreegeRendererNativeProps = Omit<TreegeRendererProps, "className"> & {
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
  components,
  contentContainerStyle,
  flows,
  googleApiKey,
  headers,
  initialValues,
  language,
  onChange,
  onSubmit,
  style,
  theme,
  validate,
  validationMode,
}: TreegeRendererNativeProps) => {
  const { colors } = useTheme();

  const {
    canSubmit,
    clearSubmitMessage,
    config,
    formErrors,
    formValues,
    handleSubmit,
    inputNodes,
    isSubmitting,
    mergedFlow,
    missingRequiredFields,
    setFieldValue,
    submitMessage,
    t,
    visibleNodes,
    visibleRootNodes,
  } = useTreegeRenderer({
    components,
    flows,
    googleApiKey,
    headers,
    initialValues,
    language,
    onChange,
    onSubmit,
    theme,
    validate,
    validationMode,
  });

  const { FormWrapper, SubmitButton, SubmitButtonWrapper, renderNode } = useRenderNode({
    config,
    DefaultFormWrapper,
    DefaultGroup,
    DefaultInputWrapper,
    DefaultSubmitButton,
    DefaultSubmitButtonWrapper,
    defaultInputRenderers,
    defaultUI,
    formErrors,
    formValues,
    missingRequiredFields,
    setFieldValue,
    visibleNodes,
  });

  return (
    <ScrollView
      nestedScrollEnabled
      style={[styles.container, { backgroundColor: colors.background }, style]}
      contentContainerStyle={contentContainerStyle}
    >
      <TreegeRendererProvider
        value={{
          flows: mergedFlow,
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
          {/* Nodes */}
          {visibleRootNodes.map((node) => renderNode(node))}

          {/* Submit Button */}
          {canSubmit && (
            <SubmitButtonWrapper missingFields={missingRequiredFields}>
              <SubmitButton onPress={handleSubmit} disabled={isSubmitting} isSubmitting={isSubmitting}>
                {t("renderer.defaultSubmitButton.submit")}
              </SubmitButton>
            </SubmitButtonWrapper>
          )}

          {/* Powered by Treege */}
          <Text style={[styles.poweredBy, { color: colors.textMuted }]}>Powered by Treege</Text>
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
      </TreegeRendererProvider>
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
    textAlign: "center",
  },
});

export default TreegeRenderer;
