import { useForm } from "@tanstack/react-form";
import { Plus, Variable, X } from "lucide-react";
import { useState } from "react";
import SelectLanguage from "@/editor/features/TreegeEditor/inputs/SelectLanguage";
import useAvailableParentFields from "@/editor/hooks/useAvailableParentFields";
import useNodesSelection from "@/editor/hooks/useNodesSelection";
import useTranslate from "@/editor/hooks/useTranslate";
import { Button } from "@/shared/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/shared/components/ui/dropdown-menu";
import { FormDescription, FormItem } from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Switch } from "@/shared/components/ui/switch";
import { Textarea } from "@/shared/components/ui/textarea";
import { Language } from "@/shared/types/languages";
import { InputNodeData, SubmitConfig } from "@/shared/types/node";

const METHODS_NEEDING_BODY = ["POST", "PUT", "PATCH"];

interface SubmitConfigFormProps {
  value: SubmitConfig | undefined;
  onChange: (config: SubmitConfig | undefined) => void;
}

const SubmitConfigForm = ({ value, onChange }: SubmitConfigFormProps) => {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>("en");
  const { selectedNode } = useNodesSelection<InputNodeData>();
  const t = useTranslate();
  const availableParentFields = useAvailableParentFields(selectedNode?.id);

  const { handleSubmit, Field, Subscribe } = useForm({
    defaultValues: {
      body: value?.body || "",
      errorMessage: value?.errorMessage || { en: "" },
      headers: value?.headers || [],
      method: value?.method || "POST",
      redirectUrl: value?.redirectUrl || "",
      sendAllFormValues: !!value?.sendAllFormValues,
      showLoading: value?.showLoading !== false,
      successMessage: value?.successMessage || { en: "" },
      url: value?.url || "",
    } as SubmitConfig,
    listeners: {
      onChange: ({ formApi }) => {
        formApi.handleSubmit().then();
      },
      onChangeDebounceMs: 150,
    },
    onSubmit: ({ value: formValue }) => {
      onChange(formValue);
    },
  });

  return (
    <div>
      <div className="tg:grid tg:gap-6">
        <Field
          name="url"
          children={(field) => (
            <FormItem>
              <Label htmlFor={field.name}>{t("editor.submitConfigForm.apiUrl")}</Label>
              <div className="tg:flex tg:gap-2">
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={({ target }) => field.handleChange(target.value)}
                  placeholder={t("editor.submitConfigForm.apiUrlPlaceholder")}
                  className="tg:flex-1"
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="outline" size="icon">
                      <Variable className="tg:h-4 tg:w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {availableParentFields.length === 0 ? (
                      <DropdownMenuItem disabled>{t("editor.submitConfigForm.noFieldsAvailable")}</DropdownMenuItem>
                    ) : (
                      availableParentFields.map((availField) => (
                        <DropdownMenuItem
                          key={availField.nodeId}
                          onClick={() => {
                            const variable = `{{${availField.nodeId}}}`;
                            const currentValue = field.state.value || "";
                            field.handleChange(currentValue + variable);
                          }}
                        >
                          <div className="tg:flex tg:flex-col">
                            <span className="tg:font-medium">{availField.label}</span>
                            <span className="tg:text-muted-foreground tg:text-xs">{`{{${availField.nodeId}}}`}</span>
                          </div>
                        </DropdownMenuItem>
                      ))
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <FormDescription>{t("editor.submitConfigForm.apiUrlDesc")}</FormDescription>
            </FormItem>
          )}
        />

        <Field
          name="method"
          children={(field) => (
            <FormItem>
              <Label htmlFor={field.name}>{t("editor.submitConfigForm.httpMethod")}</Label>
              <Select
                value={field.state.value}
                onValueChange={(newValue: "POST" | "PUT" | "DELETE" | "PATCH") => field.handleChange(newValue)}
              >
                <SelectTrigger id={field.name}>
                  <SelectValue placeholder={t("editor.submitConfigForm.selectMethod")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="POST">{t("editor.submitConfigForm.methodPost")}</SelectItem>
                  <SelectItem value="PUT">{t("editor.submitConfigForm.methodPut")}</SelectItem>
                  <SelectItem value="DELETE">{t("editor.submitConfigForm.methodDelete")}</SelectItem>
                  <SelectItem value="PATCH">{t("editor.submitConfigForm.methodPatch")}</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        <div className="tg:space-y-4">
          <h4 className="tg:font-semibold tg:text-sm">{t("editor.submitConfigForm.headers")}</h4>
          <Field name="headers" mode="array">
            {(field) => (
              <div className="tg:space-y-2">
                {field.state.value?.map((_, index) => {
                  const key = `headers[${index}]`;

                  return (
                    <div key={key} className="tg:flex tg:items-start tg:gap-2">
                      <Field name={`headers[${index}].key`}>
                        {(subField) => (
                          <Input
                            placeholder={t("editor.submitConfigForm.headerName")}
                            value={subField.state.value || ""}
                            onChange={({ target }) => subField.handleChange(target.value)}
                          />
                        )}
                      </Field>

                      <Field name={`headers[${index}].value`}>
                        {(subField) => (
                          <Input
                            placeholder={t("editor.submitConfigForm.headerValue")}
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
                        }}
                      >
                        <X className="tg:h-4 tg:w-4" />
                      </Button>
                    </div>
                  );
                })}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    field.pushValue({ key: "", value: "" });
                  }}
                >
                  <Plus className="tg:mr-2 tg:h-4 tg:w-4" />
                  {t("editor.submitConfigForm.addHeader")}
                </Button>
              </div>
            )}
          </Field>
        </div>

        <Subscribe selector={(state) => ({ method: state.values.method, sendAllFormValues: state.values.sendAllFormValues })}>
          {({ method, sendAllFormValues }) =>
            METHODS_NEEDING_BODY.includes(method || "") && (
              <div className="tg:space-y-4">
                <Field name="sendAllFormValues">
                  {(field) => (
                    <div className="tg:flex tg:items-center tg:space-x-2">
                      <Switch id={field.name} checked={field.state.value} onCheckedChange={(newValue) => field.handleChange(newValue)} />
                      <Label htmlFor={field.name}>{t("editor.submitConfigForm.sendAllFormValues")}</Label>
                    </div>
                  )}
                </Field>

                <Field name="body">
                  {(field) => (
                    <FormItem>
                      <div className="tg:mb-2 tg:flex tg:items-center tg:justify-between">
                        <Label htmlFor={field.name}>{t("editor.submitConfigForm.requestBody")}</Label>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button type="button" variant="ghost" size="sm" disabled={sendAllFormValues}>
                              <Variable className="tg:mr-2 tg:h-4 tg:w-4" />
                              {t("editor.submitConfigForm.insertVariable")}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {availableParentFields.length === 0 ? (
                              <DropdownMenuItem disabled>{t("editor.submitConfigForm.noFieldsAvailable")}</DropdownMenuItem>
                            ) : (
                              availableParentFields.map((availField) => (
                                <DropdownMenuItem
                                  key={availField.nodeId}
                                  onClick={() => {
                                    const variable = `{{${availField.nodeId}}}`;
                                    const currentValue = field.state.value || "";
                                    field.handleChange(currentValue + variable);
                                    handleSubmit().then();
                                  }}
                                >
                                  <div className="tg:flex tg:flex-col">
                                    <span className="tg:font-medium">{availField.label}</span>
                                    <span className="tg:text-muted-foreground tg:text-xs">{`{{${availField.nodeId}}}`}</span>
                                  </div>
                                </DropdownMenuItem>
                              ))
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <Textarea
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={({ target }) => field.handleChange(target.value)}
                        placeholder={t("editor.submitConfigForm.requestBodyPlaceholder")}
                        rows={4}
                        disabled={sendAllFormValues}
                      />
                      <FormDescription>
                        {sendAllFormValues
                          ? t("editor.submitConfigForm.sendAllFormValuesDesc")
                          : t("editor.submitConfigForm.requestBodyDesc")}
                      </FormDescription>
                    </FormItem>
                  )}
                </Field>
              </div>
            )
          }
        </Subscribe>

        <div className="tg:space-y-4">
          <h4 className="tg:font-semibold tg:text-sm">{t("editor.submitConfigForm.postSubmission")}</h4>

          <Field
            name="redirectUrl"
            children={(field) => (
              <FormItem>
                <Label htmlFor={field.name}>{t("editor.submitConfigForm.redirectUrl")}</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={({ target }) => field.handleChange(target.value)}
                  placeholder={t("editor.submitConfigForm.redirectUrlPlaceholder")}
                />
                <FormDescription>{t("editor.submitConfigForm.redirectUrlDesc")}</FormDescription>
              </FormItem>
            )}
          />

          <div className="tg:flex tg:items-center tg:gap-2">
            <Field
              name="successMessage"
              children={(field) => (
                <FormItem className="tg:flex-1">
                  <Label htmlFor={field.name}>{t("editor.submitConfigForm.successMessage")}</Label>
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
                    placeholder={t("editor.submitConfigForm.successMessagePlaceholder")}
                  />
                  <FormDescription>{t("editor.submitConfigForm.successMessageDesc")}</FormDescription>
                </FormItem>
              )}
            />
            <SelectLanguage value={selectedLanguage} onValueChange={setSelectedLanguage} />
          </div>

          <div className="tg:flex tg:items-center tg:gap-2">
            <Field
              name="errorMessage"
              children={(field) => (
                <FormItem className="tg:flex-1">
                  <Label htmlFor={field.name}>{t("editor.submitConfigForm.errorMessage")}</Label>
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
                    placeholder={t("editor.submitConfigForm.errorMessagePlaceholder")}
                  />
                  <FormDescription>{t("editor.submitConfigForm.errorMessageDesc")}</FormDescription>
                </FormItem>
              )}
            />
            <SelectLanguage value={selectedLanguage} onValueChange={setSelectedLanguage} />
          </div>
        </div>

        <div className="tg:space-y-4">
          <h4 className="tg:font-semibold tg:text-sm">{t("editor.submitConfigForm.behavior")}</h4>

          <Field
            name="showLoading"
            children={(field) => (
              <div className="tg:flex tg:items-center tg:space-x-2">
                <Switch id={field.name} checked={field.state.value} onCheckedChange={(newValue) => field.handleChange(newValue)} />
                <Label htmlFor={field.name}>{t("editor.submitConfigForm.showLoadingState")}</Label>
              </div>
            )}
          />
        </div>
      </div>
    </div>
  );
};

export default SubmitConfigForm;
