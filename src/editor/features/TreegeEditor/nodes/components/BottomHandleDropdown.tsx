import { Handle, Position, useUpdateNodeInternals } from "@xyflow/react";
import { BetweenHorizontalEnd, GitBranch, Plus } from "lucide-react";
import { MouseEvent, useEffect, useState } from "react";
import NodeTypePickerMenuContent from "@/editor/features/TreegeEditor/nodes/components/NodeTypePickerMenuContent";
import useFlowConnections from "@/editor/hooks/useFlowConnections";
import useTranslate from "@/editor/hooks/useTranslate";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/shared/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/components/ui/tooltip";
import { cn } from "@/shared/lib/utils";

interface BottomHandleDropdownProps {
  nodeId: string;
  isConnectable?: boolean;
  /** Submit nodes / multi-selection: the handle stays in the DOM so edges keep an anchor, but it is invisible and non-interactive. */
  hidden?: boolean;
  /** Whether branching (a second outgoing path) is allowed — only for input nodes. */
  canBranch?: boolean;
  /**
   * True when the node sits before a linear successor (stack first/middle). The
   * controls then reveal on hover (the bottom border overlaps the next node) and
   * offer "insert between". On a tail (last/single) the controls stay visible.
   */
  isJunction?: boolean;
}

/**
 * Bottom-of-node controls anchored on the node's bottom border.
 *
 * The branch/add affordance is a real React Flow source `Handle`, so dragging it
 * goes through the native connection system (cursor line, target snapping, leaf
 * convergence, `isValidConnection`) — both for adding a child on a tail node and
 * for branching a new path on a junction node. On junctions an extra "insert
 * between" button splices a node before the existing successor.
 */
