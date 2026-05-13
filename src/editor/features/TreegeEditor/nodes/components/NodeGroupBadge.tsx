import { useNodes } from "@xyflow/react";
import { Boxes, ChevronDown } from "lucide-react";
import { MouseEvent, useMemo, useState } from "react";
import SelectNodeGroup from "@/editor/features/TreegeEditor/inputs/SelectNodeGroup";
import useTranslate from "@/editor/hooks/useTranslate";
import { getGroupColor } from "@/editor/utils/groupColor";
import { Badge } from "@/shared/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";
import { TreegeNode } from "@/shared/types/node";
import { isGroupNode } from "@/shared/utils/nodeTypeGuards";

interface NodeGroupBadgeProps {
  nodeId: string;
  groupId?: string;
}

const NodeGroupBadge = ({ nodeId, groupId }: NodeGroupBadgeProps) => {
  const t = useTranslate();
  const nodes = useNodes<TreegeNode>();
  const [open, setOpen] = useState(false);
  const currentNode = useMemo(() => nodes.find((n) => n.id === nodeId), [nodes, nodeId]);
  const groupNode = useMemo(() => (groupId ? nodes.find((n) => n.id === groupId) : undefined), [nodes, groupId]);
  const label = isGroupNode(groupNode) ? t(groupNode.data?.label) : "";
  const backgroundColor = getGroupColor(groupId);

  const stopPropagation = (event: MouseEvent) => event.stopPropagation();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild onClick={stopPropagation}>
        {groupId ? (
          <Badge
            variant="default"
            className="nodrag nopan tg:cursor-pointer tg:px-1.5 tg:py-0 tg:text-[10px] tg:text-white tg:capitalize tg:[&>svg]:size-2.5"
            style={{ backgroundColor }}
            title={label || groupId}
          >
            <Boxes />
            <ChevronDown />
          </Badge>
        ) : (
          <Badge
            variant="secondary"
            className="nodrag nopan tg:cursor-pointer tg:px-1.5 tg:py-0 tg:[&>svg]:size-2.5"
            title={t("editor.selectNodeGroup.group")}
          >
            <Boxes />
            <ChevronDown />
          </Badge>
        )}
      </PopoverTrigger>
      <PopoverContent align="start" className="tg:w-80" onClick={stopPropagation} disablePortal>
        {currentNode && <SelectNodeGroup targetNodes={[currentNode]} onChange={() => setOpen(false)} />}
      </PopoverContent>
    </Popover>
  );
};

export default NodeGroupBadge;
