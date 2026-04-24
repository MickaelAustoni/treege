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

interface OptionsEditorProps {
  nodeId: string;
  data?: FlowNodeData | InputNodeData | UINodeData;
}

const OPTIONS_TYPES = ["radio", "select", "checkbox", "autocomplete"] as const;

const OptionsEditor = ({ nodeId, data }: OptionsEditorProps) => {
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
        <PopoverContent align="start" className="tg:w-64 tg:p-3" onClick={stopPropagation}>
          <form onSubmit={handleSubmit} className="tg:flex tg:flex-col tg:gap-2">
            <div className="tg:flex tg:flex-col tg:gap-1">
              <Label htmlFor={`${nodeId}-option-label`} className="tg:text-xs">
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
            <div className="tg:flex tg:flex-col tg:gap-1">
              <Label htmlFor={`${nodeId}-option-value`} className="tg:text-xs">
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

export default OptionsEditor;
