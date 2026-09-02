import { ChevronsUpDown, Plus, X } from "lucide-react";
import JsonTemplateEditor from "@/editor/features/TreegeEditor/forms/JsonTemplateEditor";
import SensitiveHeaderWarning from "@/editor/features/TreegeEditor/forms/SensitiveHeaderWarning";
import ApiUrlCombobox from "@/editor/features/TreegeEditor/inputs/ApiUrlCombobox";
import useAvailableParentFields from "@/editor/hooks/useAvailableParentFields";
import { useKeyValueRows } from "@/editor/hooks/useKeyValueRows";
import useNodesSelection from "@/editor/hooks/useNodesSelection";
import useTranslate from "@/editor/hooks/useTranslate";
import { Button } from "@/shared/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/shared/components/ui/collapsible";
import { FormItem } from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Toggle } from "@/shared/components/ui/toggle";
import { HttpDefaultSource, HttpHeaders, InputNodeData } from "@/shared/types/node";

const METHODS_NEEDING_BODY = ["POST", "PUT", "PATCH"];
const TEMPLATE_VARIABLE_REGEXP = /\{\{([\w-]+)}}/g;
const HTTP_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"] as const;
type HttpMethod = (typeof HTTP_METHODS)[number];

interface HttpDefaultValueFormProps {
  value: HttpDefaultSource | undefined;
  onChange: (value: HttpDefaultSource) => void;
}

/**
 * Ids of the fields the request references (`{{nodeId}}` in the url, query
 * params, headers or body) — the fields whose changes replay the request.
 */
const getDependencyIds = (source: HttpDefaultSource | undefined): string[] => {
  const text = [source?.url, source?.body, ...Object.values(source?.queryParams ?? {}), ...Object.values(source?.headers ?? {})].join(" ");

  return [...new Set([...text.matchAll(TEMPLATE_VARIABLE_REGEXP)].map((match) => match[1]))];
};

/** The source with every `{{nodeId}}` occurrence of one field stripped from the request. */
const withoutDependency = (source: HttpDefaultSource, nodeId: string): HttpDefaultSource => {
  const token = `{{${nodeId}}}`;
  const strip = (text?: string) => text?.replaceAll(token, "");
  const stripRecord = (record?: HttpHeaders) =>
    record && Object.fromEntries(Object.entries(record).map(([key, entry]) => [key, entry.replaceAll(token, "")]));

  return {
    ...source,
    body: strip(source.body),
    headers: stripRecord(source.headers),
    queryParams: stripRecord(source.queryParams),
    url: strip(source.url) ?? "",
  };
};

/**
 * Anything beyond the nominal "GET + url" request lives behind the advanced
 * collapsible — open it by default when the stored source already uses it.
 */
const hasAdvancedConfig = (source: HttpDefaultSource | undefined): boolean =>
  Boolean(
    source &&
      ((source.method && source.method !== "GET") ||
        source.body ||
        Object.keys(source.headers ?? {}).length > 0 ||
        Object.keys(source.queryParams ?? {}).length > 0),
  );

/**
 * Configuration of a `defaultValue` of type `"http"`: the request whose
 * response feeds the field, and how the value is extracted/rendered from it.
 *
 * The nominal case only needs three fields (url, response path, template);
 * method, headers, query params and body are folded into an "advanced"
 * collapsible. Ancestor fields are inserted into the url as `{{nodeId}}`
 * through the same variable picker as `HttpConfigForm`.
 */
