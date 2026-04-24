import { ChevronDownIcon } from "lucide-react";
import { useState } from "react";
import { DateRange } from "react-day-picker";
import { useTranslate } from "@/renderer/hooks/useTranslate";
import { InputRenderProps } from "@/renderer/types/renderer";
import { Button } from "@/shared/components/ui/button";
import { Calendar } from "@/shared/components/ui/calendar";
import { FormDescription, FormError, FormItem } from "@/shared/components/ui/form";
import { Label } from "@/shared/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";

const DefaultDateRangeInput = ({ node, value, setValue, error, label, helperText, id }: InputRenderProps<"daterange">) => {
  const [open, setOpen] = useState(false);
  const t = useTranslate();
  const dateRange = Array.isArray(value) ? value : [];
  const startDate = dateRange[0] ? new Date(dateRange[0]) : undefined;
  const endDate = dateRange[1] ? new Date(dateRange[1]) : undefined;

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    setValue([range?.from ? range.from.toISOString() : undefined, range?.to ? range.to.toISOString() : undefined]);
  };

  const formatDateRange = () => {
    if (startDate && endDate) {
      return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
    }
    if (startDate) {
      return startDate.toLocaleDateString();
    }
    return t("renderer.defaultInputs.selectDateRange");
  };

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
      <Label htmlFor={id}>
        {label || node.data.name}
        {node.data.required && <span className="tg:text-red-500">*</span>}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button id={id} variant="outline" className="tg:w-full tg:justify-between tg:font-normal">
            {formatDateRange()}
            <ChevronDownIcon className="tg:size-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="tg:w-auto tg:overflow-hidden tg:p-0" align="start">
          <Calendar
            mode="range"
            selected={{ from: startDate, to: endDate }}
            captionLayout="dropdown"
            disabled={isDateDisabled}
            onSelect={handleDateRangeSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
      {error && <FormError>{error}</FormError>}
      {helperText && !error && <FormDescription>{helperText}</FormDescription>}
    </FormItem>
  );
};

export default DefaultDateRangeInput;