const BottomHandleDropdown = ({ nodeId, isConnectable, hidden, canBranch, isJunction }: BottomHandleDropdownProps) => {
  const [nodeTypeOpen, setNodeTypeOpen] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);
  const [insertOpen, setInsertOpen] = useState(false);
  const { onAddFromHandle, onCreateBranch, onInsertAfter } = useFlowConnections();
  const updateNodeInternals = useUpdateNodeInternals();
  const t = useTranslate();
  // The handle is present in the DOM even when not actionable (so edges keep an
  // anchor): on junctions it only becomes a branch trigger for input nodes.
  const handleHidden = hidden || (isJunction && !canBranch);
  // Junction affordances (hover reveal, insert button, branch tooltip) only when the controls are live.
  const interactiveJunction = Boolean(isJunction) && !hidden;

  // The handle's X shifts when the insert button appears (junction) or the handle
  // toggles between in-flow and absolute placement. React Flow doesn't re-measure
  // on its own here, so force it — otherwise outgoing edges keep starting from the
  // handle's stale position instead of where it actually renders.
  // interactiveJunction/handleHidden are intentional re-measure triggers, not body deps.
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-measure when the handle's layout changes
  useEffect(() => {
    updateNodeInternals(nodeId);
  }, [nodeId, interactiveJunction, handleHidden, updateNodeInternals]);

  const handleClick = (event: MouseEvent) => {
    if (event.defaultPrevented || handleHidden) {
      return;
    }
    // On a junction the handle branches: click creates a default node directly, like the drag (no type picker).
    if (isJunction) {
      onAddFromHandle(nodeId);
      return;
    }
    setNodeTypeOpen(true);
  };

  // Right-click fork-into-two only makes sense on a leaf (tail) input node.
  const handleContextMenu = (event: MouseEvent) => {
    if (handleHidden || isJunction) {
      return;
    }
    event.preventDefault();
    setContextOpen(true);
  };

  const handle = (
    <Handle
      type="source"
      position={Position.Bottom}
      isConnectable={isConnectable && !handleHidden}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      aria-label={isJunction ? t("editor.stackedEdge.createBranch") : t("editor.stackedEdge.addNode")}
      className={cn(
        "tg:flex tg:h-6! tg:w-6! tg:cursor-pointer tg:items-center tg:justify-center tg:rounded-sm tg:transition tg:hover:bg-primary/80!",
        handleHidden ? "tg:pointer-events-none tg:opacity-0" : "tg:relative! tg:transform-none! tg:inset-auto!",
      )}
    >
      {!handleHidden &&
        (isJunction ? (
          <GitBranch className="tg:h-4 tg:w-4 tg:text-primary-foreground" />
        ) : (
          <Plus className="tg:h-4 tg:w-4 tg:text-primary-foreground" />
        ))}
    </Handle>
  );

  return (
    <div
      className={cn(
        "nodrag nopan tg:absolute tg:bottom-0 tg:left-1/2 tg:z-50 tg:flex tg:-translate-x-1/2 tg:translate-y-1/2 tg:items-center tg:justify-center",
        // Junction: the container is a hover strip straddling the seam between the two stacked nodes.
        // Hovering that band (not the whole node) reveals the controls.
        interactiveJunction && "tg:group/seam tg:h-8",
      )}
      style={interactiveJunction ? { width: "var(--node-width, 280px)" } : undefined}
    >
      <div
        className={cn(
          "tg:flex tg:items-center tg:gap-2",
          interactiveJunction &&
            // Fade in on hover, but hide instantly: a fade-out would briefly show the controls' bottom half
            // clipped by the next node once the hovered node drops back below it.
            "tg:pointer-events-none tg:opacity-0 tg:transition-opacity tg:duration-0 tg:focus-within:pointer-events-auto tg:focus-within:opacity-100 tg:focus-within:duration-150 tg:group-hover/seam:pointer-events-auto tg:group-hover/seam:opacity-100 tg:group-hover/seam:duration-150",
        )}
      >
        <TooltipProvider delayDuration={300}>
          {interactiveJunction && (
            <Tooltip disableHoverableContent>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={t("editor.stackedEdge.insertNode")}
                  onClick={() => setInsertOpen(true)}
                  className="tg:flex tg:h-6 tg:w-6 tg:cursor-pointer tg:items-center tg:justify-center tg:rounded-sm tg:bg-muted-foreground tg:transition-colors tg:hover:bg-primary/80"
                >
                  <BetweenHorizontalEnd className="tg:h-4 tg:w-4 tg:text-primary-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left">{t("editor.stackedEdge.insertNode")}</TooltipContent>
            </Tooltip>
          )}

          {/* The branch tooltip is only worth showing where the handle is a branch trigger (junctions). */}
          {interactiveJunction && !handleHidden ? (
            <Tooltip disableHoverableContent>
              <TooltipTrigger asChild>{handle}</TooltipTrigger>
              <TooltipContent side="right">{t("editor.stackedEdge.createBranch")}</TooltipContent>
            </Tooltip>
          ) : (
            handle
          )}
        </TooltipProvider>
      </div>

      {/* Right-click context menu (tail input nodes): add a single node or fork into a branch. */}
      <DropdownMenu open={contextOpen} onOpenChange={setContextOpen}>
        <DropdownMenuTrigger asChild>
          <span aria-hidden className="tg:pointer-events-none tg:absolute tg:bottom-0 tg:left-1/2 tg:h-0 tg:w-0 tg:-translate-x-1/2" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" side="bottom">
          <DropdownMenuItem
            onClick={() => {
              setContextOpen(false);
              setNodeTypeOpen(true);
            }}
          >
            <Plus />
            {t("editor.stackedEdge.addNode")}
          </DropdownMenuItem>
          {canBranch && (
            <DropdownMenuItem onClick={() => onCreateBranch(nodeId)}>
              <GitBranch />
              {t("editor.stackedEdge.createBranch")}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Node-type picker: opened by left-click on the handle (add child or branch) or via "Add a node" above. */}
      <DropdownMenu open={nodeTypeOpen} onOpenChange={setNodeTypeOpen}>
        <DropdownMenuTrigger asChild>
          <span aria-hidden className="tg:pointer-events-none tg:absolute tg:bottom-0 tg:left-1/2 tg:h-0 tg:w-0 tg:-translate-x-1/2" />
        </DropdownMenuTrigger>
        <NodeTypePickerMenuContent onSelect={(nodeInit) => onAddFromHandle(nodeId, nodeInit)} />
      </DropdownMenu>

      {/* Insert-between picker (junctions only): splice a node before the existing successor. */}
      {interactiveJunction && (
        <DropdownMenu open={insertOpen} onOpenChange={setInsertOpen}>
          <DropdownMenuTrigger asChild>
            <span aria-hidden className="tg:pointer-events-none tg:absolute tg:bottom-0 tg:left-1/2 tg:h-0 tg:w-0 tg:-translate-x-1/2" />
          </DropdownMenuTrigger>
          <NodeTypePickerMenuContent onSelect={(nodeInit) => onInsertAfter(nodeId, nodeInit)} />
        </DropdownMenu>
      )}
    </div>
  );
};

export default BottomHandleDropdown;
