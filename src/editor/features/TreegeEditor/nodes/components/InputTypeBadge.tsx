import { ChevronDown } from "lucide-react";
import { MouseEvent } from "react";
import useFlowActions from "@/editor/hooks/useFlowActions";
import useTranslate from "@/editor/hooks/useTranslate";
import { getInputTypeIcon } from "@/editor/utils/inputTypeIcon";
import { Badge } from "@/shared/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/shared/components/ui/dropdown-menu";
import { INPUT_TYPE } from "@/shared/constants/inputType";
import { UI_TYPE } from "@/shared/constants/uiType";
import { cn } from "@/shared/lib/utils";

interface InputTypeBadgeProps {
  nodeId: string;
  type: "input" | "ui";
  inputType?: string;
}

const INPUT_TYPE_OPTIONS: Record<InputTypeBadgeProps["type"], readonly string[]> = {
  input: Object.values(INPUT_TYPE),
  ui: Object.values(UI_TYPE),
};

const InputTypeBadge = ({ nodeId, type, inputType }: InputTypeBadgeProps) => {
  const { updateNodeData } = useFlowActions();
  const t = useTranslate();
  const options = INPUT_TYPE_OPTIONS[type];
  const stopPropagation = (event: MouseEvent) => event.stopPropagation();
  const Icon = getInputTypeIcon(inputType);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={stopPropagation}>
        <Badge variant="default" className="nodrag nopan cursor-pointer px-1.5 py-0 text-[10px] capitalize [&>svg]:size-2.5">
          <Icon className="mt-0.5" />
          {inputType || t("editor.selectInputType.type")}
          <ChevronDown />
        </Badge>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="treege-scrollbar max-h-60" onClick={stopPropagation}>
        {options.map((option) => {
          const OptionIcon = getInputTypeIcon(option);

          return (
            <DropdownMenuItem
              key={option}
              onClick={() => updateNodeData(nodeId, { type: option })}
              className={cn("capitalize", option === inputType && "bg-accent")}
            >
              <OptionIcon />
              {option}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default InputTypeBadge;
