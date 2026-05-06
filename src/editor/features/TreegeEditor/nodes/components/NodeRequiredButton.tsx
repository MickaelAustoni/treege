import { Asterisk } from "lucide-react";
import { MouseEvent } from "react";
import useFlowActions from "@/editor/hooks/useFlowActions";
import useTranslate from "@/editor/hooks/useTranslate";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/components/ui/tooltip";
import { cn } from "@/shared/lib/utils";

interface NodeRequiredButtonProps {
  nodeId: string;
  required?: boolean;
}

const NodeRequiredButton = ({ nodeId, required }: NodeRequiredButtonProps) => {
  const { updateNodeData } = useFlowActions();
  const t = useTranslate();

  const handleClick = (event: MouseEvent) => {
    event.stopPropagation();
    updateNodeData(nodeId, { required: !required });
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={handleClick}
            className={cn(
              "nodrag nopan tg:flex tg:size-6 tg:cursor-pointer tg:items-center tg:justify-center tg:rounded-md tg:transition-all tg:hover:opacity-100",
              required ? "tg:text-destructive tg:opacity-100" : "tg:opacity-60",
            )}
          >
            <Asterisk className="tg:h-3.5 tg:w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">{required ? t("editor.inputNodeForm.required") : t("editor.inputNodeForm.optional")}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default NodeRequiredButton;
