import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import SelectLanguage from "@/editor/features/TreegeEditor/inputs/SelectLanguage";
import useFlowActions from "@/editor/hooks/useFlowActions";
import useNodesSelection from "@/editor/hooks/useNodesSelection";
import useTranslate from "@/editor/hooks/useTranslate";
import { FormDescription, FormItem } from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Language } from "@/shared/types/languages";
import { FlowNodeData } from "@/shared/types/node";

const FlowNodeForm = () => {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>("en");
  const { updateSelectedNodeData } = useFlowActions();
  const { selectedNode } = useNodesSelection<FlowNodeData>();
  const t = useTranslate();

  const { Field } = useForm({
    defaultValues: {
      label: selectedNode?.data?.label || { en: "" },
      targetId: selectedNode?.data?.targetId || "",
    } as FlowNodeData,
    listeners: {
      onChange: ({ formApi }) => {
        formApi.handleSubmit().then();
      },
      onChangeDebounceMs: 150,
    },
    onSubmit: ({ value }) => {
      updateSelectedNodeData(value);
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <div className="tg:grid tg:gap-6">
        <div className="tg:flex tg:items-end tg:gap-2">
          <Field
            name="label"
            children={(field) => (
              <FormItem className="tg:flex-1">
                <Label htmlFor={field.name}>{t("editor.flowNodeForm.label")}</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value?.[selectedLanguage] || ""}
                  onBlur={field.handleBlur}
                  onChange={({ target }) => {
                    field.handleChange({
                      ...field.state.value,
                      [selectedLanguage]: target.value,
                    });
                  }}
                />
              </FormItem>
            )}
          />
          <SelectLanguage value={selectedLanguage} onValueChange={setSelectedLanguage} />
        </div>

        <Field
          name="targetId"
          children={(field) => (
            <FormItem>
              <Label htmlFor={field.name}>{t("editor.flowNodeForm.targetId")} (Flow ID)</Label>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={({ target }) => field.handleChange(target.value)}
              />
              <FormDescription>Unique identifier of the target flow.</FormDescription>
            </FormItem>
          )}
        />
      </div>
    </form>
  );
};

export default FlowNodeForm;
