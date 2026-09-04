import { Edge, useStore } from "@xyflow/react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { MouseEvent } from "react";
import { useFlowConnections } from "@/editor/context/FlowActionsProvider";
import useTranslate from "@/editor/hooks/useTranslate";
import { getEdgeIndex } from "@/editor/utils/edge";
import { StackPosition } from "@/editor/utils/stackPositionIndex";
import { Button } from "@/shared/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/components/ui/tooltip";
import { cn } from "@/shared/lib/utils";

/**
 * Which decision nodes gate the swap of a stacked node: a decision node's
 * outgoing edges carry conditions referencing its own id, so relocating it
 * (or moving a node past it) would break that gate.
 */
type DecisionGate = "none" | "node-is-decision" | "successor-is-decision" | "both";

const resolveDecisionGate = (edges: Edge[], nodeId: string): DecisionGate => {
  const { outgoing: outgoingByNode } = getEdgeIndex(edges);
  const outgoing = outgoingByNode.get(nodeId) ?? [];
  const successorId = outgoing.length === 1 ? outgoing[0].target : null;
  const successorOutgoingCount = successorId ? (outgoingByNode.get(successorId)?.length ?? 0) : 0;
  const isDecision = outgoing.length > 1;
  const isSuccessorDecision = successorOutgoingCount > 1;

  if (isDecision && isSuccessorDecision) {
    return "both";
  }
  if (isDecision) {
    return "node-is-decision";
  }
  if (isSuccessorDecision) {
    return "successor-is-decision";
  }
  return "none";
};

interface NodeStackOrderButtonsProps {
  nodeId: string;
  selected?: boolean;
  /** Position of the node in its stack, as resolved by the node card. */
  stackPosition: StackPosition;
}

const NodeStackOrderButtons = ({ nodeId, selected, stackPosition: position }: NodeStackOrderButtonsProps) => {
  const isStackSingle = position === "single";
  const { moveStackNodeUp, moveStackNodeDown } = useFlowConnections();
  const t = useTranslate();
  // The selector returns a string (a primitive), so the store compares it by
  // value on every update and this component only re-renders when the gate changes.
  const decisionGate = useStore((state) => resolveDecisionGate(state.edges, nodeId));
  const isDecision = decisionGate === "node-is-decision" || decisionGate === "both";
  const isSuccessorDecision = decisionGate === "successor-is-decision" || decisionGate === "both";
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
