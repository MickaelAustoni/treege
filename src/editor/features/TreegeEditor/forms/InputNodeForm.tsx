import { useForm } from "@tanstack/react-form";
import { ChevronsUpDown, Plus, X } from "lucide-react";
import { useState } from "react";
import HttpConfigForm from "@/editor/features/TreegeEditor/forms/HttpConfigForm";
import SubmitConfigForm from "@/editor/features/TreegeEditor/forms/SubmitConfigForm";
import ComboboxPattern from "@/editor/features/TreegeEditor/inputs/ComboboxPattern";
import OptionImageField from "@/editor/features/TreegeEditor/inputs/OptionImageField";
import SelectInputType from "@/editor/features/TreegeEditor/inputs/SelectInputType";
import SelectLanguage from "@/editor/features/TreegeEditor/inputs/SelectLanguage";
import useAvailableParentFields from "@/editor/hooks/useAvailableParentFields";
import useFlowActions from "@/editor/hooks/useFlowActions";
import useNodesSelection from "@/editor/hooks/useNodesSelection";
import useTranslate from "@/editor/hooks/useTranslate";
import { Button } from "@/shared/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/shared/components/ui/collapsible";
import { FormDescription, FormItem } from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Switch } from "@/shared/components/ui/switch";
import { Language } from "@/shared/types/languages";
import { InputNodeData } from "@/shared/types/node";

