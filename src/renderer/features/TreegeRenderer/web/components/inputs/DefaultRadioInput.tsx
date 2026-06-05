import { Loader2 } from "lucide-react";
import { useTreegeRendererContext } from "@/renderer/context/TreegeRendererContext";
import { DependencyHintMessage } from "@/renderer/features/TreegeRenderer/web/components/DependencyHint";
import { useInputOptions } from "@/renderer/hooks/useInputOptions";
import { useTranslate } from "@/renderer/hooks/useTranslate";
import { InputExtraProps, InputFieldProps } from "@/renderer/types/renderer";
import { Field, FieldContent, FieldDescription, FieldLabel, FieldTitle } from "@/shared/components/ui/field";
import { FormDescription, FormError, FormItem } from "@/shared/components/ui/form";
import { Label } from "@/shared/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/shared/components/ui/radio-group";
import { cn } from "@/shared/lib/utils";

const DefaultRadioInput = (field: InputFieldProps<"radio">, extra: InputExtraProps<"radio">) => {
  const { id, name, value } = field;
  const { node, setValue, error, label, helperText, renderOptionExtras, compactOptions, missingDependencies: missing } = extra;
  const { options, isLoading, error: inputOptionsError } = useInputOptions(node);
  const { optionsDisplayLimit } = useTreegeRendererContext();
  const t = useTranslate();
  const normalizedValue = value ? String(value) : "";
  const isCard = node.data.variant !== "default";
  const labelId = `${id}-label`;
  const visibleOptions = optionsDisplayLimit ? options.slice(0, optionsDisplayLimit) : options;
  const hiddenCount = options.length - visibleOptions.length;

  return (
    <FormItem className="tg:mb-4">
      <Label className="tg:mb-1" id={labelId}>
        {label || node.data.name}
        {node.data.required && <span className="tg:text-red-500">*</span>}
      </Label>
      <DependencyHintMessage missing={missing} />
      {isLoading && (
        <div className="tg:flex tg:items-center tg:gap-2 tg:py-2 tg:text-muted-foreground tg:text-sm">
          <Loader2 className="tg:h-4 tg:w-4 tg:animate-spin" />
          <span>{t("renderer.defaultRadioInput.loadingOptions")}</span>
        </div>
      )}
      <RadioGroup
        value={normalizedValue}
        onValueChange={(val) => setValue(val)}
        aria-labelledby={labelId}
        name={name}
        className={cn("tg:min-w-0", isCard && "tg:flex tg:flex-col tg:gap-2")}
      >
        {visibleOptions.map((option, index) => {
          const optionId = `${id}-${option.value}`;
          const optionLabel = t(option.label) || option.value;
          const optionDescription = t(option.description);
          const optionValue = String(option.value);

          if (isCard) {
            return (
              <FieldLabel
                key={option.value + index}
                htmlFor={optionId}
                className={cn("tg:group/option tg:pointer-events-auto tg:relative", compactOptions && "tg:group-hover/option:pr-16")}
              >
                <Field orientation="horizontal" data-disabled={option.disabled || undefined}>
                  {option.image && (
                    <img src={option.image} alt="" className="tg:h-10 tg:w-10 tg:shrink-0 tg:self-center tg:rounded tg:object-cover" />
                  )}
                  <FieldContent className={cn(compactOptions && "tg:min-w-0 tg:flex-1 tg:overflow-hidden")}>
                    <FieldTitle className={cn(compactOptions && "tg:block tg:max-w-full tg:truncate")}>{optionLabel}</FieldTitle>
                    {optionDescription && (
                      <FieldDescription className={cn(compactOptions && "tg:block tg:max-w-full tg:truncate")}>
                        {optionDescription}
                      </FieldDescription>
                    )}
                  </FieldContent>
                  <RadioGroupItem
                    value={optionValue}
                    id={optionId}
                    disabled={option.disabled}
                    className={cn(compactOptions && "tg:ml-auto tg:shrink-0 tg:group-hover/option:invisible")}
                  />
                </Field>
                {renderOptionExtras?.({ index, option, variant: "card" })}
              </FieldLabel>
            );
          }

          return (
            <div
              key={option.value + index}
              className={cn(
                "tg:group/option tg:pointer-events-auto tg:relative tg:flex tg:items-start tg:space-x-2",
                // `min-w-0` lets the flex children (text wrapper) actually shrink
                // when the row itself sits inside a constrained parent — without
                // it the row keeps its content's natural width and overflows.
                // `pr-22` (~88px) reserves room for the editor overlay
                // (value + edit / delete buttons) so the truncated label
                // doesn't slip behind it.
                compactOptions && "tg:min-w-0 tg:pr-22",
              )}
            >
              <RadioGroupItem value={optionValue} id={optionId} disabled={option.disabled} className="tg:mt-0.5" />
              {option.image && <img src={option.image} alt="" className="tg:h-8 tg:w-8 tg:rounded tg:object-cover" />}
              <div className={cn("tg:flex tg:flex-col", compactOptions && "tg:min-w-0 tg:flex-1 tg:overflow-hidden")}>
                <Label
                  htmlFor={optionId}
                  className={cn("tg:cursor-pointer tg:font-normal tg:text-sm", compactOptions && "tg:block tg:max-w-full tg:truncate")}
                >
                  {optionLabel}
                </Label>
                {optionDescription && (
                  <span className={cn("tg:text-muted-foreground tg:text-xs", compactOptions && "tg:block tg:max-w-full tg:truncate")}>
                    {optionDescription}
                  </span>
                )}
              </div>
              {renderOptionExtras?.({ index, option, variant: "default" })}
            </div>
          );
        })}
        {hiddenCount > 0 && <div className="tg:px-2 tg:py-1 tg:text-muted-foreground tg:text-xs">…</div>}
      </RadioGroup>
      {error && <FormError>{error}</FormError>}
      {inputOptionsError && !error && <FormError>{inputOptionsError}</FormError>}
      {helperText && !error && !inputOptionsError && <FormDescription>{helperText}</FormDescription>}
    </FormItem>
  );
};

export default DefaultRadioInput;
