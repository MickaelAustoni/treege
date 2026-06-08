import { Loader2 } from "lucide-react";
import { useTreegeRenderRuntime } from "@/renderer/context/TreegeRenderRuntimeProvider";
import { DependencyHintMessage } from "@/renderer/features/TreegeRenderer/web/components/DependencyHint";
import { useInputOptions } from "@/renderer/hooks/useInputOptions";
import { useTranslate } from "@/renderer/hooks/useTranslate";
import { InputExtraProps, InputFieldProps } from "@/renderer/types/renderer";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { FormDescription, FormError, FormItem } from "@/shared/components/ui/form";
import { Label } from "@/shared/components/ui/label";
import { cn } from "@/shared/lib/utils";

const DefaultCheckboxInput = (field: InputFieldProps<"checkbox">, extra: InputExtraProps<"checkbox">) => {
  const { id, name, value } = field;
  const { node, setValue, error, label, helperText, renderOptionExtras, compactOptions, missingDependencies: missing } = extra;
  const { options, isLoading, error: inputOptionsError } = useInputOptions(node);
  const { optionsDisplayLimit } = useTreegeRenderRuntime();
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
        <DependencyHintMessage missing={missing} />
        {isLoading && (
          <div className="tg:flex tg:items-center tg:gap-2 tg:py-2 tg:text-muted-foreground tg:text-sm">
            <Loader2 className="tg:h-4 tg:w-4 tg:animate-spin" />
            <span>{t("renderer.defaultCheckboxInput.loadingOptions")}</span>
          </div>
        )}
        <div className="tg:min-w-0 tg:space-y-2">
          {visibleOptions.map((option, index) => {
            const optionDescription = t(option.description);
            return (
              <div
                key={option.value + index}
                className={cn(
                  "tg:group/option tg:pointer-events-auto tg:relative tg:flex tg:items-start tg:gap-3",
                  compactOptions && "tg:pr-22",
                )}
              >
                <Checkbox
                  id={`${id}-${option.value}`}
                  name={name}
                  checked={selectedValues.includes(String(option.value))}
                  onCheckedChange={(checked) => handleCheckboxChange(String(option.value), Boolean(checked))}
                  disabled={option.disabled}
                  className="tg:mt-0.5"
                />
                {option.image && <img src={option.image} alt="" className="tg:h-8 tg:w-8 tg:shrink-0 tg:rounded tg:object-cover" />}
                <div className={cn("tg:flex tg:flex-col", compactOptions && "tg:min-w-0 tg:flex-1 tg:overflow-hidden")}>
                  <Label
                    htmlFor={`${id}-${option.value}`}
                    className={cn("tg:cursor-pointer tg:font-normal tg:text-sm", compactOptions && "tg:block tg:max-w-full tg:truncate")}
                  >
                    {t(option.label) ? t(option.label) : option.value}
                  </Label>
                  {optionDescription && (
                    <span className={cn("tg:text-muted-foreground tg:text-xs", compactOptions && "tg:block tg:max-w-full tg:truncate")}>
                      {optionDescription}
                    </span>
                  )}
                </div>
                {renderOptionExtras?.({ index, option })}
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
