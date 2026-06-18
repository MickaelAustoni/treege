import { ChevronDownIcon } from "lucide-react";
import { useState } from "react";
import { useTranslate } from "@/renderer/hooks/useTranslate";
import { InputRenderProps } from "@/renderer/types/renderer";
import { Button } from "@/shared/components/ui/button";
import { Calendar } from "@/shared/components/ui/calendar";
import { FormDescription, FormError, FormItem } from "@/shared/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";

const DefaultDateInput = ({ field, extra }: InputRenderProps<"date">) => {
  const [open, setOpen] = useState(false);
  const { id, name, value, placeholder } = field;
  const { InputLabel, node, setValue, error, label, helperText } = extra;
  const t = useTranslate();
  const dateValue = value ? new Date(value) : undefined;

  // Function to disable past dates if disablePast is enabled
  const isDateDisabled = (date: Date) => {
    if (node.data.disablePast) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date < today;
    }
    return false;
  };

  return (
    <FormItem className="tg:mb-4">
      <InputLabel htmlFor={id} label={label} required={node.data.required} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id={id}
            name={name}
            aria-label={label || node.data.name}
            className="tg:w-full tg:justify-between tg:font-normal"
          >
            {dateValue ? dateValue.toLocaleDateString() : placeholder || t("renderer.defaultInputs.selectDate")}
            <ChevronDownIcon className="tg:size-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="tg:w-auto tg:overflow-hidden tg:p-0" align="start">
          <Calendar
            mode="single"
            selected={dateValue}
            captionLayout="dropdown"
            disabled={isDateDisabled}
            onSelect={(date) => {
              setValue(date ? date.toISOString() : "");
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
      {error && <FormError>{error}</FormError>}
      {helperText && !error && <FormDescription>{helperText}</FormDescription>}
    </FormItem>
  );
};

export default DefaultDateInput;
