import { Plus } from "lucide-react";
import { FormEvent, KeyboardEvent, MouseEvent, useState } from "react";
import { useTreegeEditorContext } from "@/editor/context/TreegeEditorContext";
import useFlowActions from "@/editor/hooks/useFlowActions";
import useTranslate from "@/editor/hooks/useTranslate";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";
import { Language } from "@/shared/types/languages";
import { FlowNodeData, InputNodeData, InputOption, UINodeData } from "@/shared/types/node";

interface InputPreviewProps {
  nodeId: string;
  data?: FlowNodeData | InputNodeData | UINodeData;
}

const OPTIONS_TYPES = ["radio", "select", "checkbox", "autocomplete"] as const;
const MAX_VISIBLE_OPTIONS = 3;

const InputPreview = ({ nodeId, data }: InputPreviewProps) => {
  const [open, setOpen] = useState(false);
  const [labelDraft, setLabelDraft] = useState("");
  const [valueDraft, setValueDraft] = useState("");
  const { updateNodeData } = useFlowActions();
  const { language } = useTreegeEditorContext();
  const t = useTranslate();
  const dataType = data && "type" in data ? data.type : undefined;
  const hasOptions = dataType && OPTIONS_TYPES.includes(dataType as (typeof OPTIONS_TYPES)[number]);

  if (!hasOptions) {
    return null;
  }

  const options = (data as InputNodeData).options ?? [];
  const visibleOptions = options.slice(0, MAX_VISIBLE_OPTIONS);
  const hiddenCount = Math.max(0, options.length - MAX_VISIBLE_OPTIONS);

  const resetDraft = () => {
    setLabelDraft("");
    setValueDraft("");
  };

  const handleSubmit = (event?: FormEvent) => {
    event?.preventDefault();
    const label = labelDraft.trim();
    const value = valueDraft.trim() || label;
    if (!(label || value)) {
      return;
    }

    const newOption: InputOption = {
      label: { [language as Language]: label } as InputOption["label"],
      value,
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

  return (
    <div className="nodrag nopan my-1 flex flex-col gap-0.5">
      {visibleOptions.map((option, index) => {
        const optionLabel = t(option.label) || option.value || "—";
        const key = `${option.value || "opt"}-${index}`;

        return (
          <div key={key} className="truncate text-muted-foreground text-xs">
            {optionLabel}
          </div>
        );
      })}

      {hiddenCount > 0 && <div className="text-[10px] text-muted-foreground/70">+{hiddenCount}</div>}

      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild onClick={stopPropagation}>
          <Button type="button" variant="link" size="xs" className="w-fit p-0!">
            <Plus className="size-3" />
            {t("editor.inputNodeForm.addOption")}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64 p-3" onClick={stopPropagation}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <div className="flex flex-col gap-1">
              <Label htmlFor={`${nodeId}-option-label`} className="text-xs">
                {t("editor.inputNodeForm.optionLabel")}
              </Label>
              <Input
                id={`${nodeId}-option-label`}
                autoFocus
                value={labelDraft}
                onChange={(event) => setLabelDraft(event.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor={`${nodeId}-option-value`} className="text-xs">
                {t("editor.inputNodeForm.optionValue")}
              </Label>
              <Input
                id={`${nodeId}-option-value`}
                value={valueDraft}
                onChange={(event) => setValueDraft(event.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
            <Button type="submit" size="sm" disabled={!(labelDraft.trim() || valueDraft.trim())}>
              {t("common.create")}
            </Button>
          </form>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default InputPreview;
