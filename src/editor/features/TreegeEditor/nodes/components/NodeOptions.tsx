import { Globe, Plus } from "lucide-react";
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
}

const OPTIONS_TYPES = ["radio", "select", "checkbox", "autocomplete"] as const;

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

const NodeOptions = ({ nodeId, data }: NodeOptionsProps) => {
  const [open, setOpen] = useState(false);
  const [labelDraft, setLabelDraft] = useState("");
  const [valueDraft, setValueDraft] = useState("");
  const [imageDraft, setImageDraft] = useState("");
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const { updateNodeData } = useFlowActions();
  const { language } = useTreegeEditorContext();
  const t = useTranslate();
  const dataType = data && "type" in data ? data.type : undefined;
  const hasOptions = dataType && OPTIONS_TYPES.includes(dataType as (typeof OPTIONS_TYPES)[number]);
  const inputData = data as InputNodeData;
  const options = inputData.options ?? [];
  const optionsSourceUrl = inputData.optionsSource?.url;
  const supportsImage = dataType === "radio";
  const supportsDescription = dataType === "radio" || dataType === "checkbox";

  if (!hasOptions) {
    return null;
  }

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
    updateNodeData(nodeId, { options: [...options, newOption] });
    resetDraft();
    setOpen(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      resetDraft();
    }
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
          <div key={key} className="tg:truncate tg:text-muted-foreground tg:text-xs">
            {optionLabel}
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
            <Button type="submit" size="sm" disabled={!(labelDraft.trim() || valueDraft.trim())}>
              {t("common.create")}
            </Button>
          </form>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default NodeOptions;
