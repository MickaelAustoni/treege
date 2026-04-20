import { Node, NodeProps, NodeResizer } from "@xyflow/react";
import { Boxes } from "lucide-react";
import { memo } from "react";
import NodeLabelInput from "@/editor/features/TreegeEditor/nodes/components/NodeLabelInput";
import NodeMoreMenu from "@/editor/features/TreegeEditor/nodes/components/NodeMoreMenu";
import { Badge } from "@/shared/components/ui/badge";
import { GroupNodeData } from "@/shared/types/node";

export type GroupNodeType = Node<GroupNodeData, "group">;
export type GroupNodeProps = NodeProps<GroupNodeType>;

const GroupNode = ({ data, id }: GroupNodeProps) => (
  <>
    <NodeResizer />
    <div className="-top-3.5 absolute left-6">
      <Badge className="max-w-50 bg-chart-2">
        <Boxes className="!w-3 !h-3" />
        <NodeLabelInput nodeId={id} label={data?.label} className="min-w-0 flex-1 text-xs text-white placeholder:text-white/60" />
      </Badge>
    </div>
    <NodeMoreMenu nodeId={id} />
  </>
);

export default memo(GroupNode);
