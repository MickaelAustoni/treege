import { Loader2, Plus, Sparkles, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useTreegeEditorContext } from "@/editor/context/TreegeEditorContext";
import ApiUrlCombobox from "@/editor/features/TreegeEditor/inputs/ApiUrlCombobox";
import useTranslate from "@/editor/hooks/useTranslate";
import { extractOptionsFromResponse, getValueByPath, makeHttpRequest, mergeHttpHeaders } from "@/renderer/utils/http";
import { Button } from "@/shared/components/ui/button";
import { FormItem } from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/shared/components/ui/toggle-group";
import { OptionsSource, OptionsSourceMapping } from "@/shared/types/node";

const METHODS_NEEDING_BODY = ["POST", "PUT", "PATCH"];
const HTTP_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"] as const;
type HttpMethod = (typeof HTTP_METHODS)[number];

interface OptionsSourceFormProps {
  value: OptionsSource | undefined;
  onChange: (value: OptionsSource | undefined) => void;
}

/**
 * Walks the first array item to enumerate field paths usable as mapping keys.
 * Includes top-level keys and one level of nested object dot-paths.
 */
const detectFieldPaths = (response: unknown, responsePath: string): string[] => {
  const data = getValueByPath(response, responsePath);
  if (!Array.isArray(data) || data.length === 0) {
    return [];
  }

  const sample = data[0];
  if (!sample || typeof sample !== "object") {
    return [];
  }

  const paths: string[] = [];
  for (const [key, value] of Object.entries(sample)) {
    paths.push(key);
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      for (const nestedKey of Object.keys(value)) {
        paths.push(`${key}.${nestedKey}`);
      }
    }
  }

  return paths;
};

