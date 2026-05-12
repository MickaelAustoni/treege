import { useNodes, useReactFlow } from "@xyflow/react";
import { Boxes, ChevronDown } from "lucide-react";
import { MouseEvent, useMemo } from "react";
import useTranslate from "@/editor/hooks/useTranslate";
import { getGroupColor } from "@/editor/utils/groupColor";
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
import { cn } from "@/shared/lib/utils";
import { TreegeNode } from "@/shared/types/node";
import { isGroupNode } from "@/shared/utils/nodeTypeGuards";

interface NodeGroupBadgeProps {
  nodeId: string;
  groupId?: string;
}

const MAX_LABEL_LENGTH = 10;

const truncate = (value: string): string => (value.length > MAX_LABEL_LENGTH ? `${value.slice(0, MAX_LABEL_LENGTH)}…` : value);

const NodeGroupBadge = ({ nodeId, groupId }: NodeGroupBadgeProps) => {
  const { setNodes } = useReactFlow();
  const t = useTranslate();
  const nodes = useNodes<TreegeNode>();
  const groupNodes = useMemo(() => nodes.filter(isGroupNode), [nodes]);
  const groupNode = useMemo(() => (groupId ? nodes.find((n) => n.id === groupId) : undefined), [nodes, groupId]);
  const label = isGroupNode(groupNode) ? t(groupNode.data?.label) : "";
  const backgroundColor = getGroupColor(groupId);
  const stopPropagation = (event: MouseEvent) => event.stopPropagation();

  if (!groupId) {
    return null;
  }

  const handleGroupChange = (nextGroupId: string | null) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id !== nodeId) {
          return node;
        }
        if (nextGroupId === null) {
          const { parentId: _parentId, extent, ...rest } = node;
          return rest;
        }
        const { extent, ...rest } = node;
        return { ...rest, parentId: nextGroupId };
      }),
    );
  };

  const displayLabel = truncate(label || groupId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={stopPropagation}>
        <Badge
          variant="default"
          className="nodrag nopan tg:cursor-pointer tg:px-1.5 tg:py-0 tg:text-[10px] tg:text-white tg:capitalize tg:[&>svg]:size-2.5"
          style={{ backgroundColor }}
          title={label || groupId}
        >
          <Boxes className="tg:mt-0.5" />
          {displayLabel}
          <ChevronDown />
        </Badge>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" onClick={stopPropagation}>
        <DropdownMenuLabel>{t("editor.selectNodeGroup.group")}</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => handleGroupChange(null)}>{t("editor.selectNodeGroup.noGroup")}</DropdownMenuItem>
        </DropdownMenuGroup>
        {groupNodes.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {groupNodes.map((node) => {
                const groupLabel = t(node.data?.label) || node.id;
                return (
                  <DropdownMenuItem
                    key={node.id}
                    onClick={() => handleGroupChange(node.id)}
                    className={cn(node.id === groupId && "tg:bg-accent")}
                  >
                    {groupLabel}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuGroup>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NodeGroupBadge;
