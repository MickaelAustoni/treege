import { BaseEdge, Edge, EdgeLabelRenderer, EdgeProps, getBezierPath, useReactFlow } from "@xyflow/react";
import { Waypoints } from "lucide-react";
import { MouseEvent, memo } from "react";
import ConditionalEdgePopoverContent, { EdgeMode } from "@/editor/features/TreegeEditor/edges/ConditionalEdgePopoverContent";
import { useAncestorFieldLabel } from "@/editor/hooks/useAvailableParentFields";
import { useIsStackedEdge } from "@/editor/hooks/useIsStackedEdge";
import { useTransientState } from "@/editor/hooks/useTransientState";
import useTranslate from "@/editor/hooks/useTranslate";
import { Button } from "@/shared/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";
import { LOGICAL_OPERATOR } from "@/shared/constants/operator";
import { cn } from "@/shared/lib/utils";
import { ConditionalEdgeData, EdgeCondition } from "@/shared/types/edge";
import { Operator } from "@/shared/types/operator";

export type ConditionalEdgeType = Edge<ConditionalEdgeData, "conditional">;
export type ConditionalEdgeProps = EdgeProps<ConditionalEdgeType>;

const OPERATOR_DISPLAY: Record<Operator, string> = {
  "!==": "≠",
  "<": "<",
  "<=": "≤",
  "===": "=",
  ">": ">",
  ">=": "≥",
};

/**
 * Kept as a backward-compatibility fallback for edges saved before the
 * explicit `configured` flag existed: an edge with at least one condition
 * carrying both a field and a non-empty value is considered configured.
 */
const isConditionDefined = (condition: EdgeCondition) =>
  Boolean(condition.field) && condition.value !== undefined && condition.value !== "";

/**
 * Edge between a decision and one of its branches: the line plus a label
 * button summarizing the routing condition, which opens the condition form in
 * a popover (`ConditionalEdgePopoverContent`).
 *
 * The default render is deliberately light — a large flow mounts hundreds of
 * these: the form and its ancestor-field lookups only exist while the popover
 * is open, and the summary reads the single field it needs from the store.
 */
const ConditionalEdge = ({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
  data,
}: ConditionalEdgeProps) => {
  const [edgePath] = getBezierPath({
    sourcePosition,
    sourceX,
    sourceY,
    targetPosition,
    targetX,
    targetY,
  });

  // Transient: a large flow unmounts this edge while it is out of the viewport,
  // and the user expects to find the popover as they left it when it returns.
  const [isOpen, setIsOpen] = useTransientState(`conditional-edge:${id}:open`, false);
  // Owned here (not by the form) so the chosen mode survives closing the popover.
  const [mode, setMode] = useTransientState<EdgeMode>(`conditional-edge:${id}:mode`, "basic");
  const { updateEdgeData, deleteElements } = useReactFlow();
  const isStacked = useIsStackedEdge(source, target);
  const t = useTranslate();
  const conditions = data?.conditions ?? [];
  const singleCondition = conditions.length === 1 ? conditions[0] : undefined;
  // Display label of the field referenced by a single condition (the only
  // case where the summary names a field); `undefined` when it is not an
  // Input ancestor of the target, in which case the raw id is shown.
  const singleConditionFieldLabel = useAncestorFieldLabel(target, singleCondition?.field);

  const isConfigured =
    Boolean(data?.configured) || Boolean(data?.isFallback) || Boolean(data?.label) || (data?.conditions?.some(isConditionDefined) ?? false);

  const onEdgeClick = (e: MouseEvent) => {
    e.stopPropagation();
  };

  const handleDelete = () => {
    setIsOpen(false);
    void deleteElements({ edges: [{ id }] });
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setIsOpen(nextOpen);
    if (nextOpen || data?.configured) {
      return;
    }
    const hasContent = Boolean(data?.isFallback) || Boolean(data?.label) || Boolean(data?.conditions?.length);
    if (hasContent) {
      updateEdgeData(id, { configured: true });
    }
  };

  const getConditionSummary = () => {
    if (data?.isFallback) {
      return data.label || t("editor.conditionalEdge.fallback");
    }

    if (data?.label) {
      return data.label;
    }

    if (conditions.length === 0) {
      return null;
    }

    if (singleCondition) {
      const resolvedLabel = singleConditionFieldLabel ?? singleCondition.field ?? "";
      const isIdDisplay = resolvedLabel === singleCondition.field;
      const field = isIdDisplay && resolvedLabel.length > 5 ? `${resolvedLabel.slice(0, 5)}…` : resolvedLabel;
      const operator = OPERATOR_DISPLAY[singleCondition.operator as Operator] ?? singleCondition.operator;
      return `${field} ${operator} ${singleCondition.value ?? ""}`;
    }

    const andCount = conditions.filter((c) => c.logicalOperator === LOGICAL_OPERATOR.AND).length;
    const orCount = conditions.filter((c) => c.logicalOperator === LOGICAL_OPERATOR.OR).length;

    if (andCount > 0 && orCount === 0) {
      return `${conditions.length} ${t("editor.conditionalEdge.conditionsAnd")}`;
    }
    if (orCount > 0 && andCount === 0) {
      return `${conditions.length} ${t("editor.conditionalEdge.conditionsOr")}`;
    }

    return `${conditions.length} ${t("editor.conditionalEdge.conditionsMixed")}`;
  };

  const getEdgeStrokeColor = () => {
    if (data?.isFallback) {
      return "var(--treege-chart-4)";
    }
    if (isConfigured) {
      return "var(--treege-chart-2)";
    }
    return "var(--treege-chart-3)";
  };

  if (isStacked) {
    return null;
  }

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: getEdgeStrokeColor(),
          strokeDasharray: data?.isFallback ? "5,5" : undefined,
          strokeWidth: isConfigured ? 2 : style?.strokeWidth,
        }}
      />

      <EdgeLabelRenderer>
        <div
          className="nodrag nopan nowheel tg:absolute tg:z-10000"
          style={{
            pointerEvents: "all",
            transform: `translate(-50%, calc(-100% - 8px)) translate(${targetX}px, ${targetY}px)`,
          }}
        >
          <Popover open={isOpen} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
              <Button
                variant={isConfigured ? "default" : "secondary"}
                size="xs"
                className={cn(
                  "tg:transition-[filter]",
                  isConfigured ? "tg:hover:bg-primary tg:hover:brightness-125" : "tg:hover:bg-secondary tg:hover:brightness-90",
                )}
                onClick={onEdgeClick}
              >
                <Waypoints className="tg:h-3 tg:w-3" />
                {isConfigured ? getConditionSummary() : t("editor.conditionalEdge.defineCondition")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="tg:w-96 tg:p-1" align="center" onClick={(e) => e.stopPropagation()}>
              <ConditionalEdgePopoverContent
                id={id}
                source={source}
                target={target}
                data={data}
                mode={mode}
                onModeChange={setMode}
                onClose={() => handleOpenChange(false)}
                onDelete={handleDelete}
              />
            </PopoverContent>
          </Popover>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default memo(ConditionalEdge);
