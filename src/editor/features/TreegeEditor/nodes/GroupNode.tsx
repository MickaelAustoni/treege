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
    <div className="tg:-top-3.5 tg:absolute tg:left-6">
      <Badge className="tg:max-w-50 tg:bg-chart-2">
        <Boxes className="tg:!w-3 tg:!h-3" />
        <NodeLabelInput
          nodeId={id}
          label={data?.label}
          className="tg:min-w-0 tg:flex-1 tg:text-xs tg:text-white tg:placeholder:text-white/60"
        />
      </Badge>
    </div>
    <NodeMoreMenu nodeId={id} />
  </>
);

export default memo(GroupNode);
