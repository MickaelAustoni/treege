import { Handle, Node, NodeProps, Position, useStore } from "@xyflow/react";
import { memo } from "react";
import BottomHandleDropdown from "@/editor/features/TreegeEditor/nodes/components/BottomHandleDropdown";
import NodeGroupBadge from "@/editor/features/TreegeEditor/nodes/components/NodeGroupBadge";
import NodeImage from "@/editor/features/TreegeEditor/nodes/components/NodeImage";
import NodeImageButton from "@/editor/features/TreegeEditor/nodes/components/NodeImageButton";
import NodeInputPreview from "@/editor/features/TreegeEditor/nodes/components/NodeInputPreview";
import NodeLabelInput from "@/editor/features/TreegeEditor/nodes/components/NodeLabelInput";
import NodeMoreMenu from "@/editor/features/TreegeEditor/nodes/components/NodeMoreMenu";
import NodeRequiredButton from "@/editor/features/TreegeEditor/nodes/components/NodeRequiredButton";
import NodeTypeBadge from "@/editor/features/TreegeEditor/nodes/components/NodeTypeBadge";
import NodeWrapper from "@/editor/features/TreegeEditor/nodes/layout/NodeWrapper";
import { useStackPosition } from "@/editor/hooks/useStackPosition";
import { cn } from "@/shared/lib/utils";
import { InputNodeData, UINodeData } from "@/shared/types/node";

export type TreegeNodeProps = NodeProps<Node<InputNodeData, "input">> | NodeProps<Node<UINodeData, "ui">>;

const TreegeNode = (props: TreegeNodeProps) => {
  const { id, isConnectable, parentId, selected, type } = props;
  const inputData = props.type === "input" ? props.data : undefined;
  const uiData = props.type === "ui" ? props.data : undefined;
  const subType = inputData?.type ?? uiData?.type;
  const isSubmit = inputData?.type === "submit";
  const stackPosition = useStackPosition(id);
  const isStackTail = stackPosition === "last" || stackPosition === "single";
  const isStackHead = stackPosition === "first" || stackPosition === "single";
  const isMultiSelection = useStore((state) => state.nodes.filter((node) => node.selected).length > 1);
  const isInEditMode = selected && !isMultiSelection;
  const showBottomHandle = !(isSubmit || isMultiSelection);
  const isBottomHandleHoverOnly = !isStackTail;

  return (
    <NodeWrapper isSubmit={isSubmit} stackPosition={stackPosition}>
      {/* Top handle */}
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable && isStackHead}
        isConnectableStart={type === "ui"}
        className={cn(!isStackHead && "tg:pointer-events-none tg:opacity-0")}
      />

      {/* Illustrative image */}
      <NodeImage image={inputData?.image} />

      {/* Badges (left) + actions (right) */}
      <div className="tg:mb-1 tg:flex tg:items-center tg:justify-between tg:gap-1">
        <div className="tg:flex tg:flex-wrap tg:gap-1">
          <NodeTypeBadge nodeId={id} nodeType={type} subType={subType} />
          <NodeGroupBadge nodeId={id} groupId={parentId} />
        </div>
        <div className="tg:flex tg:min-h-6 tg:items-center tg:gap-0.5">
          {inputData && !isSubmit && (
            <>
              <NodeRequiredButton nodeId={id} required={inputData.required} />
              <NodeImageButton nodeId={id} image={inputData.image} />
            </>
          )}
          <NodeMoreMenu nodeId={id} />
        </div>
      </div>

      {/* Label (always rendered; autofocused on entering edit mode) */}
      <NodeLabelInput
        nodeId={id}
        label={props.data?.label}
        placeholder={inputData?.name}
        autoFocus={isInEditMode}
        className={cn("tg:py-1", type === "ui" && "tg:capitalize")}
      />

      {/* Input preview (runtime rendering + inline option edit). Returns null when data is not editable. */}
      <NodeInputPreview nodeId={id} data={inputData} />

      {/* Bottom handle — always rendered so React Flow can resolve outgoing edges; hidden visually when not applicable. */}
      <BottomHandleDropdown nodeId={id} isConnectable={isConnectable} hoverOnly={isBottomHandleHoverOnly} hidden={!showBottomHandle} />
    </NodeWrapper>
  );
};

export default memo(TreegeNode);
