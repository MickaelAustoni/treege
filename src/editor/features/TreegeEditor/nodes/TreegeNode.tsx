import { Handle, Node, NodeProps, Position } from "@xyflow/react";
import { memo } from "react";
import BottomHandleDropdown from "@/editor/features/TreegeEditor/nodes/components/BottomHandleDropdown";
import NodeLabelInput from "@/editor/features/TreegeEditor/nodes/components/NodeLabelInput";
import NodeTypeBadge from "@/editor/features/TreegeEditor/nodes/components/NodeTypeBadge";
import OpenSheetButton from "@/editor/features/TreegeEditor/nodes/components/OpenSheetButton";
import SubTypeBadge from "@/editor/features/TreegeEditor/nodes/components/SubTypeBadge";
import NodeWrapper from "@/editor/features/TreegeEditor/nodes/layout/NodeWrapper";
import { cn } from "@/shared/lib/utils";
import { FlowNodeData, InputNodeData, UINodeData } from "@/shared/types/node";

export type TreegeNodeType = Node<FlowNodeData, "flow"> | Node<InputNodeData, "input"> | Node<UINodeData, "ui">;
export type TreegeNodeProps = NodeProps<TreegeNodeType>;

const TreegeNode = ({ data, isConnectable, parentId, type, id }: TreegeNodeProps) => {
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
        {(type === "input" || type === "ui") && <SubTypeBadge nodeId={id} type={type} subType={subType} />}
      </div>

      {/* Label */}
      <NodeLabelInput nodeId={id} label={data?.label} placeholder={placeholder} className={cn("py-1", type === "ui" && "capitalize")} />

      {/* Bottom handle */}
      <BottomHandleDropdown nodeId={id} isConnectable={isConnectable} />
    </NodeWrapper>
  );
};

export default memo(TreegeNode);
