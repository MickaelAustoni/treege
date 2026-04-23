import { useReactFlow } from "@xyflow/react";
import { ChevronDown } from "lucide-react";
import { MouseEvent } from "react";
import { useTreegeEditorContext } from "@/editor/context/TreegeEditorContext";
import useFlowActions from "@/editor/hooks/useFlowActions";
import useTranslate from "@/editor/hooks/useTranslate";
import { getInputTypeIcon } from "@/editor/utils/inputTypeIcon";
import { Badge } from "@/shared/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { INPUT_TYPE } from "@/shared/constants/inputType";
import { NODE_TYPE } from "@/shared/constants/node";
import { UI_TYPE } from "@/shared/constants/uiType";
import { cn } from "@/shared/lib/utils";

interface NodeTypeBadgeProps {
  nodeId: string;
  nodeType: string;
  subType?: string;
}

const INPUT_TYPES = Object.values(INPUT_TYPE) as string[];
const UI_TYPES = Object.values(UI_TYPE) as string[];

const NodeTypeBadge = ({ nodeId, nodeType, subType }: NodeTypeBadgeProps) => {
  const { updateNodeType } = useFlowActions();
  const { getEdges } = useReactFlow();
  const { openNodeTypeChangeConfirmation } = useTreegeEditorContext();
  const t = useTranslate();
  const stopPropagation = (event: MouseEvent) => event.stopPropagation();
  const currentValue = subType || nodeType;
  const label = nodeType === NODE_TYPE.flow ? t("editor.selectNodeType.options.flow") : currentValue;
  const Icon = getInputTypeIcon(currentValue);
  const FlowIcon = getInputTypeIcon(NODE_TYPE.flow);

  const handleTypeChange = (type: string, nextSubType?: string) => {
    const outgoingCount = getEdges().filter((edge) => edge.source === nodeId).length;
    const needsConfirmation = (type === NODE_TYPE.ui || type === NODE_TYPE.flow) && outgoingCount > 1;

    if (needsConfirmation) {
      openNodeTypeChangeConfirmation({ nodeId, subType: nextSubType, type });
      return;
    }

    updateNodeType(nodeId, type, nextSubType);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={stopPropagation}>
        <Badge variant="default" className="nodrag nopan cursor-pointer px-1.5 py-0 text-[10px] capitalize [&>svg]:size-2.5">
          <Icon className="mt-0.5" />
          {label || t("editor.selectNodeType.nodeType")}
          <ChevronDown />
        </Badge>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="treege-scrollbar max-h-80" onClick={stopPropagation}>
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t("editor.selectNodeType.options.input")}</DropdownMenuLabel>
          {INPUT_TYPES.map((type) => {
            const OptionIcon = getInputTypeIcon(type);

            return (
              <DropdownMenuItem
                key={type}
                onClick={() => handleTypeChange(NODE_TYPE.input, type)}
                className={cn("capitalize", nodeType === NODE_TYPE.input && type === subType && "bg-accent")}
              >
                <OptionIcon />
                {type}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t("editor.selectNodeType.options.ui")}</DropdownMenuLabel>
          {UI_TYPES.map((type) => {
            const OptionIcon = getInputTypeIcon(type);

            return (
              <DropdownMenuItem
                key={type}
                onClick={() => handleTypeChange(NODE_TYPE.ui, type)}
                className={cn("capitalize", nodeType === NODE_TYPE.ui && type === subType && "bg-accent")}
              >
                <OptionIcon />
                {type}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t("common.other")}</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => handleTypeChange(NODE_TYPE.flow)} className={cn(nodeType === NODE_TYPE.flow && "bg-accent")}>
            <FlowIcon />
            {t("editor.selectNodeType.options.flow")}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NodeTypeBadge;
