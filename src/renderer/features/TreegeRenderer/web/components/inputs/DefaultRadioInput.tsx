import { useTranslate } from "@/renderer/hooks/useTranslate";
import { InputRenderProps } from "@/renderer/types/renderer";
import { FormDescription, FormError, FormItem } from "@/shared/components/ui/form";
import { Label } from "@/shared/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/shared/components/ui/radio-group";
import { cn } from "@/shared/lib/utils";

const DefaultRadioInput = ({ node, value, setValue, error, label, helperText, id, name }: InputRenderProps<"radio">) => {
  const t = useTranslate();
  const normalizedValue = value ? String(value) : "";
  const isCard = node.data.variant === "card";

  return (
    <FormItem className="tg:mb-4">
      <Label className="tg:mb-1" htmlFor={id}>
        {label || node.data.name}
        {node.data.required && <span className="tg:text-red-500">*</span>}
      </Label>
      <RadioGroup
        value={normalizedValue}
        onValueChange={(val) => setValue(val)}
        id={id}
        name={name}
        className={isCard ? "tg:flex tg:flex-col tg:gap-2" : undefined}
      >
        {node.data.options?.map((option, index) => {
          const optionId = `${id}-${option.value}`;
          const optionLabel = t(option.label) || option.value;
          const optionDescription = t(option.description);
          const isSelected = normalizedValue === String(option.value);

          if (isCard) {
            return (
              <Label
                key={option.value + index}
                htmlFor={optionId}
                className={cn(
                  "tg:flex tg:cursor-pointer tg:items-start tg:gap-3 tg:rounded-md tg:border tg:p-3 tg:transition-colors",
                  "tg:hover:border-primary/50",
                  isSelected && "tg:border-primary tg:bg-primary/5",
                  option.disabled && "tg:pointer-events-none tg:opacity-50",
                )}
              >
                <RadioGroupItem value={String(option.value)} id={optionId} disabled={option.disabled} className="tg:mt-1" />
                {option.image && <img src={option.image} alt="" className="tg:h-10 tg:w-10 tg:shrink-0 tg:rounded tg:object-cover" />}
                <div className="tg:flex tg:min-w-0 tg:flex-col">
                  <span className="tg:font-medium tg:text-sm">{optionLabel}</span>
                  {optionDescription && <span className="tg:text-muted-foreground tg:text-xs">{optionDescription}</span>}
                </div>
              </Label>
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