const OptionsSourceForm = ({ value, onChange }: OptionsSourceFormProps) => {
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedPaths, setDetectedPaths] = useState<string[]>([]);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const t = useTranslate();
  const { headers: globalHeaders } = useTreegeEditorContext();
  const url = value?.url ?? "";
  const method = value?.method ?? "GET";
  const headers = value?.headers ?? [];
  const body = value?.body ?? "";
  const responsePath = value?.responsePath ?? "";
  const mapping = value?.mapping;
  const mode: "static" | "api" = value ? "api" : "static";
  const fieldOptions = useMemo(() => detectedPaths.map((path) => ({ label: path, value: path })), [detectedPaths]);

  const update = (patch: Partial<OptionsSource>) => {
    onChange({ ...(value ?? {}), ...patch });
  };

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
      setDetectedPaths([]);
      setPreviewCount(null);
    }
  };

  const handleDetect = async () => {
    if (!url) {
      toast.error(t("editor.optionsSourceForm.urlRequired"));
      return;
    }

    setIsDetecting(true);
    try {
      const result = await makeHttpRequest({
        body: body && METHODS_NEEDING_BODY.includes(method) ? body : undefined,
        // Field-level headers win over globals on key collision (case-insensitive)
        headers: mergeHttpHeaders(globalHeaders, headers),
        method,
        url,
      });

      if (!result.success) {
        toast.error(result.error || t("editor.optionsSourceForm.detectFailed"));
        return;
      }

      const paths = detectFieldPaths(result.data, responsePath);
      if (paths.length === 0) {
        toast.error(t("editor.optionsSourceForm.noFieldsDetected"));
        setDetectedPaths([]);
        setPreviewCount(null);
        return;
      }

      setDetectedPaths(paths);

      // If we already have a complete mapping, also show how many options would be produced.
      if (mapping?.valueField && mapping?.labelField) {
        const options = extractOptionsFromResponse(result.data, responsePath, mapping);
        setPreviewCount(options.length);
      } else {
        setPreviewCount(null);
      }
      toast.success(t("editor.optionsSourceForm.detectSuccess"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("editor.optionsSourceForm.detectFailed"));
    } finally {
      setIsDetecting(false);
    }
  };

  const renderMappingField = (mappingKey: keyof OptionsSourceMapping, label: string, placeholder: string, required: boolean) => {
    const current = mapping?.[mappingKey] ?? "";

    if (fieldOptions.length === 0) {
      return (
        <FormItem className="tg:min-w-0">
          <Label className="tg:text-xs">
            {label}
            {required && <span className="tg:text-red-500"> *</span>}
          </Label>
          <Input
            value={current}
            placeholder={placeholder}
            onChange={({ target }) => updateMapping({ [mappingKey]: target.value || undefined } as Partial<OptionsSourceMapping>)}
          />
        </FormItem>
      );
    }

    return (
      <FormItem className="tg:min-w-0">
        <Label className="tg:text-xs">
          {label}
          {required && <span className="tg:text-red-500"> *</span>}
        </Label>
        <Select
          value={current || undefined}
          onValueChange={(next) => updateMapping({ [mappingKey]: next || undefined } as Partial<OptionsSourceMapping>)}
        >
          <SelectTrigger className="tg:w-full tg:min-w-0">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {fieldOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormItem>
    );
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
            {headers.map((header, index) => (
              <div key={index} className="tg:flex tg:items-center tg:gap-2">
                <Input
                  value={header.key}
                  placeholder={t("editor.httpConfigForm.headerName")}
                  onChange={({ target }) => {
                    const next = [...headers];
                    next[index] = { ...next[index], key: target.value };
                    update({ headers: next });
                  }}
                />
                <Input
                  value={header.value}
                  placeholder={t("editor.httpConfigForm.headerValue")}
                  onChange={({ target }) => {
                    const next = [...headers];
                    next[index] = { ...next[index], value: target.value };
                    update({ headers: next });
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => update({ headers: headers.filter((_, i) => i !== index) })}
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
              onClick={() => update({ headers: [...headers, { key: "", value: "" }] })}
            >
              <Plus className="tg:mr-2 tg:h-4 tg:w-4" />
              {t("editor.httpConfigForm.addHeader")}
            </Button>
          </div>

          {METHODS_NEEDING_BODY.includes(method) && (
            <FormItem>
              <Label className="tg:text-xs">{t("editor.httpConfigForm.requestBody")}</Label>
              <Textarea value={body} rows={3} onChange={({ target }) => update({ body: target.value })} />
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

          <div className="tg:flex tg:items-center tg:justify-between">
            <Button type="button" variant="outline" size="sm" onClick={handleDetect} disabled={isDetecting || !url}>
              {isDetecting ? <Loader2 className="tg:mr-2 tg:h-4 tg:w-4 tg:animate-spin" /> : <Sparkles className="tg:mr-2 tg:h-4 tg:w-4" />}
              {t("editor.optionsSourceForm.detect")}
            </Button>
            {previewCount !== null && (
              <span className="tg:text-muted-foreground tg:text-xs">
                {t("editor.optionsSourceForm.previewCount").replace("{count}", String(previewCount))}
              </span>
            )}
          </div>

          <div className="tg:grid tg:grid-cols-2 tg:gap-3">
            {renderMappingField(
              "labelField",
              t("editor.optionsSourceForm.labelField"),
              t("editor.optionsSourceForm.labelFieldPlaceholder"),
              true,
            )}
            {renderMappingField(
              "valueField",
              t("editor.optionsSourceForm.valueField"),
              t("editor.optionsSourceForm.valueFieldPlaceholder"),
              true,
            )}
            {renderMappingField(
              "descriptionField",
              t("editor.optionsSourceForm.descriptionField"),
              t("editor.optionsSourceForm.descriptionFieldPlaceholder"),
              false,
            )}
            {renderMappingField(
              "imageField",
              t("editor.optionsSourceForm.imageField"),
              t("editor.optionsSourceForm.imageFieldPlaceholder"),
              false,
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default OptionsSourceForm;
