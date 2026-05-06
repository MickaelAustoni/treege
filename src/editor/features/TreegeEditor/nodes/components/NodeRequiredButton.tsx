import { Asterisk } from "lucide-react";
import { MouseEvent } from "react";
import useFlowActions from "@/editor/hooks/useFlowActions";
import useTranslate from "@/editor/hooks/useTranslate";
import { Button } from "@/shared/components/ui/button";
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
          <Button
            type="button"
            variant="icon"
            size="icon-sm"
            onClick={handleClick}
            className={cn("nodrag nopan tg:size-6", required && "tg:text-destructive tg:opacity-100!")}
          >
            <Asterisk />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">{required ? t("editor.inputNodeForm.required") : t("editor.inputNodeForm.optional")}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default NodeRequiredButton;
