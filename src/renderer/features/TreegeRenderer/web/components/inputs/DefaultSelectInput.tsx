import { useTranslate } from "@/renderer/hooks/useTranslate";
import { InputRenderProps } from "@/renderer/types/renderer";
import { FormDescription, FormError, FormItem } from "@/shared/components/ui/form";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";

const DefaultSelectInput = ({ node, value, setValue, error, label, placeholder, helperText, name, id }: InputRenderProps<"select">) => {
  const t = useTranslate();
  const normalizedValue = value ? String(value) : "";

  return (
    <FormItem className="tg:mb-4">
      <Label htmlFor={id}>
        {label || node.data.name}
        {node.data.required && <span className="tg:text-red-500">*</span>}
      </Label>
      <Select name={name} value={normalizedValue} onValueChange={(val) => setValue(val)}>
        <SelectTrigger id={id} name={name} className="tg:w-full">
          <SelectValue placeholder={placeholder || t("renderer.defaultSelectInput.selectOption")} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {node.data.options?.map((option, index) => {
              return (
                <SelectItem key={`${option.value}-${index}`} value={String(option.value)} disabled={option.disabled}>
                  {t(option.label) ? t(option.label) : option.value}
                </SelectItem>
              );
            })}
          </SelectGroup>
        </SelectContent>
      </Select>
      {error && <FormError>{error}</FormError>}
      {helperText && !error && <FormDescription>{helperText}</FormDescription>}
    </FormItem>
  );
};

export default DefaultSelectInput;
