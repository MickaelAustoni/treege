import { BaseEdge, EdgeLabelRenderer, type EdgeProps, getBezierPath, Position, useReactFlow } from "@xyflow/react";
import { BetweenHorizontalEnd, GitBranch } from "lucide-react";
import { type MouseEvent, memo, type PointerEvent, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/components/ui/tooltip";
import { INPUT_TYPE } from "@/shared/constants/inputType";
import { NODE_TYPE } from "@/shared/constants/node";
import { UI_TYPE } from "@/shared/constants/uiType";

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
const DRAG_THRESHOLD = 4;

const StackedEdgeActions = ({ sourceId, labelX, labelY }: StackedEdgeActionsProps) => {
  const [open, setOpen] = useState(false);
  const { onAddFromHandle, onInsertAfter, createBranchAtPosition } = useFlowConnections();
  const t = useTranslate();

  // Drag-to-place state for the "create a branch" button: dragging draws a bezier
  // line following the cursor and drops the new branch node where released; a
  // plain click creates the branch directly (no type picker).
  const branchDragRef = useRef<{ startX: number; startY: number; dragging: boolean } | null>(null);
  const [branchLine, setBranchLine] = useState<{ fromX: number; fromY: number; toX: number; toY: number } | null>(null);

  const handleInsertClick = (event: MouseEvent) => {
    event.stopPropagation();
    setOpen(true);
  };

  const handleBranchPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    branchDragRef.current = { dragging: false, startX: event.clientX, startY: event.clientY };
  };

  const handleBranchPointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const state = branchDragRef.current;
    if (!state) {
      return;
    }
    if (state.dragging || Math.hypot(event.clientX - state.startX, event.clientY - state.startY) > DRAG_THRESHOLD) {
      state.dragging = true;
      setBranchLine({ fromX: state.startX, fromY: state.startY, toX: event.clientX, toY: event.clientY });
    }
  };

  const handleBranchPointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    const state = branchDragRef.current;
    branchDragRef.current = null;
    setBranchLine(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    event.stopPropagation();
    if (state?.dragging) {
      // Dragged: drop the new branch node at the release position.
      createBranchAtPosition(sourceId, { x: event.clientX, y: event.clientY });
    } else {
      // Plain click: create the branch directly, no type picker.
      onAddFromHandle(sourceId);
    }
  };

  const runInsert = (nodeInit: NodeInit) => {
    onInsertAfter(sourceId, nodeInit);
  };

  return (
    <div
      className="nodrag nopan tg:group tg:pointer-events-auto tg:absolute tg:z-[10000] tg:flex tg:items-center tg:justify-center"
      style={{
        height: "24px",
        transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
        width: "var(--node-width, 280px)",
      }}
    >
      <TooltipProvider delayDuration={300}>
        <div className="tg:flex tg:gap-2 tg:opacity-0 tg:transition-opacity tg:focus-within:opacity-100 tg:group-hover:opacity-100">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={t("editor.stackedEdge.insertNode")}
                onClick={handleInsertClick}
                className="tg:flex tg:h-6 tg:w-6 tg:cursor-pointer tg:items-center tg:justify-center tg:rounded-sm tg:bg-muted-foreground tg:transition-colors tg:hover:bg-primary/80"
              >
                <BetweenHorizontalEnd className="tg:h-4 tg:w-4 tg:text-primary-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{t("editor.stackedEdge.insertNode")}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={t("editor.stackedEdge.createBranch")}
                onPointerDown={handleBranchPointerDown}
                onPointerMove={handleBranchPointerMove}
                onPointerUp={handleBranchPointerUp}
                className="tg:flex tg:h-6 tg:w-6 tg:cursor-grab tg:items-center tg:justify-center tg:rounded-sm tg:bg-muted-foreground tg:transition-colors tg:hover:bg-primary/80 tg:active:cursor-grabbing"
              >
                <GitBranch className="tg:h-4 tg:w-4 tg:text-primary-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{t("editor.stackedEdge.createBranch")}</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

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
                  onClick={() => runInsert({ data: { type: subType }, type: NODE_TYPE.input })}
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
                  onClick={() => runInsert({ data: { type: subType }, type: NODE_TYPE.ui })}
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

      {/* Cursor-following connection line while dragging the branch button.
          Portaled to body and drawn in viewport (client) coordinates so it
          isn't affected by the transformed EdgeLabelRenderer container. */}
      {branchLine &&
        createPortal(
          <svg aria-hidden className="tg:pointer-events-none tg:fixed tg:inset-0 tg:z-[10001] tg:h-full tg:w-full">
            <title>{t("editor.stackedEdge.createBranch")}</title>
            <path
              d={
                getBezierPath({
                  sourcePosition: Position.Bottom,
                  sourceX: branchLine.fromX,
                  sourceY: branchLine.fromY,
                  targetPosition: Position.Top,
                  targetX: branchLine.toX,
                  targetY: branchLine.toY,
                })[0]
              }
              fill="none"
              strokeWidth={2}
              className="tg:stroke-primary"
            />
            <circle cx={branchLine.toX} cy={branchLine.toY} r={4} className="tg:fill-primary" />
          </svg>,
          document.body,
        )}
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
