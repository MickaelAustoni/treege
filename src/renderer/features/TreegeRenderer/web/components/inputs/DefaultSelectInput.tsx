import { Loader2 } from "lucide-react";
import DependencyHint from "@/renderer/features/TreegeRenderer/web/components/DependencyHint";
import { useInputOptions } from "@/renderer/hooks/useInputOptions";
import { useTranslate } from "@/renderer/hooks/useTranslate";
import { InputExtraProps, InputFieldProps } from "@/renderer/types/renderer";
import { FormDescription, FormError, FormItem } from "@/shared/components/ui/form";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";

const DefaultSelectInput = (field: InputFieldProps<"select">, extra: InputExtraProps<"select">) => {
  const { id, name, value, placeholder } = field;
  const { node, setValue, error, label, helperText, missingDependencies: missing } = extra;
  const { options, isLoading, error: inputOptionsError } = useInputOptions(node);
  const t = useTranslate();
  const normalizedValue = value ? String(value) : "";

  return (
    <FormItem className="tg:mb-4">
      <Label htmlFor={id}>
        {label || node.data.name}
        {node.data.required && <span className="tg:text-red-500">*</span>}
      </Label>
      <DependencyHint missing={missing}>
        <Select name={name} value={normalizedValue} onValueChange={(val) => setValue(val)} disabled={isLoading || missing.length > 0}>
          <SelectTrigger id={id} name={name} className="tg:w-full">
            {isLoading && <Loader2 className="tg:mr-2 tg:h-4 tg:w-4 tg:animate-spin" />}
            <SelectValue placeholder={placeholder || t("renderer.defaultSelectInput.selectOption")} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {options.map((option, index) => {
                return (
                  <SelectItem key={`${option.value}-${index}`} value={String(option.value)} disabled={option.disabled}>
                    {t(option.label) ? t(option.label) : option.value}
                  </SelectItem>
                );
              })}
            </SelectGroup>
          </SelectContent>
        </Select>
      </DependencyHint>
      {error && <FormError>{error}</FormError>}
      {inputOptionsError && !error && <FormError>{inputOptionsError}</FormError>}
      {helperText && !error && !inputOptionsError && <FormDescription>{helperText}</FormDescription>}
    </FormItem>
  );
};

export default DefaultSelectInput;
