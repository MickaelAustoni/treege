import { Handle, Node, NodeProps, Position } from "@xyflow/react";
import { memo } from "react";
import BottomHandleDropdown from "@/editor/features/TreegeEditor/nodes/components/BottomHandleDropdown";
import NodeGroupBadge from "@/editor/features/TreegeEditor/nodes/components/NodeGroupBadge";
import NodeImage from "@/editor/features/TreegeEditor/nodes/components/NodeImage";
import NodeImageButton from "@/editor/features/TreegeEditor/nodes/components/NodeImageButton";
import NodeInputPreview from "@/editor/features/TreegeEditor/nodes/components/NodeInputPreview";
import NodeLabelInput from "@/editor/features/TreegeEditor/nodes/components/NodeLabelInput";
import NodeMoreMenu from "@/editor/features/TreegeEditor/nodes/components/NodeMoreMenu";
import NodeOptions from "@/editor/features/TreegeEditor/nodes/components/NodeOptions";
import NodeRequiredButton from "@/editor/features/TreegeEditor/nodes/components/NodeRequiredButton";
import NodeTypeBadge from "@/editor/features/TreegeEditor/nodes/components/NodeTypeBadge";
import NodeWrapper from "@/editor/features/TreegeEditor/nodes/layout/NodeWrapper";
import { cn } from "@/shared/lib/utils";
import { FlowNodeData, InputNodeData, UINodeData } from "@/shared/types/node";

export type TreegeNodeProps =
  | NodeProps<Node<FlowNodeData, "flow">>
  | NodeProps<Node<InputNodeData, "input">>
  | NodeProps<Node<UINodeData, "ui">>;

const TreegeNode = (props: TreegeNodeProps) => {
  const { id, isConnectable, parentId, selected, type } = props;
  const inputData = props.type === "input" ? props.data : undefined;
  const uiData = props.type === "ui" ? props.data : undefined;
  const subType = inputData?.type ?? uiData?.type;
  const isSubmit = inputData?.type === "submit";
  const showPreview = !selected && !!inputData?.type;

  return (
    <NodeWrapper isSubmit={isSubmit}>
      {/* Node actions */}
      <div className="tg:absolute tg:top-2 tg:right-2 tg:flex tg:items-center tg:gap-0.5">
        {selected && inputData && !isSubmit && (
          <>
            <NodeRequiredButton nodeId={id} required={inputData.required} />
            <NodeImageButton nodeId={id} image={inputData.image} />
          </>
        )}
        <NodeMoreMenu nodeId={id} />
      </div>

      {/* Top handle */}
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} isConnectableStart={type === "ui"} />

      {/* Illustrative image */}
      <NodeImage image={inputData?.image} />

      {showPreview && inputData ? (
        <NodeInputPreview nodeId={id} data={inputData} />
      ) : (
        <>
          {/* Label */}
          <NodeLabelInput
            nodeId={id}
            label={props.data?.label}
            placeholder={inputData?.name}
            className={cn("tg:py-1", type === "ui" && "tg:capitalize")}
          />

          {/* Badges */}
          <div className="tg:mb-1 tg:flex tg:flex-wrap tg:gap-1">
            <NodeTypeBadge nodeId={id} nodeType={type} subType={subType} />
            <NodeGroupBadge groupId={parentId} />
          </div>

          {/* Options */}
          <NodeOptions nodeId={id} data={inputData} selected={selected} />
        </>
      )}

      {/* Bottom handle */}
      <BottomHandleDropdown nodeId={id} isConnectable={isConnectable} />
    </NodeWrapper>
  );
};

export default memo(TreegeNode);
