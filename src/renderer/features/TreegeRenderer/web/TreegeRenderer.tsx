import { SubmitEvent, useCallback } from "react";
import { TreegeRendererProvider } from "@/renderer/context/TreegeRendererContext";
import { useTreegeRenderer } from "@/renderer/features/TreegeRenderer/useTreegeRenderer";
import DefaultFormWrapper from "@/renderer/features/TreegeRenderer/web/components/DefaultFormWrapper";
import DefaultGroup from "@/renderer/features/TreegeRenderer/web/components/DefaultGroup";
import { defaultInputRenderers } from "@/renderer/features/TreegeRenderer/web/components/DefaultInputs";
import DefaultInputWrapper from "@/renderer/features/TreegeRenderer/web/components/DefaultInputWrapper";
import DefaultSubmitButton from "@/renderer/features/TreegeRenderer/web/components/DefaultSubmitButton";
import DefaultSubmitButtonWrapper from "@/renderer/features/TreegeRenderer/web/components/DefaultSubmitButtonWrapper";
import { defaultUI } from "@/renderer/features/TreegeRenderer/web/components/DefaultUI";
import RendererStyles from "@/renderer/features/TreegeRenderer/web/components/styles/RendererStyles";
import { useRenderNode } from "@/renderer/hooks/useRenderNode";
import { TreegeRendererProps } from "@/renderer/types/renderer";
import { ThemeProvider } from "@/shared/context/ThemeContext";
import { cn } from "@/shared/lib/utils";

const TreegeRenderer = ({
  components,
  className,
  flows,
  googleApiKey,
  headers,
  language,
  onChange,
  onSubmit,
  theme,
  validate,
  validationMode,
  initialValues = {},
}: TreegeRendererProps) => {
  const {
    canSubmit,
    clearSubmitMessage,
    config,
    firstErrorFieldId,
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

  /**
   * Web-specific form submission handler with SubmitEvent and focus logic
   */
  const handleFormSubmit = useCallback(
    async (e: SubmitEvent) => {
      e.preventDefault();

      // Call the shared submit logic
      const isValid = await handleSubmit();

      // If validation failed, focus the first input field with an error
      if (!isValid && firstErrorFieldId) {
        // Use id attribute for reliable focus (always present and unique)
        const input = document.getElementById(firstErrorFieldId);
        input?.focus();
      }
    },
    [handleSubmit, firstErrorFieldId],
  );

  return (
    <div className={cn("treege", className)}>
      <RendererStyles />
      <ThemeProvider theme={config.theme} storageKey="treege-renderer-theme">
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
          <FormWrapper onSubmit={handleFormSubmit}>
            {/* Node */}
            {visibleRootNodes.map((node) => renderNode(node))}

            {/* Submit */}
            {canSubmit && (
              <SubmitButtonWrapper missingFields={missingRequiredFields}>
                <SubmitButton label={t("renderer.defaultSubmitButton.submit")} disabled={isSubmitting} />
              </SubmitButtonWrapper>
            )}

            {/* Powered by Treege */}
            <p className="tg:py-2 tg:text-muted-foreground tg:text-xs">Powered by Treege</p>
          </FormWrapper>

          {/* Submit message (success/error) */}
          {submitMessage && (
            <div
              className={`tg:my-4 tg:rounded-md tg:p-4 ${
                submitMessage.type === "success"
                  ? "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                  : "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300"
              }`}
              role="alert"
            >
              <div className="tg:flex tg:items-center tg:justify-between">
                <p className="tg:font-medium tg:text-sm">{submitMessage.message}</p>
                <button
                  type="button"
                  onClick={clearSubmitMessage}
                  className="tg:ml-4 tg:font-medium tg:text-sm tg:underline tg:hover:no-underline tg:focus:outline-none"
                >
                  {t("common.close")}
                </button>
              </div>
            </div>
          )}
        </TreegeRendererProvider>
      </ThemeProvider>
    </div>
  );
};

export default TreegeRenderer;
