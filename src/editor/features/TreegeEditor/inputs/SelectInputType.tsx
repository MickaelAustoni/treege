import { useId } from "react";
import useTranslate from "@/editor/hooks/useTranslate";
import { getInputTypeIcon } from "@/editor/utils/inputTypeIcon";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { INPUT_TYPE } from "@/shared/constants/inputType";
import { InputType } from "@/shared/types/node";

export interface SelectInputTypeProps {
  value?: InputType;
  onValueChange?: (value: InputType) => void;
}

const SelectInputType = ({ value, onValueChange }: SelectInputTypeProps) => {
  const t = useTranslate();
  const id = useId();

  return (
    <SelectGroup>
      <SelectLabel htmlFor={id}>{t("editor.selectInputType.type")}</SelectLabel>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger id={id} className="w-full capitalize">
          <SelectValue placeholder="" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {Object.values(INPUT_TYPE).map((type) => {
              const Icon = getInputTypeIcon(type);

              return (
                <SelectItem key={type} value={type} className="capitalize">
                  <Icon />
                  {type}
                </SelectItem>
              );
            })}
          </SelectGroup>
        </SelectContent>
      </Select>
    </SelectGroup>
  );
};

export default SelectInputType;
