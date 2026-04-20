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
    <FormItem className="mb-4">
      <Label className="mb-1" htmlFor={id}>
        {label || node.data.name}
        {node.data.required && <span className="text-red-500">*</span>}
      </Label>
      <RadioGroup
        value={normalizedValue}
        onValueChange={(val) => setValue(val)}
        id={id}
        name={name}
        className={isCard ? "flex flex-col gap-2" : undefined}
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
                  "flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors",
                  "hover:border-primary/50",
                  isSelected && "border-primary bg-primary/5",
                  option.disabled && "pointer-events-none opacity-50",
                )}
              >
                <RadioGroupItem value={String(option.value)} id={optionId} disabled={option.disabled} className="mt-1" />
                {option.image && <img src={option.image} alt="" className="h-10 w-10 shrink-0 rounded object-cover" />}
                <div className="flex min-w-0 flex-col">
                  <span className="font-medium text-sm">{optionLabel}</span>
                  {optionDescription && <span className="text-muted-foreground text-xs">{optionDescription}</span>}
                </div>
              </Label>
            );
          }

          return (
            <div key={option.value + index} className="flex items-start space-x-2">
              <RadioGroupItem value={String(option.value)} id={optionId} disabled={option.disabled} className="mt-0.5" />
              {option.image && <img src={option.image} alt="" className="h-8 w-8 rounded object-cover" />}
              <div className="flex flex-col">
                <Label htmlFor={optionId} className="cursor-pointer font-normal text-sm">
                  {optionLabel}
                </Label>
                {optionDescription && <span className="text-muted-foreground text-xs">{optionDescription}</span>}
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
