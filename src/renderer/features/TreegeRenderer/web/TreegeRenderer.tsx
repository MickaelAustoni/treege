import { FormEvent, useCallback, useState } from "react";
import { TreegeRenderRuntimeProvider } from "@/renderer/context/TreegeRenderRuntimeProvider";
import { useTreegeRenderer } from "@/renderer/features/TreegeRenderer/useTreegeRenderer";
import DefaultFormWrapper from "@/renderer/features/TreegeRenderer/web/components/DefaultFormWrapper";
import DefaultInputLabel from "@/renderer/features/TreegeRenderer/web/components/DefaultInputLabel";
import { defaultInputRenderers } from "@/renderer/features/TreegeRenderer/web/components/DefaultInputs";
import DefaultInputWrapper from "@/renderer/features/TreegeRenderer/web/components/DefaultInputWrapper";
import DefaultLoadingSkeleton from "@/renderer/features/TreegeRenderer/web/components/DefaultLoadingSkeleton";
import DefaultStep from "@/renderer/features/TreegeRenderer/web/components/DefaultStep";
import DefaultSubmitButton from "@/renderer/features/TreegeRenderer/web/components/DefaultSubmitButton";
import DefaultSubmitButtonWrapper from "@/renderer/features/TreegeRenderer/web/components/DefaultSubmitButtonWrapper";
import { defaultUI } from "@/renderer/features/TreegeRenderer/web/components/DefaultUI";
import RendererStyles from "@/renderer/features/TreegeRenderer/web/components/styles/RendererStyles";
import { useRenderNode } from "@/renderer/hooks/useRenderNode";
import { TreegeRendererProps } from "@/renderer/types/renderer";
import { PortalContainerProvider } from "@/shared/context/PortalContainerContext";
import { ThemeProvider } from "@/shared/context/ThemeContext";
import { cn } from "@/shared/lib/utils";

const TreegeRenderer = ({
  baseUrl,
  components,
  className,
  extraPayload,
  flow,
  formId,
  googleApiKey,
  headers,
  language,
  onBack,
  onChange,
  onSubmit,
  showPoweredBy,
  theme,
  title,
  validate,
  validationMode,
  initialValues = {},
  isLoading = false,
  isSubmitting: isSubmittingProp = false,
}: TreegeRendererProps) => {
  const {
    canContinue,
    canContinueStep,
    canGoBack,
    clearSubmitMessage,
    config,
    currentStep,
    currentStepGroupNode,
    currentStepIndex,
    firstErrorFieldId,
    formErrors,
    formTitle,
    formValues,
    goToNextStep,
    handleBack,
    handleContinue,
    handleSubmit,
    hasSubmitInput,
    inputNodes,
    isFinalStep,
    isFirstStep,
    isLastStep,
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

  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(null);

  const { FormWrapper, LoadingSkeleton, renderNode, StepComponent } = useRenderNode({
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

  /**
   * Web-specific form submission handler with focus logic.
   *
   * A native form submit can be triggered by a deported submit button (via the
   * `formId` prop) or by pressing Enter inside a field. In a multi-step flow we
   * must NOT submit until the final step: earlier steps advance instead — gated
   * by `canContinueStep` so an incomplete step can't be skipped, mirroring the
   * built-in Continue button.
   */
  const handleFormSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      // Not on the final step yet: advance instead of submitting. On a
      // boundary step (last visible step of an incomplete path) Enter must do
      // nothing — there is no next step to go to yet, and submitting would
      // send an incomplete flow.
      if (!isFinalStep) {
        if (!isLastStep && canContinueStep) {
          goToNextStep();
        }
        return;
      }

      // Final step: run the shared submit logic.
      const isValid = await handleSubmit();

      // If validation failed, focus the first input field with an error
      if (!isValid && firstErrorFieldId) {
        // Use id attribute for reliable focus (always present and unique)
        const input = document.getElementById(firstErrorFieldId);
        input?.focus();
      }
    },
    [isFinalStep, isLastStep, canContinueStep, goToNextStep, handleSubmit, firstErrorFieldId],
  );

  return (
    <div ref={setPortalContainer} className={cn("treege treege-renderer", className)}>
      <PortalContainerProvider container={portalContainer}>
        <RendererStyles />
        <ThemeProvider theme={config.theme} storageKey="treege-renderer-theme">
          {formTitle && <h2 className="tg:mx-auto tg:mb-4 tg:max-w-2xl tg:font-semibold tg:text-xl">{formTitle}</h2>}
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
              <FormWrapper id={formId} onSubmit={handleFormSubmit}>
                {currentStep && (
                  <StepComponent
                    step={currentStep}
                    groupNode={currentStepGroupNode}
                    stepIndex={currentStepIndex}
                    totalSteps={steps.length}
                    isFirstStep={isFirstStep}
                    isLastStep={isFinalStep}
                    canContinue={canContinue}
                    canGoBack={canGoBack}
                    hasSubmitInput={hasSubmitInput}
                    isSubmitting={isSubmitting}
                    onBack={handleBack}
                    onContinue={handleContinue}
                    label={stepLabel}
                    missingFields={missingRequiredFields}
                  >
                    {currentStep.nodes.map((node) => renderNode(node))}
                  </StepComponent>
                )}

                {/* Powered by Treege */}
                {config.showPoweredBy && <p className="tg:py-2 tg:text-right tg:text-muted-foreground tg:text-xs">Powered by Treege</p>}
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
            </TreegeRenderRuntimeProvider>
          )}
        </ThemeProvider>
      </PortalContainerProvider>
    </div>
  );
};

export default TreegeRenderer;
