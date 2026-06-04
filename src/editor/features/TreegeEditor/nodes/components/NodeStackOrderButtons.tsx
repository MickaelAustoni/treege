import { useStore } from "@xyflow/react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { MouseEvent } from "react";
import { useShallow } from "zustand/react/shallow";
import useFlowConnections from "@/editor/hooks/useFlowConnections";
import { useStackPosition } from "@/editor/hooks/useStackPosition";
import useTranslate from "@/editor/hooks/useTranslate";
import { Button } from "@/shared/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/components/ui/tooltip";
import { cn } from "@/shared/lib/utils";

interface NodeStackOrderButtonsProps {
  nodeId: string;
  selected?: boolean;
}

const NodeStackOrderButtons = ({ nodeId, selected }: NodeStackOrderButtonsProps) => {
  const { position, isStackSingle } = useStackPosition(nodeId);
  const { moveStackNodeUp, moveStackNodeDown } = useFlowConnections();
  const t = useTranslate();

  // Gate the swap against decision nodes — a decision node's outgoing edges
  // carry conditions referencing its own id, so relocating it pushes that id
  // downstream and breaks the gate.
  const { isDecision, isSuccessorDecision } = useStore(
    useShallow((state) => {
      const outgoing = state.edges.filter((edge) => edge.source === nodeId);
      const successorId = outgoing.length === 1 ? outgoing[0].target : null;
      const successorOutgoing = successorId ? state.edges.filter((edge) => edge.source === successorId).length : 0;
      return {
        isDecision: outgoing.length > 1,
        isSuccessorDecision: successorOutgoing > 1,
      };
    }),
  );

  const canMoveUp = !isStackSingle && (position === "middle" || position === "last") && !isDecision;
  const canMoveDown = !isStackSingle && (position === "first" || position === "middle") && !isSuccessorDecision;

  if (!(canMoveUp || canMoveDown)) {
    return null;
  }

  const handleMoveUp = (event: MouseEvent) => {
    event.stopPropagation();
    moveStackNodeUp(nodeId);
  };

  const handleMoveDown = (event: MouseEvent) => {
    event.stopPropagation();
    moveStackNodeDown(nodeId);
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          "tg:absolute tg:flex tg:flex-col tg:gap-0.5 tg:transition-opacity tg:focus-within:opacity-100 tg:group-hover:opacity-100",
          selected ? "tg:opacity-100" : "tg:opacity-0",
        )}
        style={{ left: "calc(100% + 8px)", top: "50%", transform: "translateY(-50%)" }}
      >
        {canMoveUp && (
          <Tooltip disableHoverableContent>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                className="nodrag nopan"
                onClick={handleMoveUp}
                aria-label={t("editor.stackOrder.moveUp")}
              >
                <ChevronUp />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">{t("editor.stackOrder.moveUp")}</TooltipContent>
          </Tooltip>
        )}
        {canMoveDown && (
          <Tooltip disableHoverableContent>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                className="nodrag nopan"
                onClick={handleMoveDown}
                aria-label={t("editor.stackOrder.moveDown")}
              >
                <ChevronDown />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">{t("editor.stackOrder.moveDown")}</TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
};

export default NodeStackOrderButtons;
