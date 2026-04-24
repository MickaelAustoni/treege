import { useTranslate } from "@/renderer/hooks/useTranslate";
import { InputRenderProps } from "@/renderer/types/renderer";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { FormDescription, FormError, FormItem } from "@/shared/components/ui/form";
import { Label } from "@/shared/components/ui/label";

const DefaultCheckboxInput = ({ node, value, setValue, error, label, helperText, id, name }: InputRenderProps<"checkbox">) => {
  const t = useTranslate();

  // If there are options, render a checkbox group (multiple checkboxes)
  if (node.data.options && node.data.options.length > 0) {
    const selectedValues = Array.isArray(value) ? value.map(String) : [];

    const handleCheckboxChange = (optionValue: string, checked: boolean) => {
      const newValues = checked ? [...selectedValues, optionValue] : selectedValues.filter((v) => v !== optionValue);
      setValue(newValues);
    };

    return (
      <FormItem className="tg:mb-4">
        <Label className="tg:mb-1">
          {label || node.data.name}
          {node.data.required && <span className="tg:text-red-500">*</span>}
        </Label>
        <div className="tg:space-y-2">
          {node.data.options.map((option, index) => {
            const optionDescription = t(option.description);
            return (
              <div key={option.value + index} className="tg:flex tg:items-start tg:gap-3">
                <Checkbox
                  id={`${id}-${option.value}`}
                  name={name}
                  checked={selectedValues.includes(String(option.value))}
                  onCheckedChange={(checked) => handleCheckboxChange(String(option.value), Boolean(checked))}
                  disabled={option.disabled}
                  className="tg:mt-0.5"
                />
                <div className="tg:flex tg:flex-col">
                  <Label htmlFor={`${id}-${option.value}`} className="tg:cursor-pointer tg:font-normal tg:text-sm">
                    {t(option.label) ? t(option.label) : option.value}
                  </Label>
                  {optionDescription && <span className="tg:text-muted-foreground tg:text-xs">{optionDescription}</span>}
                </div>
              </div>
            );
          })}
        </div>
        {error && <FormError>{error}</FormError>}
        {helperText && !error && <FormDescription>{helperText}</FormDescription>}
      </FormItem>
    );
  }

  // Single checkbox (no options)
  return (
    <FormItem className="tg:mb-4">
      <div className="tg:flex tg:items-center tg:gap-3">
        <Checkbox
          id={id}
          name={name}
          checked={typeof value === "boolean" ? value : false}
          onCheckedChange={(checked) => setValue(Boolean(checked))}
        />
        <div>
          <Label htmlFor={id} className="tg:cursor-pointer tg:font-medium tg:text-sm">
            {label || node.data.name}
            {node.data.required && <span className="tg:text-red-500">*</span>}
          </Label>
          {helperText && !error && <FormDescription>{helperText}</FormDescription>}
        </div>
      </div>
      {error && <FormError>{error}</FormError>}
    </FormItem>
  );
};

export default DefaultCheckboxInput;
