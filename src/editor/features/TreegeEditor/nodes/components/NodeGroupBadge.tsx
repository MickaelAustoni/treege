import { useNodes } from "@xyflow/react";
import { Boxes } from "lucide-react";
import { useMemo } from "react";
import useTranslate from "@/editor/hooks/useTranslate";
import { getGroupColor } from "@/editor/utils/groupColor";
import { Badge } from "@/shared/components/ui/badge";
import { TreegeNode } from "@/shared/types/node";
import { isGroupNode } from "@/shared/utils/nodeTypeGuards";

interface NodeGroupBadgeProps {
  groupId: string;
}

const NodeGroupBadge = ({ groupId }: NodeGroupBadgeProps) => {
  const t = useTranslate();
  const nodes = useNodes<TreegeNode>();
  const groupNode = useMemo(() => nodes.find((n) => n.id === groupId), [nodes, groupId]);
  const label = isGroupNode(groupNode) ? t(groupNode.data?.label) : "";
  const backgroundColor = getGroupColor(groupId);

  return (
    <Badge
      variant="default"
      className="tg:px-1.5 tg:py-0 tg:text-[10px] tg:text-white tg:capitalize tg:[&>svg]:size-2.5"
      style={{ backgroundColor }}
    >
      <Boxes className="tg:mt-0.5" />
      {label || groupId}
    </Badge>
  );
};

export default NodeGroupBadge;
