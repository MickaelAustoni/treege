import { Node } from "@xyflow/react";
import { Globe, Pencil, Plus, Trash2 } from "lucide-react";
import { FormEvent, KeyboardEvent, MouseEvent, ReactNode, useState } from "react";
import { useTreegeEditorRuntime } from "@/editor/context/TreegeEditorRuntimeProvider";
import OptionImageField from "@/editor/features/TreegeEditor/inputs/OptionImageField";
import useFlowActions from "@/editor/hooks/useFlowActions";
import useTranslate from "@/editor/hooks/useTranslate";
import { getInputTypeIcon } from "@/editor/utils/inputTypeIcon";
import { TreegeRenderRuntimeProvider } from "@/renderer/context/TreegeRenderRuntimeProvider";
import { defaultInputRenderers } from "@/renderer/features/TreegeRenderer/web/components/DefaultInputs";
import type { InputRenderer } from "@/renderer/types/renderer";
import { resolveInputPlaceholder, resolveNodeKey } from "@/renderer/utils/node";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/components/ui/tooltip";
import { cn } from "@/shared/lib/utils";
import { Language } from "@/shared/types/languages";
import { InputNodeData, InputOption, InputType } from "@/shared/types/node";
import { isOptionsInputData } from "@/shared/utils/inputTypeGuards";
import { getTranslatedText } from "@/shared/utils/translations";

interface NodeInputPreviewProps {
  nodeId: string;
  /**
   * Input node data. Optional so the parent can pass it unconditionally —
   * the component returns `null` when undefined or when the runtime renderer
   * for this input type isn't available.
   */
  data?: InputNodeData;
}

/**
 * Input types whose options are already laid out by the runtime renderer
 * (one row per option). For these we don't repeat them as a textual list —
 * we paint per-option edit/delete controls on top of the rendered options
 * via `renderOptionActions`.
 */
const INLINE_OPTION_TYPES = new Set<InputType>(["radio", "checkbox"]);

const defaultValueForType = (type: InputType): unknown => {
  switch (type) {
    case "number":
    case "daterange":
    case "timerange":
    case "file":
      return null;
    case "switch":
      return false;
    case "checkbox":
      return [];
    default:
      return "";
  }
};

/**
 * Returns a shortened URL suitable for inline display: just the path (and
 * search string), stripping the protocol/host. Preserves template variables
 * like `{{id}}` verbatim — uses a regex rather than `URL` to avoid encoding
 * curly braces. Falls back to the raw value if no protocol is present.
 */
const shortenUrl = (url: string): string => {
  const stripped = url.replace(/^[a-z][\w+.-]*:\/\/[^/]+/i, "");
  return stripped || url;
};

