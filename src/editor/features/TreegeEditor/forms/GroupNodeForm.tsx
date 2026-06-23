import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import SelectLanguage from "@/editor/features/TreegeEditor/inputs/SelectLanguage";
import TranslatableInput from "@/editor/features/TreegeEditor/inputs/TranslatableInput";
import useFlowActions from "@/editor/hooks/useFlowActions";
import useNodesSelection from "@/editor/hooks/useNodesSelection";
import { FormItem } from "@/shared/components/ui/form";
import { Label } from "@/shared/components/ui/label";
import { Language } from "@/shared/types/languages";
import { GroupNodeData } from "@/shared/types/node";

const GroupNodeForm = () => {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>("en");
  const { selectedNode } = useNodesSelection<GroupNodeData>();
  const { updateSelectedNodeData } = useFlowActions();

  const { Field } = useForm({
    defaultValues: {
      label: selectedNode?.data?.label || {},
    } as GroupNodeData,
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
      <div className="tg:flex tg:items-end tg:gap-2">
        <Field
          name="label"
          children={(field) => (
            <FormItem className="tg:flex-1">
              <Label htmlFor={field.name}>Label</Label>
              <TranslatableInput
                id={field.name}
                name={field.name}
                value={field.state.value}
                language={selectedLanguage}
                onChange={field.handleChange}
                onBlur={field.handleBlur}
              />
            </FormItem>
          )}
        />
        <SelectLanguage value={selectedLanguage} onValueChange={setSelectedLanguage} />
      </div>
    </form>
  );
};

export default GroupNodeForm;
