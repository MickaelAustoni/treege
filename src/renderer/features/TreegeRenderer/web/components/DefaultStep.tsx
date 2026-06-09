import { useTreegeRendererConfig } from "@/renderer";
import DefaultSubmitButton from "@/renderer/features/TreegeRenderer/web/components/DefaultSubmitButton";
import DefaultSubmitButtonWrapper from "@/renderer/features/TreegeRenderer/web/components/DefaultSubmitButtonWrapper";
import { useTranslate } from "@/renderer/hooks/useTranslate";
import type { StepRenderProps } from "@/renderer/types/renderer";
import { isInputNode } from "@/shared/utils/nodeTypeGuards";

const DefaultStep = ({
  step,
  label,
  children,
  canGoBack,
  isLastStep,
  canContinue,
  isSubmitting,
  onBack,
  onContinue,
  missingFields,
}: StepRenderProps) => {
  const t = useTranslate();
  const config = useTreegeRendererConfig();
  const SubmitButton = config?.components?.submitButton || DefaultSubmitButton;
  const SubmitButtonWrapper = config?.components?.submitButtonWrapper || DefaultSubmitButtonWrapper;
  const continueDisabled = !canContinue || isSubmitting;
  const submitNode = step.nodes.find((node) => isInputNode(node) && node.data.type === "submit");
  const submitLabel = submitNode && isInputNode(submitNode) ? t(submitNode.data.label) : undefined;
  const actionLabel = isLastStep ? submitLabel || t("renderer.defaultSubmitButton.submit") : t("renderer.step.continue");

  const continueButton = (
    <SubmitButton type="button" onClick={onContinue} disabled={continueDisabled} isSubmitting={isSubmitting} label={actionLabel} />
  );

  return (
    <section className="tg:rounded-lg tg:border tg:p-4">
      {label && <h3 className="tg:mb-4 tg:font-semibold tg:text-lg">{label}</h3>}

      {children}

      <div className="tg:mt-6 tg:flex tg:items-center tg:justify-between tg:gap-2">
        {canGoBack ? (
          <button
            type="button"
            onClick={onBack}
            disabled={isSubmitting}
            className="tg:rounded-md tg:border tg:border-input tg:bg-background tg:px-4 tg:py-2 tg:font-medium tg:text-sm tg:transition-colors tg:hover:bg-accent tg:disabled:cursor-not-allowed tg:disabled:opacity-50"
          >
            {t("renderer.step.back")}
          </button>
        ) : (
          <span />
        )}

        {/* Only the submit button is wrapped — the tooltip explaining missing
            required fields must not enclose the inputs, otherwise toggling its
            presence remounts the step and steals input focus. */}
        <SubmitButtonWrapper missingFields={missingFields}>{continueButton}</SubmitButtonWrapper>
      </div>
    </section>
  );
};

export default DefaultStep;
