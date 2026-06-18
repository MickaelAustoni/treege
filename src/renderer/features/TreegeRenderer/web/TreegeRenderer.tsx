import { FormEvent, useCallback, useMemo, useState } from "react";
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
  validate,
  validationMode,
  initialValues = {},
  isLoading = false,
  isSubmitting: isSubmittingProp = false,
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
    hasSubmitInput,
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

  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(null);
  const isSubmitting = isSubmittingProp || isSubmittingInternal;

  const { FormWrapper, renderNode } = useRenderNode({
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

  /**
   * Web-specific form submission handler with focus logic.
   *
   * A native form submit can be triggered by a deported submit button (via the
   * `formId` prop) or by pressing Enter inside a field. In a multi-step flow we
   * must NOT submit until the last step: earlier steps advance instead — gated
   * by `canContinueStep` so an incomplete step can't be skipped, mirroring the
   * built-in Continue button.
   */
  const handleFormSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      // Not on the last step yet: advance instead of submitting.
      if (!isLastStep) {
        if (canContinueStep) {
          goToNextStep();
        }
        return;
      }

      // Last step: run the shared submit logic.
      const isValid = await handleSubmit();

      // If validation failed, focus the first input field with an error
      if (!isValid && firstErrorFieldId) {
        // Use id attribute for reliable focus (always present and unique)
        const input = document.getElementById(firstErrorFieldId);
        input?.focus();
      }
    },
    [isLastStep, canContinueStep, goToNextStep, handleSubmit, firstErrorFieldId],
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
    <div ref={setPortalContainer} className={cn("treege treege-renderer", className)}>
      <PortalContainerProvider container={portalContainer}>
        <RendererStyles />
        <ThemeProvider theme={config.theme} storageKey="treege-renderer-theme">
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
                    isLastStep={isLastStep}
                    canContinue={canContinueStep && (!isLastStep || canSubmit)}
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
