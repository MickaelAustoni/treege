import { useForm } from "@tanstack/react-form";
import { BaseEdge, Edge, EdgeLabelRenderer, EdgeProps, getBezierPath, useEdges, useReactFlow } from "@xyflow/react";
import { Plus, Trash2, Waypoints, X } from "lucide-react";
import { MouseEvent, memo, useMemo, useState } from "react";
import { useTreegeEditorContext } from "@/editor/context/TreegeEditorContext";
import useAvailableParentFields from "@/editor/hooks/useAvailableParentFields";
import { useIsStackedEdge } from "@/editor/hooks/useIsStackedEdge";
import useTranslate from "@/editor/hooks/useTranslate";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { FormDescription, FormItem } from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/shared/components/ui/toggle-group";
import { LOGICAL_OPERATOR } from "@/shared/constants/operator";
import { cn } from "@/shared/lib/utils";
import { ConditionalEdgeData, EdgeCondition } from "@/shared/types/edge";
import { LogicalOperator, Operator } from "@/shared/types/operator";
import { Translatable } from "@/shared/types/translate";

export type ConditionalEdgeType = Edge<ConditionalEdgeData, "conditional">;
export type ConditionalEdgeProps = EdgeProps<ConditionalEdgeType>;

type EdgeMode = "basic" | "advanced";

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

