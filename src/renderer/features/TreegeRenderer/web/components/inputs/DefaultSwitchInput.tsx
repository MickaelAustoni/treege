import { InputRenderProps } from "@/renderer/types/renderer";
import { FormDescription, FormError, FormItem } from "@/shared/components/ui/form";
import { Switch } from "@/shared/components/ui/switch";

const DefaultSwitchInput = ({ field, extra }: InputRenderProps<"switch">) => {
  const { id, name, value } = field;
  const { InputLabel, node, setValue, error, label, helperText } = extra;

  return (
    <FormItem className="tg:mb-4">
      <InputLabel htmlFor={id} label={label} required={node.data.required} />
      <Switch id={id} name={name} aria-label={label || node.data.name} checked={value} onCheckedChange={setValue} />
      {helperText && !error && <FormDescription>{helperText}</FormDescription>}
      {error && <FormError>{error}</FormError>}
    </FormItem>
  );
};

export default DefaultSwitchInput;
