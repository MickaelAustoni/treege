import { BaseEdge, EdgeLabelRenderer, type EdgeProps, getBezierPath, useReactFlow } from "@xyflow/react";
import { BetweenHorizontalEnd, GitBranch } from "lucide-react";
import { MouseEvent, memo, useState } from "react";
import useFlowConnections, { type NodeInit } from "@/editor/hooks/useFlowConnections";
import { useIsStackedEdge } from "@/editor/hooks/useIsStackedEdge";
import useTranslate from "@/editor/hooks/useTranslate";
import { getInputTypeIcon } from "@/editor/utils/inputTypeIcon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { INPUT_TYPE } from "@/shared/constants/inputType";
import { NODE_TYPE } from "@/shared/constants/node";
import { UI_TYPE } from "@/shared/constants/uiType";

type EdgeAction = "branch" | "insert";

interface StackedEdgeActionsProps {
  sourceId: string;
  labelX: number;
  labelY: number;
}

/**
 * Hover-revealed pair of buttons rendered at the midpoint of a stacked edge
 * (where no edge line is drawn). Lets the user either insert a node between
 * the source and its stack successor, or branch a new outgoing path from the
 * source — without putting any handle on the intermediate node itself.
 */
const StackedEdgeActions = ({ sourceId, labelX, labelY }: StackedEdgeActionsProps) => {
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState<EdgeAction>("insert");
  const { onAddFromHandle, onInsertAfter } = useFlowConnections();
  const t = useTranslate();

  const handleClick = (event: MouseEvent, nextAction: EdgeAction) => {
    event.stopPropagation();
    setAction(nextAction);
    setOpen(true);
  };

  const runAction = (nodeInit: NodeInit) => {
    if (action === "insert") {
      onInsertAfter(sourceId, nodeInit);
    } else {
      onAddFromHandle(sourceId, nodeInit);
    }
  };

  return (
    <div
      className="nodrag nopan tg:group tg:pointer-events-auto tg:absolute tg:z-[10000] tg:flex tg:items-center tg:justify-center"
      style={{
        height: "40px",
        transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
        width: "var(--node-width, 280px)",
      }}
    >
      <div className="tg:flex tg:gap-2 tg:opacity-0 tg:transition-opacity tg:focus-within:opacity-100 tg:group-hover:opacity-100">
        <button
          type="button"
          aria-label="Insert a node here"
          onClick={(event) => handleClick(event, "insert")}
          className="tg:flex tg:h-6 tg:w-6 tg:cursor-pointer tg:items-center tg:justify-center tg:rounded-sm tg:bg-muted-foreground tg:transition-colors tg:hover:bg-primary/80"
        >
          <BetweenHorizontalEnd className="tg:h-4 tg:w-4 tg:text-primary-foreground" />
        </button>
        <button
          type="button"
          aria-label="Create a branch"
          onClick={(event) => handleClick(event, "branch")}
          className="tg:flex tg:h-6 tg:w-6 tg:cursor-pointer tg:items-center tg:justify-center tg:rounded-sm tg:bg-muted-foreground tg:transition-colors tg:hover:bg-primary/80"
        >
          <GitBranch className="tg:h-4 tg:w-4 tg:text-primary-foreground" />
        </button>
      </div>

      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <span
            aria-hidden
            className="tg:topon -1/2 tg:pointer-events-none tg:absolute tg:left-1/2 tg:h-0 tg:w-0 tg:-translate-x-1/2 tg:-translate-y-1/2"
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" side="bottom" className="treege-scrollbar tg:max-h-80">
          <DropdownMenuGroup>
            <DropdownMenuLabel>{t("editor.selectNodeType.options.input")}</DropdownMenuLabel>
            {Object.values(INPUT_TYPE).map((subType) => {
              const Icon = getInputTypeIcon(subType);

              return (
                <DropdownMenuItem
                  key={subType}
                  onClick={() => runAction({ data: { type: subType }, type: NODE_TYPE.input })}
                  className="tg:capitalize"
                >
                  <Icon />
                  {subType}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuLabel>{t("editor.selectNodeType.options.ui")}</DropdownMenuLabel>
            {Object.values(UI_TYPE).map((subType) => {
              const Icon = getInputTypeIcon(subType);

              return (
                <DropdownMenuItem
                  key={subType}
                  onClick={() => runAction({ data: { type: subType }, type: NODE_TYPE.ui })}
                  className="tg:capitalize"
                >
                  <Icon />
                  {subType}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

const DefaultEdge = ({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  selected,
}: EdgeProps) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourcePosition,
    sourceX,
    sourceY,
    targetPosition,
    targetX,
    targetY,
  });

  const { setEdges } = useReactFlow();
  const isStacked = useIsStackedEdge(source, target);

  const onEdgeClick = () => {
    setEdges((edges) => edges.filter((edge) => edge.id !== id));
  };

  if (isStacked) {
    return (
      <EdgeLabelRenderer>
        <StackedEdgeActions sourceId={source} labelX={labelX} labelY={labelY} />
      </EdgeLabelRenderer>
    );
  }

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        {selected && (
          <div
            className="button-edge__label nodrag nopan"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            }}
          >
            <button type="button" className="button-edge__button" onClick={onEdgeClick} aria-label="Remove edge">
              ×
            </button>
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
};

export default memo(DefaultEdge);
