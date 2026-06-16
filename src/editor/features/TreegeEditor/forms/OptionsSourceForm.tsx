import { Plus, X } from "lucide-react";
import JsonTemplateEditor from "@/editor/features/TreegeEditor/forms/JsonTemplateEditor";
import OptionsMappingFields from "@/editor/features/TreegeEditor/forms/OptionsMappingFields";
import SensitiveHeaderWarning from "@/editor/features/TreegeEditor/forms/SensitiveHeaderWarning";
import ApiUrlCombobox from "@/editor/features/TreegeEditor/inputs/ApiUrlCombobox";
import useAvailableParentFields from "@/editor/hooks/useAvailableParentFields";
import { useKeyValueRows } from "@/editor/hooks/useKeyValueRows";
import useNodesSelection from "@/editor/hooks/useNodesSelection";
import useTranslate from "@/editor/hooks/useTranslate";
import { Button } from "@/shared/components/ui/button";
import { FormItem } from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/shared/components/ui/toggle-group";
import { InputNodeData, OptionsSource, OptionsSourceMapping } from "@/shared/types/node";

const METHODS_NEEDING_BODY = ["POST", "PUT", "PATCH"];
const HTTP_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"] as const;
type HttpMethod = (typeof HTTP_METHODS)[number];

interface OptionsSourceFormProps {
  value: OptionsSource | undefined;
  onChange: (value: OptionsSource | undefined) => void;
}

