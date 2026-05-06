import { Loader2 } from "lucide-react";
import { useTreegeRendererContext } from "@/renderer/context/TreegeRendererContext";
import { useInputOptions } from "@/renderer/hooks/useInputOptions";
import { useTranslate } from "@/renderer/hooks/useTranslate";
import { InputRenderProps } from "@/renderer/types/renderer";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { FormDescription, FormError, FormItem } from "@/shared/components/ui/form";
import { Label } from "@/shared/components/ui/label";

const DefaultCheckboxInput = ({ node, value, setValue, error, label, helperText, id, name }: InputRenderProps<"checkbox">) => {
  const { options, isLoading, error: inputOptionsError } = useInputOptions(node);
  const { optionsDisplayLimit } = useTreegeRendererContext();
  const t = useTranslate();

  // If there are options (static or dynamic), render a checkbox group
  if (options.length > 0 || node.data.optionsSource) {
    const selectedValues = Array.isArray(value) ? value.map(String) : [];
    const visibleOptions = optionsDisplayLimit ? options.slice(0, optionsDisplayLimit) : options;
    const hiddenCount = options.length - visibleOptions.length;

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
        {isLoading && (
          <div className="tg:flex tg:items-center tg:gap-2 tg:py-2 tg:text-muted-foreground tg:text-sm">
            <Loader2 className="tg:h-4 tg:w-4 tg:animate-spin" />
            <span>{t("renderer.defaultCheckboxInput.loadingOptions")}</span>
          </div>
        )}
        <div className="tg:space-y-2">
          {visibleOptions.map((option, index) => {
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
          {hiddenCount > 0 && <div className="tg:px-2 tg:text-muted-foreground tg:text-xs">…</div>}
        </div>
        {error && <FormError>{error}</FormError>}
        {inputOptionsError && !error && <FormError>{inputOptionsError}</FormError>}
        {helperText && !error && !inputOptionsError && <FormDescription>{helperText}</FormDescription>}
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
