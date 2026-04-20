import { RectangleEllipsis } from "lucide-react";
import { MouseEvent } from "react";
import useFlowActions from "@/editor/hooks/useFlowActions";
import useTranslate from "@/editor/hooks/useTranslate";
import { Badge } from "@/shared/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/shared/components/ui/dropdown-menu";
import { INPUT_TYPE } from "@/shared/constants/inputType";
import { UI_TYPE } from "@/shared/constants/uiType";
import { cn } from "@/shared/lib/utils";

type SubTypeOwnerType = "input" | "ui";

interface SubTypeBadgeProps {
  nodeId: string;
  type: SubTypeOwnerType;
  subType?: string;
}

const SUB_TYPE_OPTIONS: Record<SubTypeOwnerType, readonly string[]> = {
  input: Object.values(INPUT_TYPE),
  ui: Object.values(UI_TYPE),
};

const SubTypeBadge = ({ nodeId, type, subType }: SubTypeBadgeProps) => {
  const { updateNodeData } = useFlowActions();
  const t = useTranslate();
  const options = SUB_TYPE_OPTIONS[type];
  const stopPropagation = (event: MouseEvent) => event.stopPropagation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={stopPropagation}>
        <Badge variant="default" className="nodrag nopan cursor-pointer px-1.5 py-0 text-[10px] capitalize [&>svg]:size-2.5">
          <RectangleEllipsis />
          {subType || t("editor.selectInputType.type")}
        </Badge>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="treege-scrollbar max-h-60" onClick={stopPropagation}>
        {options.map((option) => (
          <DropdownMenuItem
            key={option}
            onClick={() => updateNodeData(nodeId, { type: option })}
            className={cn("capitalize", option === subType && "bg-accent")}
          >
            {option}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SubTypeBadge;
