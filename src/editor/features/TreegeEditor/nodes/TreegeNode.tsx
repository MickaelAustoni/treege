import { Handle, Node, NodeProps, Position } from "@xyflow/react";
import { Plus } from "lucide-react";
import { memo } from "react";
import NodeLabelInput from "@/editor/features/TreegeEditor/nodes/components/NodeLabelInput";
import NodeTypeBadge from "@/editor/features/TreegeEditor/nodes/components/NodeTypeBadge";
import OpenSheetButton from "@/editor/features/TreegeEditor/nodes/components/OpenSheetButton";
import SubTypeBadge from "@/editor/features/TreegeEditor/nodes/components/SubTypeBadge";
import useBottomHandleClick from "@/editor/features/TreegeEditor/nodes/hooks/useBottomHandleClick";
import NodeWrapper from "@/editor/features/TreegeEditor/nodes/layout/NodeWrapper";
import { cn } from "@/shared/lib/utils";
import { FlowNodeData, InputNodeData, UINodeData } from "@/shared/types/node";

export type TreegeNodeType = Node<FlowNodeData, "flow"> | Node<InputNodeData, "input"> | Node<UINodeData, "ui">;
export type TreegeNodeProps = NodeProps<TreegeNodeType>;

const TreegeNode = ({ data, isConnectable, parentId, type, id }: TreegeNodeProps) => {
  const handleBottomHandleClick = useBottomHandleClick(id);
  const subType = type === "input" || type === "ui" ? (data as InputNodeData | UINodeData)?.type : undefined;
  const isSubmit = type === "input" && (data as InputNodeData)?.type === "submit";
  const placeholder = type === "input" ? (data as InputNodeData)?.name : undefined;

  console.log(data);

  return (
    <NodeWrapper inGroup={!!parentId} isSubmit={isSubmit}>
      {/* Edit button */}
      <OpenSheetButton nodeId={id} />

      {/* Top handle */}
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} isConnectableStart={type === "ui"} />

      {/* Types */}
      <div className="mb-1 flex gap-1">
        <NodeTypeBadge nodeId={id} type={type} />
        {(type === "input" || type === "ui") && <SubTypeBadge nodeId={id} type={type} subType={subType} />}
      </div>

      {/* Label */}
      <NodeLabelInput nodeId={id} label={data?.label} placeholder={placeholder} className={cn("py-1", type === "ui" && "capitalize")} />

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
