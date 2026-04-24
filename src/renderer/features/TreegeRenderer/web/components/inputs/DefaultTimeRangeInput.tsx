import { useTranslate } from "@/renderer/hooks/useTranslate";
import { InputRenderProps } from "@/renderer/types/renderer";
import { FormDescription, FormError, FormItem } from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

const DefaultTimeRangeInput = ({ node, value, setValue, error, label, helperText, id, name }: InputRenderProps<"timerange">) => {
  const t = useTranslate();
  const timeRange = Array.isArray(value) ? value : [];
  const startTime = timeRange[0] || "";
  const endTime = timeRange[1] || "";

  const handleStartTimeChange = (newValue: string) => {
    setValue([newValue, endTime]);
  };

  const handleEndTimeChange = (newValue: string) => {
    setValue([startTime, newValue]);
  };

  return (
    <FormItem className="tg:mb-4">
      <Label htmlFor={`${id}-start`}>
        {label || node.data.name}
        {node.data.required && <span className="tg:text-red-500">*</span>}
      </Label>
      <div className="tg:flex tg:gap-2">
        <Input
          id={`${id}-start`}
          name={`${name}-start`}
          aria-label={`${label || node.data.name} - ${t("renderer.defaultInputs.startTime")}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${node.id}-error` : undefined}
          type="time"
          value={startTime}
          onChange={(e) => handleStartTimeChange(e.target.value)}
          placeholder={t("renderer.defaultInputs.startTime")}
          className="tg:flex-1 tg:bg-background tg:[color-scheme:light] tg:dark:[color-scheme:dark]"
        />
        <Input
          id={`${id}-end`}
          name={`${name}-end`}
          aria-label={`${label || node.data.name} - ${t("renderer.defaultInputs.endTime")}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${node.id}-error` : undefined}
          type="time"
          value={endTime}
          onChange={(e) => handleEndTimeChange(e.target.value)}
          placeholder={t("renderer.defaultInputs.endTime")}
          className="tg:flex-1 tg:bg-background tg:[color-scheme:light] tg:dark:[color-scheme:dark]"
        />
      </div>
      {error && <FormError>{error}</FormError>}
      {helperText && !error && <FormDescription>{helperText}</FormDescription>}
    </FormItem>
  );
};

export default DefaultTimeRangeInput;
