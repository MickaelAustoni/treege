import { useReactFlow } from "@xyflow/react";
import { useEffect, useMemo, useState } from "react";
import { useTreegeEditorContext } from "@/editor/context/TreegeEditorContext";
import useFlowActions from "@/editor/hooks/useFlowActions";
import useTranslate from "@/editor/hooks/useTranslate";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Label } from "@/shared/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/shared/components/ui/radio-group";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { ConditionalEdgeData, EdgeCondition } from "@/shared/types/edge";
import { InputNodeData, TreegeNode } from "@/shared/types/node";

const OPERATOR_DISPLAY: Record<string, string> = {
  "!==": "≠",
  "<": "<",
  "<=": "≤",
  "===": "=",
  ">": ">",
  ">=": "≥",
};

const summarizeConditions = (conditions: EdgeCondition[] | undefined, resolveField: (fieldId: string) => string): string => {
  const defined = conditions?.filter((condition) => condition.value !== undefined && condition.value !== "") ?? [];

  if (defined.length === 0) {
    return "";
  }

  return defined
    .map((condition, index) => {
      const operator = OPERATOR_DISPLAY[condition.operator ?? ""] ?? condition.operator ?? "";
      const field = condition.field ? resolveField(condition.field) : "";
      const piece = `${field} ${operator} ${condition.value ?? ""}`.trim();
      const prefix = index === 0 ? "" : ` ${condition.logicalOperator ?? "AND"} `;
      return `${prefix}${piece}`;
    })
    .join("");
};

const ChangeNodeTypeDialog = () => {
  const { pendingNodeTypeChange, closeNodeTypeChangeConfirmation } = useTreegeEditorContext();
  const { getEdges, getNode, setEdges, updateEdgeData } = useReactFlow();
  const { updateNodeType } = useFlowActions();
  const t = useTranslate();

  const outgoingEdges = useMemo(() => {
    if (!pendingNodeTypeChange) {
      return [];
    }
    return getEdges()
      .filter((edge) => edge.source === pendingNodeTypeChange.nodeId)
      .sort((a, b) => {
        const aPos = getNode(a.target)?.position ?? { x: 0, y: 0 };
        const bPos = getNode(b.target)?.position ?? { x: 0, y: 0 };
        return aPos.x - bPos.x || aPos.y - bPos.y;
      });
  }, [pendingNodeTypeChange, getEdges, getNode]);

  const [selectedEdgeId, setSelectedEdgeId] = useState<string>("");

  useEffect(() => {
    if (outgoingEdges.length > 0) {
      setSelectedEdgeId(outgoingEdges[0].id);
    }
  }, [outgoingEdges]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      closeNodeTypeChangeConfirmation();
    }
  };

  const handleConfirm = () => {
    if (!(pendingNodeTypeChange && selectedEdgeId)) {
      closeNodeTypeChangeConfirmation();
      return;
    }

    const { nodeId, type, subType } = pendingNodeTypeChange;

    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId || edge.id === selectedEdgeId));
    updateEdgeData(selectedEdgeId, { conditions: undefined, configured: undefined, isFallback: undefined });
    updateNodeType(nodeId, type, subType);
    closeNodeTypeChangeConfirmation();
  };

  const getTargetLabel = (targetId: string) => {
    const target = getNode(targetId) as TreegeNode | undefined;
    const data = target?.data as (InputNodeData & { label?: unknown }) | undefined;
    const label = data && "label" in data ? (data.label as string | Record<string, string> | undefined) : undefined;
    const resolved = t(label) || data?.name;
    if (resolved) {
      return resolved;
    }
    return targetId.length > 5 ? `${targetId.slice(0, 5)}…` : targetId;
  };

  const resolveFieldLabel = (fieldId: string) => {
    const node = getNode(fieldId) as TreegeNode | undefined;
    const data = node?.data as InputNodeData | undefined;
    const resolved = t(data?.label) || data?.name || fieldId;
    return resolved === fieldId && resolved.length > 5 ? `${resolved.slice(0, 5)}…` : resolved;
  };

  const getEdgeSummary = (edgeData: ConditionalEdgeData | undefined): string => {
    if (edgeData?.isFallback) {
      return t("editor.conditionalEdge.fallback");
    }
    if (edgeData?.label) {
      return edgeData.label;
    }
    const summary = summarizeConditions(edgeData?.conditions, resolveFieldLabel);
    return summary || t("editor.changeNodeTypeDialog.noConditions");
  };

  return (
    <Dialog open={pendingNodeTypeChange !== null} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{t("editor.changeNodeTypeDialog.title")}</DialogTitle>
          <DialogDescription>{t("editor.changeNodeTypeDialog.description")}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="tg:max-h-80">
          <RadioGroup value={selectedEdgeId} onValueChange={setSelectedEdgeId} className="tg:gap-2 tg:pr-2">
            {outgoingEdges.map((edge) => {
              const edgeData = edge.data as ConditionalEdgeData | undefined;
              const summary = getEdgeSummary(edgeData);
              const targetLabel = getTargetLabel(edge.target);

              return (
                <Label
                  key={edge.id}
                  htmlFor={`keep-${edge.id}`}
                  className="tg:flex tg:cursor-pointer tg:items-start tg:gap-3 tg:rounded-lg tg:border tg:bg-muted/20 tg:p-3"
                >
                  <RadioGroupItem id={`keep-${edge.id}`} value={edge.id} className="tg:mt-1" />
                  <div className="tg:flex tg:flex-col tg:gap-1">
                    <span className="tg:font-medium">{targetLabel}</span>
                    <span className="tg:text-muted-foreground tg:text-xs">{summary}</span>
                  </div>
                </Label>
              );
            })}
          </RadioGroup>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={closeNodeTypeChangeConfirmation}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedEdgeId}>
            {t("editor.changeNodeTypeDialog.keepBranch")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ChangeNodeTypeDialog;
