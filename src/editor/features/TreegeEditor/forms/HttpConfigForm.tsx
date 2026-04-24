import { useForm } from "@tanstack/react-form";
import { Plus, Variable, X } from "lucide-react";
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
import { HttpConfig, InputNodeData } from "@/shared/types/node";

const METHODS_NEEDING_BODY = ["POST", "PUT", "PATCH"];

interface HttpConfigFormProps {
  value: HttpConfig | undefined;
  onChange: (config: HttpConfig | undefined) => void;
}

const HttpConfigForm = ({ value, onChange }: HttpConfigFormProps) => {
  const { selectedNode } = useNodesSelection<InputNodeData>();
  const t = useTranslate();
  const availableParentFields = useAvailableParentFields(selectedNode?.id);

  const { handleSubmit, Field, Subscribe } = useForm({
    defaultValues: {
      body: value?.body || "",
      fetchOnMount: value?.fetchOnMount ?? !value?.searchParam,
      headers: value?.headers || [],
      method: value?.method || "GET",
      responseMapping: value?.responseMapping || {
        labelField: "",
        valueField: "",
      },
      responsePath: value?.responsePath || "",
      searchParam: value?.searchParam || "",
      sendAllFormValues: !!value?.sendAllFormValues,
      showLoading: value?.showLoading !== false,
      url: value?.url || "",
    } as HttpConfig,
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
              <Label htmlFor={field.name}>{t("editor.httpConfigForm.apiUrl")}</Label>
              <div className="tg:flex tg:gap-2">
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={({ target }) => field.handleChange(target.value)}
                  placeholder={t("editor.httpConfigForm.apiUrlPlaceholder")}
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
                      <DropdownMenuItem disabled>{t("editor.httpConfigForm.noFieldsAvailable")}</DropdownMenuItem>
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
              <FormDescription>{t("editor.httpConfigForm.apiUrlDesc")}</FormDescription>
            </FormItem>
          )}
        />

        <Field
          name="method"
          children={(field) => (
            <FormItem>
              <Label htmlFor={field.name}>{t("editor.httpConfigForm.httpMethod")}</Label>
              <Select
                value={field.state.value}
                onValueChange={(newValue: "GET" | "POST" | "PUT" | "DELETE" | "PATCH") => field.handleChange(newValue)}
              >
                <SelectTrigger id={field.name}>
                  <SelectValue placeholder={t("editor.httpConfigForm.selectMethod")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">{t("editor.httpConfigForm.methodGet")}</SelectItem>
                  <SelectItem value="POST">{t("editor.httpConfigForm.methodPost")}</SelectItem>
                  <SelectItem value="PUT">{t("editor.httpConfigForm.methodPut")}</SelectItem>
                  <SelectItem value="DELETE">{t("editor.httpConfigForm.methodDelete")}</SelectItem>
                  <SelectItem value="PATCH">{t("editor.httpConfigForm.methodPatch")}</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        <div className="tg:space-y-4">
          <h4 className="tg:font-semibold tg:text-sm">{t("editor.httpConfigForm.headers")}</h4>
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
                            placeholder={t("editor.httpConfigForm.headerName")}
                            value={subField.state.value || ""}
                            onChange={({ target }) => subField.handleChange(target.value)}
                          />
                        )}
                      </Field>

                      <Field name={`headers[${index}].value`}>
                        {(subField) => (
                          <Input
                            placeholder={t("editor.httpConfigForm.headerValue")}
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
                  {t("editor.httpConfigForm.addHeader")}
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
                      <Label htmlFor={field.name}>{t("editor.httpConfigForm.sendAllFormValues")}</Label>
                    </div>
                  )}
                </Field>

                <Field name="body">
                  {(field) => (
                    <FormItem>
                      <div className="tg:mb-2 tg:flex tg:items-center tg:justify-between">
                        <Label htmlFor={field.name}>{t("editor.httpConfigForm.requestBody")}</Label>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button type="button" variant="ghost" size="sm" disabled={sendAllFormValues}>
                              <Variable className="tg:mr-2 tg:h-4 tg:w-4" />
                              {t("editor.httpConfigForm.insertVariable")}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {availableParentFields.length === 0 ? (
                              <DropdownMenuItem disabled>{t("editor.httpConfigForm.noFieldsAvailable")}</DropdownMenuItem>
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
                        placeholder={t("editor.httpConfigForm.requestBodyPlaceholder")}
                        rows={4}
                        disabled={sendAllFormValues}
                      />
                      <FormDescription>
                        {sendAllFormValues ? t("editor.httpConfigForm.sendAllFormValuesDesc") : t("editor.httpConfigForm.requestBodyDesc")}
                      </FormDescription>
                    </FormItem>
                  )}
                </Field>
              </div>
            )
          }
        </Subscribe>

        <div className="tg:space-y-4">
          <h4 className="tg:font-semibold tg:text-sm">{t("editor.httpConfigForm.responseConfiguration")}</h4>

          <Field
            name="responsePath"
            children={(field) => (
              <FormItem>
                <Label htmlFor={field.name}>{t("editor.httpConfigForm.responsePath")}</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={({ target }) => field.handleChange(target.value)}
                  placeholder={t("editor.httpConfigForm.responsePathPlaceholder")}
                />
                <FormDescription>{t("editor.httpConfigForm.responsePathDesc")}</FormDescription>
              </FormItem>
            )}
          />

          <div className="tg:space-y-4">
            <h5 className="tg:font-medium tg:text-sm">{t("editor.httpConfigForm.mapToOptions")}</h5>

            <Field
              name="responseMapping.valueField"
              children={(field) => (
                <FormItem>
                  <Label htmlFor={field.name}>{t("editor.httpConfigForm.valueField")}</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={({ target }) => field.handleChange(target.value)}
                    placeholder={t("editor.httpConfigForm.valueFieldPlaceholder")}
                  />
                  <FormDescription>{t("editor.httpConfigForm.valueFieldDesc")}</FormDescription>
                </FormItem>
              )}
            />

            <Field
              name="responseMapping.labelField"
              children={(field) => (
                <FormItem>
                  <Label htmlFor={field.name}>{t("editor.httpConfigForm.labelField")}</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={({ target }) => field.handleChange(target.value)}
                    placeholder={t("editor.httpConfigForm.labelFieldPlaceholder")}
                  />
                  <FormDescription>{t("editor.httpConfigForm.labelFieldDesc")}</FormDescription>
                </FormItem>
              )}
            />
          </div>

          <Field
            name="searchParam"
            children={(field) => (
              <FormItem>
                <Label htmlFor={field.name}>{t("editor.httpConfigForm.searchParameter")}</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={({ target }) => field.handleChange(target.value)}
                  placeholder={t("editor.httpConfigForm.searchParameterPlaceholder")}
                />
                <FormDescription>{t("editor.httpConfigForm.searchParameterDesc")}</FormDescription>
              </FormItem>
            )}
          />
        </div>

        <div className="tg:space-y-4">
          <h4 className="tg:font-semibold tg:text-sm">{t("editor.httpConfigForm.behavior")}</h4>

          <Subscribe selector={(state) => state.values.searchParam}>
            {(searchParam) => (
              <Field name="fetchOnMount">
                {(field) => {
                  const hasSearchParam = Boolean(searchParam?.trim());
                  const isChecked = hasSearchParam ? field.state.value : true;

                  // Auto-set fetchOnMount to true when searchParam is empty
                  if (!hasSearchParam && field.state.value !== true) {
                    field.handleChange(true);
                  }

                  return (
                    <div className="tg:flex tg:items-center tg:space-x-2">
                      <Switch
                        id={field.name}
                        checked={isChecked}
                        disabled={!hasSearchParam}
                        onCheckedChange={(newValue) => field.handleChange(newValue)}
                      />
                      <Label htmlFor={field.name} className={hasSearchParam ? "" : "tg:text-muted-foreground"}>
                        {t("editor.httpConfigForm.fetchOnMount")}
                      </Label>
                    </div>
                  );
                }}
              </Field>
            )}
          </Subscribe>

          <Field
            name="showLoading"
            children={(field) => (
              <div className="tg:flex tg:items-center tg:space-x-2">
                <Switch id={field.name} checked={field.state.value} onCheckedChange={(newValue) => field.handleChange(newValue)} />
                <Label htmlFor={field.name}>{t("editor.httpConfigForm.showLoadingState")}</Label>
              </div>
            )}
          />
        </div>
      </div>
    </div>
  );
};

export default HttpConfigForm;
