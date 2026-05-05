import { useTranslate } from "@/renderer/hooks/useTranslate";
import { InputRenderProps } from "@/renderer/types/renderer";
import { Field, FieldContent, FieldDescription, FieldLabel, FieldTitle } from "@/shared/components/ui/field";
import { FormDescription, FormError, FormItem } from "@/shared/components/ui/form";
import { Label } from "@/shared/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/shared/components/ui/radio-group";

const DefaultRadioInput = ({ node, value, setValue, error, label, helperText, id, name }: InputRenderProps<"radio">) => {
  const t = useTranslate();
  const normalizedValue = value ? String(value) : "";
  const isCard = node.data.variant !== "default";
  const labelId = `${id}-label`;

  return (
    <FormItem className="tg:mb-4">
      <Label className="tg:mb-1" id={labelId}>
        {label || node.data.name}
        {node.data.required && <span className="tg:text-red-500">*</span>}
      </Label>
      <RadioGroup
        value={normalizedValue}
        onValueChange={(val) => setValue(val)}
        aria-labelledby={labelId}
        name={name}
        className={isCard ? "tg:flex tg:flex-col tg:gap-2" : undefined}
      >
        {node.data.options?.map((option, index) => {
          const optionId = `${id}-${option.value}`;
          const optionLabel = t(option.label) || option.value;
          const optionDescription = t(option.description);

          if (isCard) {
            return (
              <FieldLabel key={option.value + index} htmlFor={optionId}>
                <Field orientation="horizontal" data-disabled={option.disabled || undefined}>
                  {option.image && (
                    <img src={option.image} alt="" className="tg:h-10 tg:w-10 tg:shrink-0 tg:self-center tg:rounded tg:object-cover" />
                  )}
                  <FieldContent>
                    <FieldTitle>{optionLabel}</FieldTitle>
                    {optionDescription && <FieldDescription>{optionDescription}</FieldDescription>}
                  </FieldContent>
                  <RadioGroupItem value={String(option.value)} id={optionId} disabled={option.disabled} />
                </Field>
              </FieldLabel>
            );
          }

          return (
            <div key={option.value + index} className="tg:flex tg:items-start tg:space-x-2">
              <RadioGroupItem value={String(option.value)} id={optionId} disabled={option.disabled} className="tg:mt-0.5" />
              {option.image && <img src={option.image} alt="" className="tg:h-8 tg:w-8 tg:rounded tg:object-cover" />}
              <div className="tg:flex tg:flex-col">
                <Label htmlFor={optionId} className="tg:cursor-pointer tg:font-normal tg:text-sm">
                  {optionLabel}
                </Label>
                {optionDescription && <span className="tg:text-muted-foreground tg:text-xs">{optionDescription}</span>}
              </div>
            </div>
          );
        })}
      </RadioGroup>
      {error && <FormError>{error}</FormError>}
      {helperText && !error && <FormDescription>{helperText}</FormDescription>}
    </FormItem>
  );
};

export default DefaultRadioInput;