const OptionsSourceForm = ({ value, onChange }: OptionsSourceFormProps) => {
  const { selectedNode } = useNodesSelection<InputNodeData>();
  const t = useTranslate();
  const availableParentFields = useAvailableParentFields(selectedNode?.id);
  const url = value?.url ?? "";
  const method = value?.method ?? "GET";
  const body = value?.body ?? "";
  const responsePath = value?.responsePath ?? "";
  const mapping = value?.mapping;
  const mode: "static" | "api" = value ? "api" : "static";

  const update = (patch: Partial<OptionsSource>) => {
    onChange({ ...(value ?? {}), ...patch });
  };

  const [headerRows, setHeaderRows] = useKeyValueRows(value?.headers, (headers) => update({ headers }));
  const [queryParamRows, setQueryParamRows] = useKeyValueRows(value?.queryParams, (queryParams) => update({ queryParams }));

  const updateMapping = (patch: Partial<OptionsSourceMapping>) => {
    const next = { ...(mapping ?? { labelField: "", valueField: "" }), ...patch };
    update({ mapping: next });
  };

  const handleModeChange = (next: string) => {
    // Radix returns "" when the user clicks the active item. Ignore — we want
    // the toggle to behave like a tab strip (always one selected).
    if (!next || next === mode) {
      return;
    }
    if (next === "api") {
      onChange({ mapping: { labelField: "", valueField: "" }, method: "GET" });
    } else {
      onChange(undefined);
    }
  };

  return (
    <div className="tg:flex tg:flex-col tg:gap-4">
      <ToggleGroup type="single" variant="outline" size="sm" value={mode} onValueChange={handleModeChange}>
        <ToggleGroupItem value="static" aria-label={t("editor.optionsSourceForm.staticOptions")}>
          {t("editor.optionsSourceForm.staticOptions")}
        </ToggleGroupItem>
        <ToggleGroupItem value="api" aria-label={t("editor.optionsSourceForm.enable")}>
          {t("editor.optionsSourceForm.enable")}
        </ToggleGroupItem>
      </ToggleGroup>

      <p className="tg:text-muted-foreground tg:text-xs">
        {mode === "static" ? t("editor.optionsSourceForm.staticOptionsHint") : t("editor.optionsSourceForm.dynamicHint")}
      </p>

      {mode === "static" ? null : (
        <>
          <FormItem>
            <Label className="tg:text-xs">{t("editor.httpConfigForm.apiUrl")}</Label>
            <ApiUrlCombobox
              value={url}
              onChange={(nextUrl, nextMethod) => update(nextMethod ? { method: nextMethod, url: nextUrl } : { url: nextUrl })}
              placeholder={t("editor.httpConfigForm.apiUrlPlaceholder")}
            />
          </FormItem>

          <FormItem>
            <Label className="tg:text-xs">{t("editor.httpConfigForm.httpMethod")}</Label>
            <Select value={method} onValueChange={(next) => update({ method: next as HttpMethod })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HTTP_METHODS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormItem>

          <div className="tg:flex tg:flex-col tg:gap-2">
            <Label className="tg:text-xs">{t("editor.httpConfigForm.headers")}</Label>
            {headerRows.map((header, index) => (
              <div key={index} className="tg:flex tg:items-center tg:gap-2">
                <Input
                  value={header.key}
                  placeholder={t("editor.httpConfigForm.headerName")}
                  onChange={({ target }) => {
                    const next = [...headerRows];
                    next[index] = { ...next[index], key: target.value };
                    setHeaderRows(next);
                  }}
                />
                <Input
                  value={header.value}
                  placeholder={t("editor.httpConfigForm.headerValue")}
                  onChange={({ target }) => {
                    const next = [...headerRows];
                    next[index] = { ...next[index], value: target.value };
                    setHeaderRows(next);
                  }}
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => setHeaderRows(headerRows.filter((_, i) => i !== index))}>
                  <X className="tg:h-4 tg:w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="tg:w-fit"
              onClick={() => setHeaderRows([...headerRows, { key: "", value: "" }])}
            >
              <Plus className="tg:mr-2 tg:h-4 tg:w-4" />
              {t("editor.httpConfigForm.addHeader")}
            </Button>
            <SensitiveHeaderWarning headers={headerRows} />
          </div>

          <div className="tg:flex tg:flex-col tg:gap-2">
            <Label className="tg:text-xs">{t("editor.httpConfigForm.queryParams")}</Label>
            {queryParamRows.map((param, index) => (
              <div key={index} className="tg:flex tg:items-center tg:gap-2">
                <Input
                  value={param.key}
                  placeholder={t("editor.httpConfigForm.queryParamName")}
                  onChange={({ target }) => {
                    const next = [...queryParamRows];
                    next[index] = { ...next[index], key: target.value };
                    setQueryParamRows(next);
                  }}
                />
                <Input
                  value={param.value}
                  placeholder={t("editor.httpConfigForm.queryParamValue")}
                  onChange={({ target }) => {
                    const next = [...queryParamRows];
                    next[index] = { ...next[index], value: target.value };
                    setQueryParamRows(next);
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setQueryParamRows(queryParamRows.filter((_, i) => i !== index))}
                >
                  <X className="tg:h-4 tg:w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="tg:w-fit"
              onClick={() => setQueryParamRows([...queryParamRows, { key: "", value: "" }])}
            >
              <Plus className="tg:mr-2 tg:h-4 tg:w-4" />
              {t("editor.httpConfigForm.addQueryParam")}
            </Button>
          </div>

          {METHODS_NEEDING_BODY.includes(method) && (
            <FormItem>
              <Label className="tg:text-xs">{t("editor.httpConfigForm.requestBody")}</Label>
              <JsonTemplateEditor value={body} onChange={(next) => update({ body: next })} fields={availableParentFields} />
            </FormItem>
          )}

          <FormItem>
            <Label className="tg:text-xs">{t("editor.optionsSourceForm.responsePath")}</Label>
            <Input
              value={responsePath}
              placeholder={t("editor.optionsSourceForm.responsePathPlaceholder")}
              onChange={({ target }) => update({ responsePath: target.value || undefined })}
            />
            <p className="tg:text-muted-foreground tg:text-xs">{t("editor.optionsSourceForm.responsePathHint")}</p>
          </FormItem>

          <OptionsMappingFields
            request={{ body, headers: value?.headers, method, queryParams: value?.queryParams, responsePath, url }}
            mapping={mapping ?? {}}
            onMappingChange={updateMapping}
            showOptionalFields
          />
        </>
      )}
    </div>
  );
};

export default OptionsSourceForm;