const NodeInputPreview = ({ nodeId, data }: NodeInputPreviewProps) => {
  const [open, setOpen] = useState(false);
  const [labelDraft, setLabelDraft] = useState("");
  const [valueDraft, setValueDraft] = useState("");
  const [imageDraft, setImageDraft] = useState("");
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null); // null = creating; number = editing the option at that index.
  const { language, headers } = useTreegeEditorRuntime();
  const { updateNodeData } = useFlowActions();
  const t = useTranslate();
  const inputType = data?.type;

  if (!inputType) {
    return null;
  }

  const hasOptions = isOptionsInputData(data);
  const optionsSourceUrl = hasOptions ? data.optionsSource?.url : undefined;
  const previewUrl = optionsSourceUrl ?? (inputType === "http" ? data.httpConfig?.url : undefined);
  const options = hasOptions ? (data.options ?? []) : [];
  const supportsImage = hasOptions;
  const supportsDescription = hasOptions;

  // Resolve the form name BEFORE stripping the data so the runtime renderer
  // still receives a meaningful `name` prop (used for input `name=` attribute).
  const resolvedName = resolveNodeKey({
    data,
    id: nodeId,
    position: { x: 0, y: 0 },
    type: "input",
  });

  // For the preview we strip:
  // - `required` so the renderer doesn't paint its red asterisk (already shown
  //   by `NodeRequiredButton` in the top-right actions),
  // - `name` so the renderer's `label || node.data.name` fallback yields an
  //   empty <label/>. Combined with the `[&_label:empty]:hidden` wrapper, this
  //   removes the duplicate label rendered above the preview's input.
  const previewNode: Node<InputNodeData> = {
    data: { ...data, name: undefined, required: undefined },
    id: nodeId,
    position: { x: 0, y: 0 },
    type: "input",
  };

  const resetDraft = () => {
    setLabelDraft("");
    setValueDraft("");
    setImageDraft("");
    setDescriptionDraft("");
  };

  const handleSubmit = (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    const label = labelDraft.trim();
    const value = valueDraft.trim();

    if (!(label || value)) {
      return;
    }

    const description = descriptionDraft.trim();
    const newOption: InputOption = {
      label: { [language as Language]: label } as InputOption["label"],
      value,
      ...(supportsImage && imageDraft && { image: imageDraft }),
      ...(supportsDescription && description && { description: { [language as Language]: description } as InputOption["description"] }),
    };
    const nextOptions = editingIndex === null ? [...options, newOption] : options.map((opt, i) => (i === editingIndex ? newOption : opt));

    updateNodeData(nodeId, { options: nextOptions });
    resetDraft();
    setEditingIndex(null);
    setOpen(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      resetDraft();
      setEditingIndex(null);
    }
  };

  const openEditPopover = (index: number) => {
    const option = options[index];
    if (!option) {
      return;
    }
    setLabelDraft(t(option.label) || "");
    setValueDraft(option.value || "");
    setImageDraft(option.image ?? "");
    setDescriptionDraft(t(option.description) || "");
    setEditingIndex(index);
    setOpen(true);
  };

  const deleteOption = (index: number) => {
    updateNodeData(nodeId, { options: options.filter((_, i) => i !== index) });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSubmit();
    }
  };

  const stopPropagation = (event: MouseEvent) => event.stopPropagation();

  // Hidden inputs render nothing at runtime — show a readable summary instead
  // (with the type icon since there's no rendered field to identify it visually).
  if (inputType === "hidden") {
    const SubTypeIcon = getInputTypeIcon(inputType);
    const staticValue = data.defaultValue?.type === "static" ? data.defaultValue.staticValue : undefined;
    const referenceField = data.defaultValue?.type === "reference" ? data.defaultValue.referenceField : undefined;
    const displayValue = Array.isArray(staticValue)
      ? staticValue.join(", ")
      : typeof staticValue === "boolean"
        ? String(staticValue)
        : (staticValue ?? (referenceField ? `→ ${referenceField}` : ""));

    return (
      <div className="tg:pointer-events-none tg:flex tg:select-none tg:flex-col tg:gap-1 tg:text-sm">
        <div className="tg:flex tg:items-center tg:gap-1 tg:text-[10px] tg:text-muted-foreground tg:capitalize tg:[&>svg]:size-3">
          <SubTypeIcon />
          {inputType}
        </div>
        <span className="tg:truncate tg:text-muted-foreground tg:text-xs">{displayValue || "—"}</span>
      </div>
    );
  }

  const Renderer = defaultInputRenderers[inputType] as InputRenderer | undefined;

  if (!Renderer) {
    return null;
  }

  const helperText = getTranslatedText(data.helperText, language);
  const placeholder = resolveInputPlaceholder(data, language);

  // Inline overlay rendered on top of each runtime option (radio/checkbox).
  // Pointer events are re-enabled on the buttons themselves because the
  // preview wrapper sets `pointer-events-none` to keep the field
  // non-interactive at the input level.
  const renderOptionExtras = ({ option, index, variant }: { option: InputOption; index: number; variant?: string }): ReactNode => {
    const value = String(option.value);
    const optionLabel = t(option.label) || value;
    // Card variant already has a rich layout — adding a floating value
    // here would clash. Otherwise show value only when it adds info.
    const showValue = value && value !== optionLabel && variant !== "card";
    const handleEdit = (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      openEditPopover(index);
    };
    const handleDelete = (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      deleteOption(index);
    };
    return (
      <>
        {showValue && (
          <span className="tg:pointer-events-none tg:absolute tg:top-1/2 tg:right-2 tg:max-w-18 tg:-translate-y-1/2 tg:truncate tg:text-[10px] tg:text-muted-foreground/60 tg:group-hover/option:hidden">
            {value}
          </span>
        )}
        <div className="tg:pointer-events-auto tg:absolute tg:top-1/2 tg:right-2 tg:hidden tg:-translate-y-1/2 tg:gap-0.5 tg:group-hover/option:flex">
          <Button
            type="button"
            variant="icon"
            size="icon-sm"
            aria-label={t("editor.inputNodeForm.editOption")}
            className="tg:size-5"
            onClick={handleEdit}
          >
            <Pencil />
          </Button>
          <Button
            type="button"
            variant="icon"
            size="icon-sm"
            aria-label={t("editor.inputNodeForm.deleteOption")}
            className="tg:size-5 tg:hover:text-destructive"
            onClick={handleDelete}
          >
            <Trash2 />
          </Button>
        </div>
      </>
    );
  };

  // Textual fallback list for option-based inputs whose runtime renderer
  // doesn't show the options inline (select, autocomplete). Radio/checkbox
  // are excluded since `renderOptionActions` already covers them on the
  // rendered rows.
  const showTextualList = hasOptions && !INLINE_OPTION_TYPES.has(inputType) && !optionsSourceUrl;

  return (
    <>
      <div
        className={cn(
          "tg:pointer-events-none tg:flex tg:select-none tg:flex-col tg:gap-1 tg:[&_label:empty]:hidden",
          inputType === "submit" && "tg:items-center",
        )}
      >
        {/*
          Wrap the runtime renderer in a minimal `TreegeRenderRuntimeProvider` so it
          picks up the editor's `headers` (e.g. for `useInputOptions`'s fetch).
          The provider merges with sensible defaults — other fields stay no-op
          since the preview is non-interactive. `label` is intentionally omitted
          so the editor's `NodeLabelInput` is the single source of truth visually
          and avoids rendering the same text twice.
        */}
        <TreegeRenderRuntimeProvider value={{ headers, language, optionsDisplayLimit: 10 }}>
          <Renderer
            key={inputType}
            field={{
              id: nodeId,
              name: resolvedName,
              placeholder: placeholder || undefined,
              value: defaultValueForType(inputType) as never,
            }}
            extra={{
              compactOptions: true,
              helperText: helperText || undefined,
              missingDependencies: [],
              node: previewNode,
              renderOptionExtras: optionsSourceUrl ? undefined : renderOptionExtras,
              setValue: () => {},
            }}
          />
        </TreegeRenderRuntimeProvider>
      </div>

      {previewUrl && (
        <TooltipProvider>
          <Tooltip disableHoverableContent>
            <TooltipTrigger asChild>
              <div className="nodrag nopan tg:my-1 tg:flex tg:items-center tg:gap-1 tg:text-muted-foreground tg:text-xs">
                <Globe className="tg:size-3 tg:shrink-0" />
                <span className="tg:truncate">{shortenUrl(previewUrl)}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">{previewUrl}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {hasOptions && !optionsSourceUrl && (
        <div className="nodrag nopan tg:my-1 tg:flex tg:flex-col tg:gap-0.5">
          {showTextualList &&
            options.map((option, index) => {
              const translatedLabel = t(option.label);
              const optionLabel = translatedLabel || option.value || "—";
              const key = `${option.value || "opt"}-${index}`;
              const showValueColumn = Boolean(option.value) && Boolean(translatedLabel) && translatedLabel !== option.value;

              return (
                <div key={key} className="tg:group tg:flex tg:min-h-5 tg:items-center tg:gap-1 tg:text-muted-foreground tg:text-xs">
                  <span className="tg:truncate">{optionLabel}</span>
                  {showValueColumn && (
                    <span className="tg:ml-auto tg:max-w-[50%] tg:shrink-0 tg:truncate tg:text-[10px] tg:text-muted-foreground/60 tg:group-hover:hidden">
                      {option.value}
                    </span>
                  )}
                  <div className="tg:ml-auto tg:hidden tg:shrink-0 tg:gap-0.5 tg:group-hover:flex">
                    <Button
                      type="button"
                      variant="icon"
                      size="icon-sm"
                      aria-label={t("editor.inputNodeForm.editOption")}
                      className="tg:size-5"
                      onClick={(event) => {
                        event.stopPropagation();
                        openEditPopover(index);
                      }}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      type="button"
                      variant="icon"
                      size="icon-sm"
                      aria-label={t("editor.inputNodeForm.deleteOption")}
                      className="tg:size-5 tg:hover:text-destructive"
                      onClick={(event) => {
                        event.stopPropagation();
                        deleteOption(index);
                      }}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              );
            })}

          <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild onClick={stopPropagation}>
              <Button
                type="button"
                variant="link"
                size="xs"
                className="tg:w-fit tg:p-0! tg:focus-visible:border-transparent! tg:focus-visible:ring-0!"
              >
                <Plus className="tg:size-3" />
                {t("editor.inputNodeForm.addOption")}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="tg:w-80 tg:p-3" onClick={stopPropagation}>
              <form onSubmit={handleSubmit} className="tg:flex tg:flex-col tg:gap-2">
                <div className="tg:flex tg:items-start tg:gap-2">
                  {supportsImage && <OptionImageField value={imageDraft} onChange={setImageDraft} />}
                  <Input
                    id={`${nodeId}-option-label`}
                    autoFocus
                    placeholder={t("editor.inputNodeForm.optionLabel")}
                    value={labelDraft}
                    onChange={(event) => setLabelDraft(event.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  <Input
                    id={`${nodeId}-option-value`}
                    placeholder={t("editor.inputNodeForm.optionValue")}
                    value={valueDraft}
                    onChange={(event) => setValueDraft(event.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                </div>
                {supportsDescription && (
                  <Input
                    id={`${nodeId}-option-description`}
                    placeholder={t("editor.inputNodeForm.optionDescription")}
                    value={descriptionDraft}
                    onChange={(event) => setDescriptionDraft(event.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                )}
                <div className="tg:flex tg:gap-2">
                  <Button type="button" variant="outline" size="sm" className="tg:flex-1" onClick={() => handleOpenChange(false)}>
                    {t("common.cancel")}
                  </Button>
                  <Button type="submit" size="sm" className="tg:flex-1" disabled={!(labelDraft.trim() || valueDraft.trim())}>
                    {editingIndex === null ? t("common.create") : t("common.save")}
                  </Button>
                </div>
              </form>
            </PopoverContent>
          </Popover>
        </div>
      )}
    </>
  );
};

export default NodeInputPreview;