const resolveTranslatable = (label: Translatable | undefined, language: string): string => {
  if (label === undefined) {
    return "";
  }
  if (typeof label === "string") {
    return label;
  }
  return label[language as keyof typeof label] ?? label.en ?? "";
};

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

  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<EdgeMode>("basic");
  const { updateEdgeData, deleteElements } = useReactFlow();
  const { language } = useTreegeEditorContext();
  const isStacked = useIsStackedEdge(source, target);
  const availableParentFields = useAvailableParentFields(target);
  const directParent = availableParentFields.find((field) => field.nodeId === source) ?? availableParentFields[0];
  const t = useTranslate();
  const allEdges = useEdges();

  /**
   * Values already used by sibling edges (same `source`, different edge id)
   * for the direct parent's field. Used in Basic mode to disable options that
   * are already routed by another branch, preventing duplicate decisions.
   */
  const siblingValues = useMemo(() => {
    const present = new Set<string>();
    if (!directParent) {
      return present;
    }
    allEdges.forEach((edge) => {
      if (edge.id === id || edge.source !== source) {
        return;
      }
      const conditionalData = edge.data as ConditionalEdgeData | undefined;
      conditionalData?.conditions?.forEach((condition) => {
        if (condition.field === directParent.nodeId && condition.value) {
          present.add(condition.value);
        }
      });
    });
    return present;
  }, [allEdges, id, source, directParent]);

  const isConfigured =
    Boolean(data?.configured) || Boolean(data?.isFallback) || Boolean(data?.label) || (data?.conditions?.some(isConditionDefined) ?? false);

  const { handleSubmit, reset, setFieldValue, Field } = useForm({
    defaultValues: {
      conditions: data?.conditions || [{ field: directParent?.nodeId ?? "", operator: "===", value: "" }],
      isFallback: !!data?.isFallback,
      label: data?.label || "",
    },
    listeners: {
      onChange: ({ formApi }) => {
        formApi.handleSubmit().then();
      },
      onChangeDebounceMs: 150,
    },
    onSubmit: ({ value }) => {
      updateEdgeData(id, { ...value, configured: true });
    },
  });

  const onEdgeClick = (e: MouseEvent) => {
    e.stopPropagation();
  };

  const handleClear = () => {
    reset({ conditions: [], isFallback: false, label: "" });
    updateEdgeData(id, { conditions: undefined, configured: undefined, isFallback: undefined, label: undefined });
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

  const handleModeChange = (next: string) => {
    if (next === "basic" || next === "advanced") {
      setMode(next);
    }
  };

  const handleBasicValueChange = (nextValue: string) => {
    if (!directParent) {
      return;
    }
    setFieldValue("conditions", [{ field: directParent.nodeId, operator: "===", value: nextValue }]);
    setFieldValue("isFallback", false);
  };

  const getConditionSummary = () => {
    if (data?.isFallback) {
      return data.label || t("editor.conditionalEdge.fallback");
    }

    if (data?.label) {
      return data.label;
    }

    const conditions = data?.conditions ?? [];

    if (conditions.length === 0) {
      return null;
    }

    if (conditions.length === 1) {
      const [condition] = conditions;
      const resolvedLabel = availableParentFields.find((f) => f.nodeId === condition.field)?.label ?? condition.field ?? "";
      const isIdDisplay = resolvedLabel === condition.field;
      const field = isIdDisplay && resolvedLabel.length > 5 ? `${resolvedLabel.slice(0, 5)}…` : resolvedLabel;
      const operator = OPERATOR_DISPLAY[condition.operator as Operator] ?? condition.operator;
      return `${field} ${operator} ${condition.value ?? ""}`;
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
          className="nodrag nopan tg:absolute tg:z-10000"
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
            <PopoverContent disablePortal className="tg:w-96 tg:p-1" align="center" onClick={(e) => e.stopPropagation()}>
              <ScrollArea className="tg:flex tg:max-h-150 tg:flex-col tg:p-3">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <div className="tg:grid tg:gap-5">
                    <div className="tg:space-y-2">
                      <h4 className="tg:font-medium tg:leading-none">{t("editor.conditionalEdge.displayConditions")}</h4>
                      <p className="tg:text-muted-foreground tg:text-sm">{t("editor.conditionalEdge.displayConditionsDesc")}</p>
                    </div>

                    <ToggleGroup type="single" variant="outline" size="sm" value={mode} onValueChange={handleModeChange}>
                      <ToggleGroupItem value="basic" aria-label={t("editor.conditionalEdge.basic")}>
                        {t("editor.conditionalEdge.basic")}
                      </ToggleGroupItem>
                      <ToggleGroupItem value="advanced" aria-label={t("editor.conditionalEdge.advanced")}>
                        {t("editor.conditionalEdge.advanced")}
                      </ToggleGroupItem>
                    </ToggleGroup>

                    {mode === "basic" ? (
                      <div className="tg:grid tg:gap-4">
                        <Field name="label">
                          {(field) => (
                            <FormItem>
                              <Label htmlFor={field.name}>{t("editor.conditionalEdge.labelOptional")}</Label>
                              <Input
                                id={field.name}
                                placeholder={t("editor.conditionalEdge.labelPlaceholder")}
                                value={field.state.value}
                                onChange={(e) => field.handleChange(e.target.value)}
                              />
                              <FormDescription>{t("editor.conditionalEdge.labelDesc")}</FormDescription>
                            </FormItem>
                          )}
                        </Field>

                        {directParent ? (
                          <Field name="conditions">
                            {(conditionsField) => {
                              const currentValue = conditionsField.state.value?.[0]?.value ?? "";
                              const options = directParent.options ?? [];
                              const hasOptions = options.length > 0;

                              return (
                                <FormItem>
                                  <Label>{t("editor.conditionalEdge.basicConditionLabel").replace("{name}", directParent.label)}</Label>
                                  {hasOptions ? (
                                    <Select value={currentValue} onValueChange={handleBasicValueChange}>
                                      <SelectTrigger className="tg:w-full">
                                        <SelectValue placeholder={t("editor.conditionalEdge.selectValue")} />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {options.map((option) => {
                                          const isAlreadyPresent = siblingValues.has(option.value) && option.value !== currentValue;
                                          const labelText = resolveTranslatable(option.label, language);
                                          const displayLabel =
                                            labelText && labelText !== option.value ? `${labelText} (${option.value})` : option.value;

                                          return (
                                            <SelectItem key={option.value} value={option.value} disabled={isAlreadyPresent}>
                                              {displayLabel}
                                            </SelectItem>
                                          );
                                        })}
                                      </SelectContent>
                                    </Select>
                                  ) : (
                                    <Input
                                      placeholder={t("editor.conditionalEdge.valuePlaceholder")}
                                      value={currentValue}
                                      onChange={(e) => handleBasicValueChange(e.target.value)}
                                    />
                                  )}
                                </FormItem>
                              );
                            }}
                          </Field>
                        ) : (
                          <p className="tg:text-muted-foreground tg:text-sm">{t("editor.conditionalEdge.noFieldsAvailable")}</p>
                        )}
                      </div>
                    ) : (
                      <div className="tg:grid tg:gap-4">
                        <Field name="label">
                          {(field) => (
                            <FormItem>
                              <Label htmlFor={field.name}>{t("editor.conditionalEdge.labelOptional")}</Label>
                              <Input
                                id={field.name}
                                placeholder={t("editor.conditionalEdge.labelPlaceholder")}
                                value={field.state.value}
                                onChange={(e) => field.handleChange(e.target.value)}
                              />
                              <FormDescription>{t("editor.conditionalEdge.labelDesc")}</FormDescription>
                            </FormItem>
                          )}
                        </Field>

                        <Field name="isFallback">
                          {(field) => (
                            <FormItem>
                              <div className="tg:flex tg:items-center tg:gap-3 tg:rounded-lg tg:border tg:bg-muted/20 tg:p-3">
                                <Checkbox
                                  id={field.name}
                                  checked={field.state.value}
                                  onCheckedChange={(checked) => field.handleChange(checked as boolean)}
                                />
                                <div className="tg:flex tg:flex-col tg:gap-1">
                                  <Label htmlFor={field.name} className="tg:cursor-pointer tg:font-medium">
                                    {t("editor.conditionalEdge.fallbackPath")}
                                  </Label>
                                  <FormDescription className="tg:text-xs">{t("editor.conditionalEdge.fallbackPathDesc")}</FormDescription>
                                </div>
                              </div>
                            </FormItem>
                          )}
                        </Field>

                        <Field name="conditions" mode="array">
                          {(conditionsField) => {
                            const isFallback = conditionsField.form.getFieldValue("isFallback");

                            return (
                              <div className="tg:space-y-3">
                                <Label className={isFallback ? "tg:text-muted-foreground" : ""}>
                                  {t("editor.conditionalEdge.conditions")}
                                </Label>

                                <div className="tg:space-y-2">
                                  {conditionsField.state.value?.map((_, index) => (
                                    <div key={`condition-${index}`} className="tg:space-y-2">
                                      <div className="tg:space-y-2 tg:rounded-lg tg:border tg:bg-muted/30 tg:p-3">
                                        <Field name={`conditions[${index}].field`}>
                                          {(fieldField) => (
                                            <FormItem>
                                              <Label htmlFor={`field-${index}`}>{t("editor.conditionalEdge.field")}</Label>
                                              <Select
                                                disabled={isFallback}
                                                value={fieldField.state.value || ""}
                                                onValueChange={(value: string) => fieldField.handleChange(value)}
                                              >
                                                <SelectTrigger id={`field-${index}`} className="tg:w-full">
                                                  <SelectValue placeholder={t("editor.conditionalEdge.selectField")} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  {availableParentFields.length === 0 ? (
                                                    <SelectItem value="none" disabled>
                                                      {t("editor.conditionalEdge.noFieldsAvailable")}
                                                    </SelectItem>
                                                  ) : (
                                                    availableParentFields.map((field) => (
                                                      <SelectItem key={field.nodeId} value={field.nodeId}>
                                                        {field.label} ({field.type})
                                                      </SelectItem>
                                                    ))
                                                  )}
                                                </SelectContent>
                                              </Select>
                                            </FormItem>
                                          )}
                                        </Field>

                                        <div className="tg:flex tg:gap-2">
                                          <Field name={`conditions[${index}].operator`}>
                                            {(operatorField) => (
                                              <FormItem>
                                                <Label htmlFor={`operator-${index}`}>{t("editor.conditionalEdge.operator")}</Label>
                                                <Select
                                                  disabled={isFallback}
                                                  value={operatorField.state.value || "==="}
                                                  onValueChange={(value: Operator) => operatorField.handleChange(value)}
                                                >
                                                  <SelectTrigger id={`operator-${index}`}>
                                                    <SelectValue />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    <SelectItem value="===">=</SelectItem>
                                                    <SelectItem value="!==">≠</SelectItem>
                                                    <SelectItem value=">">&gt;</SelectItem>
                                                    <SelectItem value="<">&lt;</SelectItem>
                                                    <SelectItem value=">=">&gt;=</SelectItem>
                                                    <SelectItem value="<=">&lt;=</SelectItem>
                                                  </SelectContent>
                                                </Select>
                                              </FormItem>
                                            )}
                                          </Field>

                                          <Field name={`conditions[${index}].value`}>
                                            {(valueField) => (
                                              <FormItem className="tg:w-full">
                                                <Label htmlFor={`value-${index}`}>{t("editor.conditionalEdge.value")}</Label>
                                                <Input
                                                  disabled={isFallback}
                                                  id={`value-${index}`}
                                                  placeholder={t("editor.conditionalEdge.valuePlaceholder")}
                                                  value={valueField.state.value || ""}
                                                  onChange={(e) => valueField.handleChange(e.target.value)}
                                                />
                                              </FormItem>
                                            )}
                                          </Field>
                                        </div>

                                        {conditionsField.state.value && conditionsField.state.value.length > 1 && (
                                          <Button
                                            disabled={isFallback}
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="tg:w-full"
                                            onClick={() => {
                                              conditionsField.removeValue(index);
                                              handleSubmit().then();
                                            }}
                                          >
                                            <X className="tg:mr-1 tg:h-4 tg:w-4" />
                                            {t("editor.conditionalEdge.removeCondition")}
                                          </Button>
                                        )}
                                      </div>

                                      {conditionsField.state.value && index < conditionsField.state.value.length - 1 && (
                                        <Field name={`conditions[${index}].logicalOperator`}>
                                          {(logicalField) => (
                                            <div className="tg:flex tg:justify-center">
                                              <Select
                                                disabled={isFallback}
                                                value={logicalField.state.value || LOGICAL_OPERATOR.AND}
                                                onValueChange={(value: LogicalOperator) => logicalField.handleChange(value)}
                                              >
                                                <SelectTrigger className="tg:h-9 tg:w-32 tg:font-semibold">
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value={LOGICAL_OPERATOR.AND}>AND</SelectItem>
                                                  <SelectItem value={LOGICAL_OPERATOR.OR}>OR</SelectItem>
                                                </SelectContent>
                                              </Select>
                                            </div>
                                          )}
                                        </Field>
                                      )}
                                    </div>
                                  ))}

                                  <Button
                                    disabled={isFallback}
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="tg:w-full"
                                    onClick={() => {
                                      conditionsField.pushValue({
                                        field: availableParentFields[0]?.nodeId ?? "",
                                        logicalOperator: LOGICAL_OPERATOR.AND,
                                        operator: "===",
                                        value: "",
                                      });
                                      handleSubmit().then();
                                    }}
                                  >
                                    <Plus className="tg:mr-2 tg:h-4 tg:w-4" />
                                    {t("editor.conditionalEdge.addCondition")}
                                  </Button>
                                </div>
                              </div>
                            );
                          }}
                        </Field>
                      </div>
                    )}

                    <div className="tg:flex tg:items-center tg:gap-2 tg:pt-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="tg:text-destructive tg:hover:text-destructive"
                        onClick={handleDelete}
                      >
                        <Trash2 className="tg:mr-1 tg:h-4 tg:w-4" />
                        {t("common.delete")}
                      </Button>
                      <div className="tg:ml-auto tg:flex tg:gap-2">
                        <Button type="button" size="sm" variant="outline" onClick={handleClear}>
                          <X className="tg:mr-1 tg:h-4 tg:w-4" />
                          {t("common.clear")}
                        </Button>
                        <Button type="button" size="sm" onClick={() => handleOpenChange(false)}>
                          {t("common.close")}
                        </Button>
                      </div>
                    </div>
                  </div>
                </form>
              </ScrollArea>
            </PopoverContent>
          </Popover>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default memo(ConditionalEdge);
