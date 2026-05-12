import { useNodes } from "@xyflow/react";
import { Boxes } from "lucide-react";
import { useMemo } from "react";
import useTranslate from "@/editor/hooks/useTranslate";
import { getGroupColor } from "@/editor/utils/groupColor";
import { Badge } from "@/shared/components/ui/badge";
import { TreegeNode } from "@/shared/types/node";
import { isGroupNode } from "@/shared/utils/nodeTypeGuards";

interface NodeGroupBadgeProps {
  groupId?: string;
}

const MAX_LABEL_LENGTH = 10;

const truncate = (value: string): string => (value.length > MAX_LABEL_LENGTH ? `${value.slice(0, MAX_LABEL_LENGTH)}…` : value);

const NodeGroupBadge = ({ groupId }: NodeGroupBadgeProps) => {
  const t = useTranslate();
  const nodes = useNodes<TreegeNode>();
  const groupNode = useMemo(() => (groupId ? nodes.find((n) => n.id === groupId) : undefined), [nodes, groupId]);
  const label = isGroupNode(groupNode) ? t(groupNode.data?.label) : "";
  const backgroundColor = getGroupColor(groupId);

  if (!groupId) {
    return null;
  }

  const displayLabel = truncate(label || groupId);

  return (
    <Badge
      variant="default"
      className="tg:px-1.5 tg:py-0 tg:text-[10px] tg:text-white tg:capitalize tg:[&>svg]:size-2.5"
      style={{ backgroundColor }}
      title={label || groupId}
    >
      <Boxes className="tg:mt-0.5" />
      {displayLabel}
    </Badge>
  );
};

export default NodeGroupBadge;
