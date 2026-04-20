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
      <FormItem className="mb-4">
        <Label className="mb-1">
          {label || node.data.name}
          {node.data.required && <span className="text-red-500">*</span>}
        </Label>
        <div className="space-y-2">
          {node.data.options.map((option, index) => {
            const optionDescription = t(option.description);
            return (
              <div key={option.value + index} className="flex items-start gap-3">
                <Checkbox
                  id={`${id}-${option.value}`}
                  name={name}
                  checked={selectedValues.includes(String(option.value))}
                  onCheckedChange={(checked) => handleCheckboxChange(String(option.value), Boolean(checked))}
                  disabled={option.disabled}
                  className="mt-0.5"
                />
                <div className="flex flex-col">
                  <Label htmlFor={`${id}-${option.value}`} className="cursor-pointer font-normal text-sm">
                    {t(option.label) ? t(option.label) : option.value}
                  </Label>
                  {optionDescription && <span className="text-muted-foreground text-xs">{optionDescription}</span>}
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
    <FormItem className="mb-4">
      <div className="flex items-center gap-3">
        <Checkbox
          id={id}
          name={name}
          checked={typeof value === "boolean" ? value : false}
          onCheckedChange={(checked) => setValue(Boolean(checked))}
        />
        <div>
          <Label htmlFor={id} className="cursor-pointer font-medium text-sm">
            {label || node.data.name}
            {node.data.required && <span className="text-red-500">*</span>}
          </Label>
          {helperText && !error && <FormDescription>{helperText}</FormDescription>}
        </div>
      </div>
      {error && <FormError>{error}</FormError>}
    </FormItem>
  );
};

export default DefaultCheckboxInput;