const InputNodeForm = () => {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>("en");
  const { selectedNode } = useNodesSelection<InputNodeData>();
  const { updateSelectedNodeData } = useFlowActions();
  const needsOptions = ["select", "radio", "autocomplete", "checkbox"].includes(selectedNode?.data?.type || "");
  const availableParentFields = useAvailableParentFields(selectedNode?.id);
  const t = useTranslate();
  const isSubmitType = selectedNode?.data?.type === "submit";

  const { handleSubmit, Field } = useForm({
    defaultValues: {
      defaultValue: selectedNode?.data?.defaultValue,
      disablePast: selectedNode?.data?.disablePast,
      errorMessage: selectedNode?.data?.errorMessage || { en: "" },
      helperText: selectedNode?.data?.helperText || { en: "" },
      httpConfig: selectedNode?.data?.httpConfig,
      label: selectedNode?.data?.label || { en: "" },
      multiple: selectedNode?.data?.multiple,
      name: selectedNode?.data?.name || "",
      options: selectedNode?.data?.options || [],
      pattern: selectedNode?.data?.pattern || "",
      placeholder: selectedNode?.data?.placeholder || { en: "" },
      required: selectedNode?.data?.required,
      submitConfig: selectedNode?.data?.submitConfig,
      type: selectedNode?.data?.type || "",
      variant: selectedNode?.data?.variant || "default",
    } as InputNodeData,
    listeners: {
      onChange: ({ formApi }) => {
        formApi.handleSubmit().then();
      },
      onChangeDebounceMs: 150,
    },
    onSubmit: ({ value }) => {
      updateSelectedNodeData(value);
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {/* Type */}
      <div className="grid gap-6">
        <Field
          name="type"
          children={(field) => (
            <FormItem>
              <SelectInputType value={field.state.value} onValueChange={(newValue) => field.handleChange(newValue)} />
            </FormItem>
          )}
        />

        {/* Label */}
        <div className="flex items-end gap-2">
          <Field
            name="label"
            children={(field) => (
              <FormItem className="flex-1">
                <Label htmlFor={field.name}>{t("editor.inputNodeForm.label")}</Label>
                <Input
                  autoFocus
                  id={field.name}
                  name={field.name}
                  value={field.state.value?.[selectedLanguage] || ""}
                  onBlur={field.handleBlur}
                  onChange={({ target }) => {
                    field.handleChange({
                      ...(typeof field.state.value === "object" && field.state.value !== null ? field.state.value : {}),
                      [selectedLanguage]: target.value,
                    });
                  }}
                />
              </FormItem>
            )}
          />
          <SelectLanguage value={selectedLanguage} onValueChange={setSelectedLanguage} />
        </div>

        {/* Placeholder */}
        {!isSubmitType && selectedNode?.data?.type !== "file" && (
          <div className="flex items-end gap-2">
            <Field
              name="placeholder"
              children={(field) => (
                <FormItem className="flex-1">
                  <Label htmlFor={field.name}>{t("editor.inputNodeForm.placeholder")}</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value?.[selectedLanguage] || ""}
                    onBlur={field.handleBlur}
                    onChange={({ target }) => {
                      field.handleChange({
                        ...(typeof field.state.value === "object" && field.state.value !== null ? field.state.value : {}),
                        [selectedLanguage]: target.value,
                      });
                    }}
                  />
                </FormItem>
              )}
            />
            <SelectLanguage value={selectedLanguage} onValueChange={setSelectedLanguage} />
          </div>
        )}

        {/* Helper text */}
        {!isSubmitType && (
          <div className="flex items-end gap-2">
            <Field
              name="helperText"
              children={(field) => (
                <FormItem className="flex-1">
                  <Label htmlFor={field.name}>{t("editor.inputNodeForm.helperText")}</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value?.[selectedLanguage] || ""}
                    onBlur={field.handleBlur}
                    onChange={({ target }) => {
                      field.handleChange({
                        ...(typeof field.state.value === "object" && field.state.value !== null ? field.state.value : {}),
                        [selectedLanguage]: target.value,
                      });
                    }}
                  />
                </FormItem>
              )}
            />
            <SelectLanguage value={selectedLanguage} onValueChange={setSelectedLanguage} />
          </div>
        )}

        {/* HTTP config */}
        {selectedNode?.data?.type === "http" && (
          <Collapsible defaultOpen className="flex w-full max-w-[350px] flex-col gap-2">
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between gap-4">
                <h4 className="font-semibold text-sm">{t("editor.inputNodeForm.httpConfiguration")}</h4>
                <Button variant="ghost" size="icon" className="size-8">
                  <ChevronsUpDown />
                  <span className="sr-only">{t("common.toggle")}</span>
                </Button>
              </div>
            </CollapsibleTrigger>

            <CollapsibleContent className="flex flex-col gap-4">
              <Field name="httpConfig">
                {(field) => (
                  <HttpConfigForm
                    value={field.state.value}
                    onChange={(newConfig) => {
                      field.handleChange(newConfig);
                      handleSubmit().then();
                    }}
                  />
                )}
              </Field>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Submit config */}
        {isSubmitType && (
          <Collapsible className="flex w-full max-w-[350px] flex-col gap-2">
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between gap-4">
                <h4 className="font-semibold text-sm">{t("editor.inputNodeForm.submitConfiguration")}</h4>
                <Button variant="ghost" size="icon" className="size-8">
                  <ChevronsUpDown />
                  <span className="sr-only">{t("common.toggle")}</span>
                </Button>
              </div>
            </CollapsibleTrigger>

            <CollapsibleContent className="flex flex-col gap-4">
              <Field name="submitConfig">
                {(field) => (
                  <SubmitConfigForm
                    value={field.state.value}
                    onChange={(newConfig) => {
                      field.handleChange(newConfig);
                      handleSubmit().then();
                    }}
                  />
                )}
              </Field>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Multiple */}
        {selectedNode?.data?.type === "file" && (
          <Field
            name="multiple"
            children={(field) => (
              <div className="flex items-center space-x-2">
                <Switch id={field.name} checked={field.state.value} onCheckedChange={(newValue) => field.handleChange(newValue)} />
                <Label htmlFor={field.name}>{t("editor.inputNodeForm.multipleFiles")}</Label>
              </div>
            )}
          />
        )}

        {/* Options */}
        {needsOptions && (
          <Collapsible defaultOpen className="flex w-full max-w-[350px] flex-col gap-2">
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between gap-4">
                <h4 className="font-semibold text-sm">{t("editor.inputNodeForm.options")}</h4>
                <Button variant="ghost" size="icon" className="size-8">
                  <ChevronsUpDown />
                  <span className="sr-only">{t("common.toggle")}</span>
                </Button>
              </div>
            </CollapsibleTrigger>

            <CollapsibleContent className="flex flex-col gap-4">
              <Field name="options" mode="array">
                {(field) => (
                  <div className="space-y-2">
                    {field.state.value?.map((_, index) => {
                      const key = `options[${index}]`;

                      return (
                        <div key={key} className="flex flex-col gap-2">
                          <div className="flex items-start gap-2">
                            {selectedNode?.data?.type === "radio" && (
                              <Field name={`options[${index}].image`}>
                                {(subField) => (
                                  <OptionImageField value={subField.state.value} onChange={(newValue) => subField.handleChange(newValue)} />
                                )}
                              </Field>
                            )}

                            <Field name={`options[${index}].label`}>
                              {(subField) => (
                                <Input
                                  placeholder={t("editor.inputNodeForm.optionLabel")}
                                  value={subField.state.value?.[selectedLanguage] || ""}
                                  onChange={({ target }) => {
                                    subField.handleChange({
                                      ...(typeof subField.state.value === "object" && subField.state.value !== null
                                        ? subField.state.value
                                        : {}),
                                      [selectedLanguage]: target.value,
                                    });
                                  }}
                                />
                              )}
                            </Field>

                            <Field name={`options[${index}].value`}>
                              {(subField) => (
                                <Input
                                  placeholder={t("editor.inputNodeForm.optionValue")}
                                  value={subField.state.value || ""}
                                  onChange={({ target }) => subField.handleChange(target.value)}
                                />
                              )}
                            </Field>

                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                field.removeValue(index);
                                handleSubmit().then();
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>

                          <Field name={`options[${index}].description`}>
                            {(subField) => (
                              <Input
                                placeholder={t("editor.inputNodeForm.optionDescription")}
                                value={
                                  (subField.state.value as { [key: string]: string | undefined } | undefined)?.[selectedLanguage] || ""
                                }
                                onChange={({ target }) => {
                                  subField.handleChange({
                                    ...(typeof subField.state.value === "object" && subField.state.value !== null
                                      ? subField.state.value
                                      : {}),
                                    [selectedLanguage]: target.value,
                                  } as never);
                                }}
                              />
                            )}
                          </Field>
                        </div>
                      );
                    })}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        field.pushValue({ label: { en: "" }, value: "" });
                        handleSubmit().then();
                      }}
                    >
                      {t("editor.inputNodeForm.addOption")}
                    </Button>
                  </div>
                )}
              </Field>

              {selectedNode?.data?.type === "select" && (
                <Field
                  name="multiple"
                  children={(field) => (
                    <div className="flex items-center space-x-2">
                      <Switch id={field.name} checked={field.state.value} onCheckedChange={(newValue) => field.handleChange(newValue)} />
                      <Label htmlFor={field.name}>{t("editor.inputNodeForm.multipleSelection")}</Label>
                    </div>
                  )}
                />
              )}

              {selectedNode?.data?.type === "radio" && (
                <Field
                  name="variant"
                  children={(field) => (
                    <FormItem>
                      <Label htmlFor={field.name}>{t("editor.inputNodeForm.variant")}</Label>
                      <Select
                        value={(field.state.value as string) || "default"}
                        onValueChange={(newValue) => field.handleChange(newValue as never)}
                      >
                        <SelectTrigger id={field.name} className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">{t("editor.inputNodeForm.variantDefault")}</SelectItem>
                          <SelectItem value="card">{t("editor.inputNodeForm.variantCard")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              )}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Validation */}
        {!isSubmitType && (
          <Collapsible className="flex w-full max-w-[350px] flex-col gap-2">
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between gap-4">
                <h4 className="font-semibold text-sm">{t("editor.inputNodeForm.validation")}</h4>
                <Button variant="ghost" size="icon" className="size-8">
                  <ChevronsUpDown />
                  <span className="sr-only">{t("common.toggle")}</span>
                </Button>
              </div>
            </CollapsibleTrigger>

            <CollapsibleContent className="flex flex-col gap-6">
              <Field
                name="required"
                children={(field) => (
                  <FormItem>
                    <div className="flex items-center space-x-2">
                      <Switch id={field.name} checked={field.state.value} onCheckedChange={(newValue) => field.handleChange(newValue)} />
                      <Label htmlFor={field.name}>{t("editor.inputNodeForm.required")}</Label>
                    </div>
                  </FormItem>
                )}
              />

              {(selectedNode?.data?.type === "date" || selectedNode?.data?.type === "daterange") && (
                <Field
                  name="disablePast"
                  children={(field) => (
                    <FormItem>
                      <div className="flex items-center space-x-2">
                        <Switch id={field.name} checked={field.state.value} onCheckedChange={(newValue) => field.handleChange(newValue)} />
                        <Label htmlFor={field.name}>{t("editor.inputNodeForm.disablePast")}</Label>
                      </div>
                    </FormItem>
                  )}
                />
              )}

              <Field
                name="pattern"
                children={(field) => (
                  <FormItem>
                    <Label htmlFor={field.name}>{t("editor.inputNodeForm.pattern")}</Label>
                    <ComboboxPattern id={field.name} value={field.state.value} onValueChange={field.handleChange} />
                  </FormItem>
                )}
              />

              <div className="flex items-end gap-2">
                <Field
                  name="errorMessage"
                  children={(field) => (
                    <FormItem className="flex-1">
                      <Label htmlFor={field.name}>{t("editor.inputNodeForm.errorMessage")}</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value?.[selectedLanguage] || ""}
                        onBlur={field.handleBlur}
                        onChange={({ target }) => {
                          field.handleChange({
                            ...(typeof field.state.value === "object" && field.state.value !== null ? field.state.value : {}),
                            [selectedLanguage]: target.value,
                          });
                        }}
                      />
                    </FormItem>
                  )}
                />
                <SelectLanguage value={selectedLanguage} onValueChange={setSelectedLanguage} />
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Advanced config */}
        {!isSubmitType && (
          <Collapsible className="flex w-full max-w-[350px] flex-col gap-2">
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between gap-4">
                <h4 className="font-semibold text-sm">{t("editor.inputNodeForm.advancedConfiguration")}</h4>
                <Button variant="ghost" size="icon" className="size-8">
                  <ChevronsUpDown />
                  <span className="sr-only">{t("common.toggle")}</span>
                </Button>
              </div>
            </CollapsibleTrigger>

            <CollapsibleContent className="flex flex-col gap-6">
              <Field
                name="name"
                children={(field) => (
                  <FormItem>
                    <Label htmlFor={field.name}>{t("editor.inputNodeForm.name")}</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={({ target }) => field.handleChange(target.value)}
                    />
                    <FormDescription>{t("editor.inputNodeForm.nameDescription")}</FormDescription>
                  </FormItem>
                )}
              />

              <Field name="defaultValue">
                {(defaultValueField) => (
                  <>
                    <FormItem>
                      <Label htmlFor={defaultValueField.name}>{t("editor.inputNodeForm.defaultValueType")}</Label>
                      <Select
                        value={defaultValueField.state.value?.type || "none"}
                        onValueChange={(value: "none" | "static" | "reference") => {
                          defaultValueField.handleChange(value === "none" ? null : { type: value });
                        }}
                      >
                        <SelectTrigger id={defaultValueField.name}>
                          <SelectValue placeholder={t("editor.inputNodeForm.selectType")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">{t("editor.inputNodeForm.defaultValueTypeNone")}</SelectItem>
                          <SelectItem value="static">{t("editor.inputNodeForm.defaultValueTypeStatic")}</SelectItem>
                          <SelectItem value="reference">{t("editor.inputNodeForm.defaultValueTypeReference")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>

                    {defaultValueField.state.value?.type === "static" && (
                      <Field name="defaultValue.staticValue">
                        {(field) => {
                          const inputType = selectedNode?.data?.type;

                          // Checkbox or select with multiple selection - show comma-separated input
                          if ((inputType === "select" || inputType === "checkbox") && selectedNode?.data?.multiple) {
                            return (
                              <FormItem>
                                <Label htmlFor={field.name}>{t("editor.inputNodeForm.defaultValuesCommaSeparated")}</Label>
                                <Input
                                  id={field.name}
                                  placeholder={t("editor.inputNodeForm.defaultValuesPlaceholder")}
                                  value={Array.isArray(field.state.value) ? field.state.value.join(", ") : ""}
                                  onChange={({ target }) => {
                                    const values = target.value
                                      .split(",")
                                      .map((v: string) => v.trim())
                                      .filter(Boolean);
                                    field.handleChange(values.length > 0 ? values : null);
                                  }}
                                />
                              </FormItem>
                            );
                          }

                          // Single checkbox - show switch
                          if (inputType === "checkbox") {
                            return (
                              <FormItem>
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    id={field.name}
                                    checked={!!field.state.value}
                                    onCheckedChange={(value: boolean) => field.handleChange(value)}
                                  />
                                  <Label htmlFor={field.name}>{t("editor.inputNodeForm.defaultChecked")}</Label>
                                </div>
                              </FormItem>
                            );
                          }

                          // Default - show text input
                          return (
                            <FormItem>
                              <Label htmlFor={field.name}>{t("editor.inputNodeForm.staticValue")}</Label>
                              <Input
                                id={field.name}
                                placeholder={t("editor.inputNodeForm.staticValuePlaceholder")}
                                value={typeof field.state.value === "string" ? field.state.value : ""}
                                onChange={({ target }) => field.handleChange(target.value || "")}
                              />
                            </FormItem>
                          );
                        }}
                      </Field>
                    )}

                    {defaultValueField.state.value?.type === "reference" && (
                      <>
                        <Field name="defaultValue.referenceField">
                          {(field) => (
                            <FormItem>
                              <Label htmlFor={field.name}>{t("editor.inputNodeForm.referenceField")}</Label>
                              <Select
                                value={field.state.value || ""}
                                onValueChange={(value) => {
                                  field.handleChange(value);
                                }}
                              >
                                <SelectTrigger id={field.name}>
                                  <SelectValue placeholder={t("editor.inputNodeForm.selectReferenceField")} />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableParentFields.length === 0 ? (
                                    <SelectItem value="none" disabled>
                                      {t("editor.inputNodeForm.noParentFieldsAvailable")}
                                    </SelectItem>
                                  ) : (
                                    availableParentFields.map((availField) => (
                                      <SelectItem key={availField.nodeId} value={availField.nodeId}>
                                        {availField.label} ({availField.type})
                                      </SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
                              {availableParentFields.length === 0 && (
                                <FormDescription>{t("editor.inputNodeForm.addInputFieldsBeforeReference")}</FormDescription>
                              )}
                            </FormItem>
                          )}
                        </Field>

                        <Field name="defaultValue.transformFunction">
                          {(field) => (
                            <FormItem>
                              <Label htmlFor={field.name}>{t("editor.inputNodeForm.transformType")}</Label>
                              <Select
                                value={field.state.value || "none"}
                                onValueChange={(value: "none" | "toString" | "toNumber" | "toBoolean" | "toArray" | "toObject") => {
                                  const newValue = value === "none" ? null : value;
                                  field.handleChange(newValue);

                                  // Initialize objectMapping when selecting toObject
                                  if (value === "toObject") {
                                    const currentDefaultValue = defaultValueField.state.value;

                                    defaultValueField.handleChange({
                                      ...currentDefaultValue,
                                      objectMapping: [],
                                    });
                                  }
                                }}
                              >
                                <SelectTrigger id={field.name}>
                                  <SelectValue placeholder={t("editor.inputNodeForm.selectTransformation")} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">{t("editor.inputNodeForm.transformNone")}</SelectItem>
                                  <SelectItem value="toString">{t("editor.inputNodeForm.transformString")}</SelectItem>
                                  <SelectItem value="toNumber">{t("editor.inputNodeForm.transformNumber")}</SelectItem>
                                  <SelectItem value="toBoolean">{t("editor.inputNodeForm.transformBoolean")}</SelectItem>
                                  <SelectItem value="toArray">{t("editor.inputNodeForm.transformArray")}</SelectItem>
                                  <SelectItem value="toObject">{t("editor.inputNodeForm.transformMapToObject")}</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>{t("editor.inputNodeForm.transformDesc")}</FormDescription>
                            </FormItem>
                          )}
                        </Field>

                        {defaultValueField.state.value?.transformFunction === "toObject" && (
                          <Field name="defaultValue.objectMapping" mode="array">
                            {(mappingField) => (
                              <FormItem>
                                <Label>{t("editor.inputNodeForm.objectMapping")}</Label>
                                <div className="space-y-2">
                                  {mappingField.state.value?.map((_, index) => (
                                    <div key={`mapping-${index}`} className="flex items-center gap-2">
                                      <Field name={`defaultValue.objectMapping[${index}].sourceKey`}>
                                        {(sourceField) => (
                                          <Input
                                            placeholder={t("editor.inputNodeForm.sourceKey")}
                                            value={sourceField.state.value || ""}
                                            onChange={({ target }) => sourceField.handleChange(target.value)}
                                          />
                                        )}
                                      </Field>

                                      <span className="text-muted-foreground">→</span>

                                      <Field name={`defaultValue.objectMapping[${index}].targetKey`}>
                                        {(targetField) => (
                                          <Input
                                            placeholder={t("editor.inputNodeForm.targetKey")}
                                            value={targetField.state.value || ""}
                                            onChange={({ target }) => targetField.handleChange(target.value)}
                                          />
                                        )}
                                      </Field>

                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                          mappingField.removeValue(index);
                                          handleSubmit().then();
                                        }}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ))}

                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                    onClick={() => {
                                      mappingField.pushValue({ sourceKey: "", targetKey: "" });
                                      handleSubmit().then();
                                    }}
                                  >
                                    <Plus className="mr-2 h-4 w-4" />
                                    {t("editor.inputNodeForm.addMapping")}
                                  </Button>
                                </div>
                                <FormDescription>{t("editor.inputNodeForm.objectMappingDesc")}</FormDescription>
                              </FormItem>
                            )}
                          </Field>
                        )}
                      </>
                    )}
                  </>
                )}
              </Field>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </form>
  );
};

export default InputNodeForm;
