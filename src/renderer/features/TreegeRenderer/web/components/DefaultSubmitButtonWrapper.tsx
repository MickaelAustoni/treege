import { ReactNode } from "react";
import { useTranslate } from "@/renderer/hooks/useTranslate";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/components/ui/tooltip";

export interface SubmitButtonWrapperProps {
  children: ReactNode;
  missingFields?: string[];
}

/**
 * Default submit button wrapper with tooltip for missing fields
 */
const DefaultSubmitButtonWrapper = ({ children, missingFields = [] }: SubmitButtonWrapperProps) => {
  const hasTooltip = missingFields.length > 0;
  const t = useTranslate();

  if (!hasTooltip) {
    return children;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent>
          <div className="tg:space-y-1">
            <p className="tg:font-semibold">{t("renderer.defaultSubmitButton.requiredFieldsMissing")}:</p>
            <ul className="tg:list-inside tg:list-disc">
              {missingFields.map((field, index) => (
                <li key={index}>{field}</li>
              ))}
            </ul>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default DefaultSubmitButtonWrapper;
