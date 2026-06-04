import { Loader2, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useTreegeEditorContext } from "@/editor/context/TreegeEditorContext";
import useTranslate from "@/editor/hooks/useTranslate";
import { extractOptionsFromResponse, getValueByPath, makeHttpRequest, mergeHttpHeaders } from "@/renderer/utils/http";
import { Button } from "@/shared/components/ui/button";
import { FormItem } from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { HttpHeader, OptionsSourceMapping, QueryParam } from "@/shared/types/node";

const METHODS_NEEDING_BODY = ["POST", "PUT", "PATCH"];

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export interface OptionsMappingRequest {
  url?: string;
  method?: HttpMethod;
  headers?: HttpHeader[];
  queryParams?: QueryParam[];
  body?: string;
  responsePath?: string;
}

interface OptionsMappingFieldsProps {
  /** Request config used by the "Detect fields" button to call the API. */
  request: OptionsMappingRequest;
  /** Current field-to-property mapping. */
  mapping: Partial<OptionsSourceMapping>;
  /** Called with a partial patch whenever a mapping field changes. */
  onMappingChange: (patch: Partial<OptionsSourceMapping>) => void;
  /** When true, also exposes the optional description/image mappings. */
  showOptionalFields?: boolean;
}

/**
 * Walks the first array item to enumerate field paths usable as mapping keys.
 * Includes top-level keys and one level of nested object dot-paths.
 */
export const detectFieldPaths = (response: unknown, responsePath: string): string[] => {
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

/**
 * Shared "map response to options" UI: a "Detect fields" button that probes
 * the configured endpoint to enumerate response field paths, plus the
 * value/label (and optionally description/image) mapping inputs. Once fields
 * are detected the inputs become dropdowns of the detected paths. Used by both
 * the HTTP input config and the dynamic options source so they stay identical.
 */
const OptionsMappingFields = ({ request, mapping, onMappingChange, showOptionalFields = false }: OptionsMappingFieldsProps) => {
  const t = useTranslate();
  const { headers: globalHeaders } = useTreegeEditorContext();
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedPaths, setDetectedPaths] = useState<string[]>([]);
  const [previewCount, setPreviewCount] = useState<number | null>(null);

  const fieldOptions = useMemo(() => detectedPaths.map((path) => ({ label: path, value: path })), [detectedPaths]);

  const { url, method = "GET", headers, queryParams, body, responsePath = "" } = request;

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
        queryParams,
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
      if (mapping.valueField && mapping.labelField) {
        const options = extractOptionsFromResponse(result.data, responsePath, mapping as OptionsSourceMapping);
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
    const current = mapping[mappingKey] ?? "";

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
            onChange={({ target }) => onMappingChange({ [mappingKey]: target.value || undefined } as Partial<OptionsSourceMapping>)}
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
          onValueChange={(next) => onMappingChange({ [mappingKey]: next || undefined } as Partial<OptionsSourceMapping>)}
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
        {showOptionalFields &&
          renderMappingField(
            "descriptionField",
            t("editor.optionsSourceForm.descriptionField"),
            t("editor.optionsSourceForm.descriptionFieldPlaceholder"),
            false,
          )}
        {showOptionalFields &&
          renderMappingField(
            "imageField",
            t("editor.optionsSourceForm.imageField"),
            t("editor.optionsSourceForm.imageFieldPlaceholder"),
            false,
          )}
      </div>
    </div>
  );
};

export default OptionsMappingFields;
