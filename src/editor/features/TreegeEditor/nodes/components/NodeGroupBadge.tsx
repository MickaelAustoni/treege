import { useStore } from "@xyflow/react";
import { Boxes, ChevronDown } from "lucide-react";
import { MouseEvent, useState } from "react";
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
  const [open, setOpen] = useState(false);
  const t = useTranslate();
  // Subscribe to the two nodes this badge reads, not the whole list — every node
  // renders one badge, so a `useNodes()` here re-renders the entire canvas on any change.
  const currentNode = useStore((state) => state.nodeLookup.get(nodeId)?.internals.userNode as TreegeNode | undefined);
  const groupNode = useStore((state) =>
    groupId ? (state.nodeLookup.get(groupId)?.internals.userNode as TreegeNode | undefined) : undefined,
  );
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
      <PopoverContent align="start" className="tg:w-80" onClick={stopPropagation}>
        {currentNode && <SelectNodeGroup targetNodes={[currentNode]} onChange={() => setOpen(false)} />}
      </PopoverContent>
    </Popover>
  );
};

export default NodeGroupBadge;
