import { FormEvent, useCallback, useMemo } from "react";
import { TreegeRendererProvider } from "@/renderer/context/TreegeRendererContext";
import { useTreegeRenderer } from "@/renderer/features/TreegeRenderer/useTreegeRenderer";
import DefaultFormWrapper from "@/renderer/features/TreegeRenderer/web/components/DefaultFormWrapper";
import { defaultInputRenderers } from "@/renderer/features/TreegeRenderer/web/components/DefaultInputs";
import DefaultInputWrapper from "@/renderer/features/TreegeRenderer/web/components/DefaultInputWrapper";
import DefaultStep from "@/renderer/features/TreegeRenderer/web/components/DefaultStep";
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
    canContinueStep,
    canSubmit,
    clearSubmitMessage,
    config,
    currentStep,
    currentStepGroupNode,
    currentStepIndex,
    firstErrorFieldId,
    formErrors,
    formValues,
    goToNextStep,
    goToPreviousStep,
    handleSubmit,
    inputNodes,
    isFirstStep,
    isLastStep,
    isSubmitting,
    mergedFlow,
    missingRequiredFields,
    setFieldValue,
    steps,
    submitMessage,
    t,
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

  const { FormWrapper, SubmitButtonWrapper, renderNode } = useRenderNode({
    config,
    DefaultFormWrapper,
    DefaultInputWrapper,
    DefaultSubmitButton,
    DefaultSubmitButtonWrapper,
    defaultInputRenderers,
    defaultUI,
    formErrors,
    formValues,
    missingRequiredFields,
    setFieldValue,
  });

  const StepComponent = config.components.step ?? DefaultStep;

  /**
   * Web-specific form submission handler with focus logic
   */
  const handleFormSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
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

  /**
   * Continue handler. Inside the flow this just advances to the next step;
   * on the last step it triggers the same submit pipeline as the form's
   * `onSubmit` (validation + onSubmit callback / submitConfig HTTP call).
   */
  const handleContinue = useCallback(() => {
    if (isLastStep) {
      void handleSubmit();
      return;
    }
    goToNextStep();
  }, [isLastStep, handleSubmit, goToNextStep]);

  const stepLabel = useMemo(() => t(currentStepGroupNode?.data?.label), [t, currentStepGroupNode]);

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
            {currentStep && (
              <SubmitButtonWrapper missingFields={isLastStep ? missingRequiredFields : undefined}>
                <StepComponent
                  step={currentStep}
                  groupNode={currentStepGroupNode}
                  stepIndex={currentStepIndex}
                  totalSteps={steps.length}
                  isFirstStep={isFirstStep}
                  isLastStep={isLastStep}
                  canContinue={canContinueStep && (!isLastStep || canSubmit)}
                  isSubmitting={isSubmitting}
                  onBack={goToPreviousStep}
                  onContinue={handleContinue}
                  label={stepLabel}
                >
                  {currentStep.nodes.map((node) => renderNode(node))}
                </StepComponent>
              </SubmitButtonWrapper>
            )}

            {/* Powered by Treege */}
            <p className="tg:py-2 tg:text-right tg:text-muted-foreground tg:text-xs">Powered by Treege</p>
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
