import DefaultSubmitButtonWrapper from "@/renderer/features/TreegeRenderer/web/components/DefaultSubmitButtonWrapper";
import { useTranslate } from "@/renderer/hooks/useTranslate";
import type { StepRenderProps } from "@/renderer/types/renderer";

const DefaultStep = ({
  label,
  children,
  isFirstStep,
  isLastStep,
  canContinue,
  isSubmitting,
  onBack,
  onContinue,
  missingFields,
}: StepRenderProps) => {
  const t = useTranslate();
  const continueDisabled = !canContinue || isSubmitting;

  const continueButton = (
    <button
      type="button"
      onClick={onContinue}
      disabled={continueDisabled}
      className="tg:rounded-md tg:bg-blue-500 tg:px-4 tg:py-2 tg:font-medium tg:text-sm tg:text-white tg:transition-colors tg:hover:bg-blue-600 tg:focus:outline-none tg:focus:ring-2 tg:focus:ring-blue-500 tg:focus:ring-offset-2 tg:disabled:cursor-not-allowed tg:disabled:opacity-50"
    >
      {isLastStep ? t("renderer.defaultSubmitButton.submit") : t("renderer.step.continue")}
    </button>
  );

  return (
    <section className="tg:rounded-lg tg:border tg:p-4">
      {label && <h3 className="tg:mb-4 tg:font-semibold tg:text-lg">{label}</h3>}

      {children}

      <div className="tg:mt-6 tg:flex tg:items-center tg:justify-between tg:gap-2">
        {isFirstStep ? (
          <span />
        ) : (
          <button
            type="button"
            onClick={onBack}
            disabled={isSubmitting}
            className="tg:rounded-md tg:border tg:border-input tg:bg-background tg:px-4 tg:py-2 tg:font-medium tg:text-sm tg:transition-colors tg:hover:bg-accent tg:disabled:cursor-not-allowed tg:disabled:opacity-50"
          >
            {t("renderer.step.back")}
          </button>
        )}

        {/* Only the submit button is wrapped — the tooltip explaining missing
            required fields must not enclose the inputs, otherwise toggling its
            presence remounts the step and steals input focus. */}
        <DefaultSubmitButtonWrapper missingFields={missingFields}>{continueButton}</DefaultSubmitButtonWrapper>
      </div>
    </section>
  );
};

export default DefaultStep;
