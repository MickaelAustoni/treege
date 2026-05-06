import { Globe, Pencil, Plus, Trash2 } from "lucide-react";
import { KeyboardEvent, MouseEvent, SubmitEvent, useState } from "react";
import { useTreegeEditorContext } from "@/editor/context/TreegeEditorContext";
import OptionImageField from "@/editor/features/TreegeEditor/inputs/OptionImageField";
import useFlowActions from "@/editor/hooks/useFlowActions";
import useTranslate from "@/editor/hooks/useTranslate";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/components/ui/tooltip";
import { Language } from "@/shared/types/languages";
import { FlowNodeData, InputNodeData, InputOption, UINodeData } from "@/shared/types/node";

interface NodeOptionsProps {
  nodeId: string;
  data?: FlowNodeData | InputNodeData | UINodeData;
  /**
   * When true, hovering an option row reveals edit/delete icons. We gate the
   * icons on selection so unselected nodes stay visually clean.
   */
  selected?: boolean;
}

/**
 * Type guard: narrows the node `data` to an `InputNodeData` whose type
 * supports an option list. Used so the rest of the component can access
 * `data.options`, `data.optionsSource`, etc. without casts.
 */
const isOptionsInputData = (data: NodeOptionsProps["data"]): data is InputNodeData =>
  Boolean(data && "type" in data && data.type && ["radio", "select", "checkbox", "autocomplete"].includes(data.type));

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

const NodeOptions = ({ nodeId, data, selected }: NodeOptionsProps) => {
  const [open, setOpen] = useState(false);
  const [labelDraft, setLabelDraft] = useState("");
  const [valueDraft, setValueDraft] = useState("");
  const [imageDraft, setImageDraft] = useState("");
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null); // null = creating a new option; number = editing the option at that index.
  const { updateNodeData } = useFlowActions();
  const { language } = useTreegeEditorContext();
  const t = useTranslate();

  if (!isOptionsInputData(data)) {
    return null;
  }

  const options = data.options ?? [];
  const optionsSourceUrl = data.optionsSource?.url;
  const supportsImage = data.type === "radio";
  const supportsDescription = data.type === "radio" || data.type === "checkbox";

  const resetDraft = () => {
    setLabelDraft("");
    setValueDraft("");
    setImageDraft("");
    setDescriptionDraft("");
  };

  const handleSubmit = (event?: SubmitEvent) => {
    event?.preventDefault();
    const label = labelDraft.trim();
    const value = valueDraft.trim() || label;

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

  const handleEditOption = (index: number, event: MouseEvent) => {
    event.stopPropagation();
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

  const handleDeleteOption = (index: number, event: MouseEvent) => {
    event.stopPropagation();
    updateNodeData(nodeId, { options: options.filter((_, i) => i !== index) });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSubmit();
    }
  };

  const stopPropagation = (event: MouseEvent) => event.stopPropagation();

  /**
   * When a dynamic source is configured, the static `options` array is ignored
   * at runtime. Hide the static editor and show a discreet URL indicator so
   * the user knows where the options come from. Editing the source itself
   * happens in the side panel.
   */
  if (optionsSourceUrl) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="nodrag nopan tg:my-1 tg:flex tg:items-center tg:gap-1 tg:text-muted-foreground tg:text-xs">
              <Globe className="tg:size-3 tg:shrink-0" />
              <span className="tg:truncate">{shortenUrl(optionsSourceUrl)}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">{optionsSourceUrl}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="nodrag nopan tg:my-1 tg:flex tg:flex-col tg:gap-0.5">
      {options.map((option, index) => {
        const optionLabel = t(option.label) || option.value || "—";
        const key = `${option.value || "opt"}-${index}`;

        return (
          <div key={key} className="tg:group tg:flex tg:items-center tg:gap-1 tg:text-muted-foreground tg:text-xs">
            <span className="tg:truncate">{optionLabel}</span>
            {selected && (
              <div className="tg:ml-auto tg:flex tg:shrink-0 tg:gap-0.5 tg:opacity-0 tg:transition-opacity tg:group-hover:opacity-100">
                <Button
                  type="button"
                  variant="icon"
                  size="icon-sm"
                  aria-label={t("editor.inputNodeForm.editOption")}
                  className="tg:size-5"
                  onClick={(event) => handleEditOption(index, event)}
                >
                  <Pencil />
                </Button>
                <Button
                  type="button"
                  variant="icon"
                  size="icon-sm"
                  aria-label={t("editor.inputNodeForm.deleteOption")}
                  className="tg:size-5 tg:hover:text-destructive"
                  onClick={(event) => handleDeleteOption(index, event)}
                >
                  <Trash2 />
                </Button>
              </div>
            )}
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
  );
};

export default NodeOptions;
