import { Handle, Node, NodeProps, Position } from "@xyflow/react";
import { Plus, Type } from "lucide-react";
import { memo } from "react";
import NodeLabelInput from "@/editor/features/TreegeEditor/nodes/components/NodeLabelInput";
import NodeTypeBadge from "@/editor/features/TreegeEditor/nodes/components/NodeTypeBadge";
import OpenSheetButton from "@/editor/features/TreegeEditor/nodes/components/OpenSheetButton";
import useBottomHandleClick from "@/editor/features/TreegeEditor/nodes/hooks/useBottomHandleClick";
import NodeWrapper from "@/editor/features/TreegeEditor/nodes/layout/NodeWrapper";
import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/lib/utils";
import { FlowNodeData, InputNodeData, UINodeData } from "@/shared/types/node";

export type TreegeNodeType = Node<FlowNodeData, "flow"> | Node<InputNodeData, "input"> | Node<UINodeData, "ui">;
export type TreegeNodeProps = NodeProps<TreegeNodeType>;

const TreegeNode = ({ data, isConnectable, parentId, type, id }: TreegeNodeProps) => {
  const handleBottomHandleClick = useBottomHandleClick(id);

  const subType = type === "input" || type === "ui" ? (data as InputNodeData | UINodeData)?.type : undefined;
  const isSubmit = type === "input" && (data as InputNodeData)?.type === "submit";
  const placeholder = type === "input" ? (data as InputNodeData)?.name : undefined;

  return (
    <NodeWrapper inGroup={!!parentId} isSubmit={isSubmit}>
      {/* Edit button */}
      <OpenSheetButton nodeId={id} />

      {/* Top handle */}
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} isConnectableStart={type === "ui"} />

      {/* Types */}
      <div className="mb-1 flex gap-1">
        <NodeTypeBadge nodeId={id} type={type} />
        {subType && (
          <Badge variant="outline" className="px-1.5 py-0 text-[10px] capitalize [&>svg]:size-2.5">
            <Type />
            {subType}
          </Badge>
        )}
      </div>

      {/* Label */}
      <NodeLabelInput
        nodeId={id}
        label={data?.label}
        placeholder={placeholder}
        className={cn("treege-node-input rounded-md px-2 py-1 text-lg", type === "ui" && "capitalize")}
      />

      {/* Bottom handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        onClick={handleBottomHandleClick}
        className="flex h-6! w-6! cursor-pointer items-center justify-center rounded-sm transition-colors hover:bg-primary/80!"
      >
        <Plus className="h-4 w-4 text-primary-foreground" />
      </Handle>
    </NodeWrapper>
  );
};

export default memo(TreegeNode);
