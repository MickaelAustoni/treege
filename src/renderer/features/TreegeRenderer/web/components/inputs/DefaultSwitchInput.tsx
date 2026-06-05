import { InputExtraProps, InputFieldProps } from "@/renderer/types/renderer";
import { FormDescription, FormError, FormItem } from "@/shared/components/ui/form";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";

const DefaultSwitchInput = (field: InputFieldProps<"switch">, extra: InputExtraProps<"switch">) => {
  const { id, name, value } = field;
  const { node, setValue, error, label, helperText } = extra;

  return (
    <FormItem className="tg:mb-4">
      <Label htmlFor={id}>
        {label || node.data.name}
        {node.data.required && <span className="tg:text-red-500">*</span>}
      </Label>
      <Switch id={id} name={name} checked={value} onCheckedChange={setValue} />
      {helperText && !error && <FormDescription>{helperText}</FormDescription>}
      {error && <FormError>{error}</FormError>}
    </FormItem>
  );
};

export default DefaultSwitchInput;
