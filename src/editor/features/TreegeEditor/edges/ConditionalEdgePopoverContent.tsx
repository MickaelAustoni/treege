import { useForm } from "@tanstack/react-form";
import { useReactFlow, useStore } from "@xyflow/react";
import { Plus, Trash2, X } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import useAvailableParentFields from "@/editor/hooks/useAvailableParentFields";
import useTranslate from "@/editor/hooks/useTranslate";
import { getEdgeIndex } from "@/editor/utils/edge";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { FormDescription, FormItem } from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/shared/components/ui/toggle-group";
import { LOGICAL_OPERATOR } from "@/shared/constants/operator";
import { ConditionalEdgeData } from "@/shared/types/edge";
import { LogicalOperator, Operator } from "@/shared/types/operator";

export type EdgeMode = "basic" | "advanced";

export interface ConditionalEdgePopoverContentProps {
  /** Edge id, target of `updateEdgeData`. */
  id: string;
  /** Source node id — sibling edges (same source) are read to disable already-routed options. */
  source: string;
  /** Target node id — its Input ancestors are the fields a condition may reference. */
  target: string;
  /** Current edge data, the form's initial values. */
  data?: ConditionalEdgeData;
  /** Basic/advanced mode, owned by the edge so it survives closing the popover. */
  mode: EdgeMode;
  onModeChange: (mode: EdgeMode) => void;
  /** Close the popover (the edge marks itself configured when it has content). */
  onClose: () => void;
  /** Delete the edge. */
  onDelete: () => void;
}

/**
 * Body of a conditional edge's popover: the condition form (basic mode = one
 * value of the direct parent, advanced mode = free condition list, fallback
 * path, label). Every change is auto-saved to the edge data after a short
 * debounce.
 *
 * Mounted only while the popover is open. The form instance, the ancestor
 * field list and the sibling subscriptions are the heavy part of an edge: a
 * large flow holds hundreds of conditional edges, and keeping this out of
 * their default render is what keeps the canvas responsive.
 */
const ConditionalEdgePopoverContent = ({
  id,
  source,
  target,
  data,
  mode,
  onModeChange,
  onClose,
  onDelete,
}: ConditionalEdgePopoverContentProps) => {
  const { updateEdgeData } = useReactFlow();
  const availableParentFields = useAvailableParentFields(target);
  const directParent = availableParentFields.find((field) => field.nodeId === source) ?? availableParentFields[0];
  const t = useTranslate();
  // Data of the sibling edges (same `source`, different id) — `data` references
  // only change when a sibling is edited.
  const siblingData = useStore(
    useShallow((state) =>
      (getEdgeIndex(state.edges).outgoing.get(source) ?? [])
        .filter((edge) => edge.id !== id)
        .map((edge) => edge.data as ConditionalEdgeData | undefined),
    ),
  );

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
    siblingData.forEach((conditionalData) => {
      conditionalData?.conditions?.forEach((condition) => {
        if (condition.field === directParent.nodeId && condition.value) {
          present.add(condition.value);
        }
      });
    });
    return present;
  }, [siblingData, directParent]);

  const form = useForm({
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
  const { handleSubmit, reset, setFieldValue, Field } = form;

  // The auto-save above is debounced and the form only lives while the popover
  // is open: an edit made in the last 150 ms before closing would be lost with
  // the pending timer. Write the current values on unmount when they differ
  // from the saved ones.
  useEffect(
    () => () => {
      if (form.state.isDirty) {
        updateEdgeData(id, { ...form.state.values, configured: true });
      }
    },
    [form, id, updateEdgeData],
  );

  const handleClear = () => {
    reset({ conditions: [], isFallback: false, label: "" });
    updateEdgeData(id, { conditions: undefined, configured: undefined, isFallback: undefined, label: undefined });
  };

  const handleModeChange = (next: string) => {
    if (next === "basic" || next === "advanced") {
      onModeChange(next);
    }
  };

  const handleBasicValueChange = (nextValue: string) => {
    if (!directParent) {
      return;
    }
    setFieldValue("conditions", [{ field: directParent.nodeId, operator: "===", value: nextValue }]);
    setFieldValue("isFallback", false);
  };

  return (
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
                                const labelText = t(option.label);
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
                      <Label className={isFallback ? "tg:text-muted-foreground" : ""}>{t("editor.conditionalEdge.conditions")}</Label>

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
            <Button type="button" size="sm" variant="ghost" className="tg:text-destructive tg:hover:text-destructive" onClick={onDelete}>
              <Trash2 className="tg:mr-1 tg:h-4 tg:w-4" />
              {t("common.delete")}
            </Button>
            <div className="tg:ml-auto tg:flex tg:gap-2">
              <Button type="button" size="sm" variant="outline" onClick={handleClear}>
                <X className="tg:mr-1 tg:h-4 tg:w-4" />
                {t("common.clear")}
              </Button>
              <Button type="button" size="sm" onClick={onClose}>
                {t("common.close")}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </ScrollArea>
  );
};

export default ConditionalEdgePopoverContent;