const HttpDefaultValueForm = ({ value, onChange }: HttpDefaultValueFormProps) => {
  const [headerRows, setHeaderRows] = useKeyValueRows(value?.headers, (headers) => update({ headers }));
  const [queryParamRows, setQueryParamRows] = useKeyValueRows(value?.queryParams, (queryParams) => update({ queryParams }));
  const { selectedNode } = useNodesSelection<InputNodeData>();
  const t = useTranslate();
  const availableParentFields = useAvailableParentFields(selectedNode?.id);
  const url = value?.url ?? "";
  const method = value?.method ?? "GET";
  const body = value?.body ?? "";
  const responsePath = value?.responsePath ?? "";
  const template = value?.template ?? "";
  const dependencyIds = getDependencyIds(value);

  const update = (patch: Partial<HttpDefaultSource>) => {
    onChange({ ...(value ?? {}), ...patch });
  };

  const toggleTrigger = (nodeId: string, pressed: boolean) => {
    if (pressed) {
      update({ url: `${url}{{${nodeId}}}` });
      return;
    }
    onChange(withoutDependency(value ?? {}, nodeId));
  };

  return (
    <div className="tg:flex tg:flex-col tg:gap-4">
      <p className="tg:text-muted-foreground tg:text-xs">{t("editor.inputNodeForm.httpDefaultHint")}</p>

      <FormItem>
        <Label className="tg:text-xs">{t("editor.inputNodeForm.httpDefaultTriggers")}</Label>
        {availableParentFields.length === 0 ? (
          <p className="tg:text-muted-foreground tg:text-xs">{t("editor.httpConfigForm.noFieldsAvailable")}</p>
        ) : (
          <div className="tg:flex tg:flex-wrap tg:gap-1">
            {availableParentFields.map((field) => (
              <Toggle
                key={field.nodeId}
                variant="outline"
                size="sm"
                className="tg:h-7 tg:px-2 tg:text-xs"
                pressed={dependencyIds.includes(field.nodeId)}
                onPressedChange={(pressed) => toggleTrigger(field.nodeId, pressed)}
                title={`{{${field.nodeId}}}`}
              >
                {field.label}
              </Toggle>
            ))}
          </div>
        )}
        <p className="tg:text-muted-foreground tg:text-xs">
          {dependencyIds.length === 0
            ? t("editor.inputNodeForm.httpDefaultNoDependency")
            : t("editor.inputNodeForm.httpDefaultTriggersHint")}
        </p>
      </FormItem>

      <FormItem>
        <Label className="tg:text-xs">{t("editor.inputNodeForm.httpDefaultUrl")}</Label>
        <ApiUrlCombobox
          value={url}
          onChange={(nextUrl, nextMethod) => update(nextMethod ? { method: nextMethod, url: nextUrl } : { url: nextUrl })}
          placeholder={t("editor.httpConfigForm.apiUrlPlaceholder")}
        />
        <p className="tg:text-muted-foreground tg:text-xs">{t("editor.inputNodeForm.httpDefaultUrlDesc")}</p>
      </FormItem>

      <FormItem>
        <Label className="tg:text-xs">{t("editor.inputNodeForm.httpDefaultResponsePathLabel")}</Label>
        <Input
          value={responsePath}
          placeholder={t("editor.inputNodeForm.httpDefaultResponsePathPlaceholder")}
          onChange={({ target }) => update({ responsePath: target.value || undefined })}
        />
        <p className="tg:text-muted-foreground tg:text-xs">{t("editor.inputNodeForm.httpDefaultResponsePathHint")}</p>
      </FormItem>

      <FormItem>
        <Label className="tg:text-xs">{t("editor.inputNodeForm.httpDefaultTemplate")}</Label>
        <Input
          value={template}
          placeholder={t("editor.inputNodeForm.httpDefaultTemplatePlaceholder")}
          onChange={({ target }) => update({ template: target.value || undefined })}
        />
        <p className="tg:text-muted-foreground tg:text-xs">{t("editor.inputNodeForm.httpDefaultTemplateDesc")}</p>
      </FormItem>

      <Collapsible defaultOpen={hasAdvancedConfig(value)} className="tg:flex tg:flex-col tg:gap-2">
        <CollapsibleTrigger asChild>
          <div className="tg:flex tg:items-center tg:justify-between tg:gap-4">
            <h4 className="tg:font-semibold tg:text-xs">{t("editor.inputNodeForm.httpDefaultAdvanced")}</h4>
            <Button type="button" variant="ghost" size="icon" className="tg:size-8">
              <ChevronsUpDown />
              <span className="tg:sr-only">{t("common.toggle")}</span>
            </Button>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="tg:flex tg:flex-col tg:gap-4">
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
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default HttpDefaultValueForm;
