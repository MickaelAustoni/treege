import { ReactNode } from "react";
import { MissingDependency } from "@/renderer/hooks/useMissingDependencies";
import { useTranslate } from "@/renderer/hooks/useTranslate";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/components/ui/tooltip";

interface MissingProps {
  /** Unfilled fields the input depends on (from `useMissingDependencies`). */
  missing: MissingDependency[];
}

/**
 * Title + bulleted list of the fields the user must fill first.
 * @param param0
 * @param param0.missing
 * @constructor
 */
const HintList = ({ missing }: MissingProps) => {
  const t = useTranslate();

  return (
    <>
      <p className="tg:font-medium">{t("renderer.dependencyHint.title")}</p>
      <ul className="tg:mt-1 tg:list-disc tg:pl-4">
        {missing.map((dependency) => (
          <li key={dependency.id}>{dependency.label}</li>
        ))}
      </ul>
    </>
  );
};

/**
 * Wraps a disabled input control with a tooltip listing the fields the user
 * must fill before the input's dynamic options can load. Renders children
 * untouched when there are no missing dependencies, so it's safe to wrap any
 * trigger-based dynamic input (select, autocomplete, http) unconditionally.
 */
const DependencyHint = ({ missing, children }: MissingProps & { children: ReactNode }) => {
  if (missing.length === 0) {
    return <>{children}</>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="tg:w-full">{children}</div>
        </TooltipTrigger>
        <TooltipContent>
          <HintList missing={missing} />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

/**
 * Inline variant for inputs that have no single trigger to hover (radio,
 * checkbox): renders the same hint as always-visible muted text. Renders
 * nothing when there are no missing dependencies.
 */
export const DependencyHintMessage = ({ missing }: MissingProps) => {
  if (missing.length === 0) {
    return null;
  }

  return (
    <div className="tg:text-muted-foreground tg:text-sm">
      <HintList missing={missing} />
    </div>
  );
};

export default DependencyHint;
