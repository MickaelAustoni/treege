import { Boxes, ChevronDown, LucidePencilRuler, MessageCircleQuestion, Network } from "lucide-react";
import { ComponentType, MouseEvent } from "react";
import { NODE_TYPES } from "@/editor/constants/nodeTypes";
import useFlowActions from "@/editor/hooks/useFlowActions";
import useTranslate from "@/editor/hooks/useTranslate";
import { Badge } from "@/shared/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/shared/components/ui/dropdown-menu";
import { NODE_TYPE } from "@/shared/constants/node";

type NodeTypeKey = keyof typeof NODE_TYPES;

const NODE_TYPE_ICONS: Record<NodeTypeKey, ComponentType> = {
  [NODE_TYPE.flow]: Network,
  [NODE_TYPE.group]: Boxes,
  [NODE_TYPE.input]: MessageCircleQuestion,
  [NODE_TYPE.ui]: LucidePencilRuler,
};

const NODE_TYPE_BADGE_VARIANTS: Record<NodeTypeKey, "blue" | "destructive" | "purple" | "default"> = {
  [NODE_TYPE.flow]: "destructive",
  [NODE_TYPE.group]: "default",
  [NODE_TYPE.input]: "blue",
  [NODE_TYPE.ui]: "purple",
};

interface NodeTypeBadgeProps {
  nodeId: string;
  type: NodeTypeKey;
}

const NodeTypeBadge = ({ nodeId, type }: NodeTypeBadgeProps) => {
  const { updateNodeType } = useFlowActions();
  const t = useTranslate();
  const Icon = NODE_TYPE_ICONS[type];
  const availableTypes = (Object.keys(NODE_TYPES) as NodeTypeKey[]).filter((nodeType) => nodeType !== NODE_TYPE.group);
  const stopPropagation = (event: MouseEvent) => event.stopPropagation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={stopPropagation}>
        <Badge
          variant={NODE_TYPE_BADGE_VARIANTS[type]}
          className="nodrag nopan cursor-pointer px-1.5 py-0 text-[10px] capitalize [&>svg]:size-2.5"
        >
          <Icon />
          {t(`editor.selectNodeType.options.${type}`)}
          <ChevronDown />
        </Badge>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" onClick={stopPropagation}>
        {availableTypes.map((nodeType) => {
          const ItemIcon = NODE_TYPE_ICONS[nodeType];
          return (
            <DropdownMenuItem
              key={nodeType}
              onClick={() => updateNodeType(nodeId, nodeType)}
              className={nodeType === type ? "bg-accent" : undefined}
            >
              <ItemIcon />
              {t(`editor.selectNodeType.options.${nodeType}`)}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NodeTypeBadge;
