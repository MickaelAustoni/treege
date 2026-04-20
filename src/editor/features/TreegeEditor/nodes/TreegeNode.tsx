import { Handle, Node, NodeProps, Position } from "@xyflow/react";
import { Plus, Type } from "lucide-react";
import { memo } from "react";
import NodeTypeBadge from "@/editor/features/TreegeEditor/nodes/components/NodeTypeBadge";
import OpenSheetButton from "@/editor/features/TreegeEditor/nodes/components/OpenSheetButton";
import useBottomHandleClick from "@/editor/features/TreegeEditor/nodes/hooks/useBottomHandleClick";
import NodeWrapper from "@/editor/features/TreegeEditor/nodes/layout/NodeWrapper";
import useTranslate from "@/editor/hooks/useTranslate";
import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/lib/utils";
import { FlowNodeData, InputNodeData, UINodeData } from "@/shared/types/node";

export type TreegeNodeType = Node<FlowNodeData, "flow"> | Node<InputNodeData, "input"> | Node<UINodeData, "ui">;
export type TreegeNodeProps = NodeProps<TreegeNodeType>;

const TreegeNode = ({ data, isConnectable, parentId, type, id }: TreegeNodeProps) => {
  const translate = useTranslate();
  const label = translate(data?.label);
  const handleBottomHandleClick = useBottomHandleClick(id);

  const subType = type === "input" || type === "ui" ? (data as InputNodeData | UINodeData)?.type : undefined;
  const isSubmit = type === "input" && (data as InputNodeData)?.type === "submit";
  const fallbackLabel = type === "input" ? (data as InputNodeData)?.name : undefined;

  return (
    <NodeWrapper inGroup={!!parentId} isSubmit={isSubmit}>
      {/* Edit button */}
      <OpenSheetButton nodeId={id} />

      {/* Top handle */}
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} isConnectableStart={type === "ui"} />

      {/* Label */}
      <div className={cn("mb-1 max-w-full overflow-hidden text-ellipsis text-nowrap text-2xl", type === "ui" && "capitalize")}>
        {label || fallbackLabel}
      </div>

      {/* Types */}
      <div className="flex gap-1">
        <NodeTypeBadge nodeId={id} type={type} />
        {subType && (
          <Badge variant="outline" className="capitalize">
            <Type />
            {subType}
          </Badge>
        )}
      </div>

      {/* Bottom handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        onClick={handleBottomHandleClick}
        className="hover:!bg-primary/80 !w-6 !h-6 flex cursor-pointer items-center justify-center rounded-sm transition-colors"
      >
        <Plus className="h-4 w-4 text-primary-foreground" />
      </Handle>
    </NodeWrapper>
  );
};

export default memo(TreegeNode);
