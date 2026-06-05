import { InputExtraProps, InputFieldProps } from "@/renderer/types/renderer";
import { FormDescription, FormError, FormItem } from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

const DefaultTimeInput = (field: InputFieldProps<"time">, extra: InputExtraProps<"time">) => {
  const { id, name, value, placeholder } = field;
  const { node, setValue, error, label, helperText } = extra;

  return (
    <FormItem className="tg:mb-4">
      <Label htmlFor={id}>
        {label || node.data.name}
        {node.data.required && <span className="tg:text-red-500">*</span>}
      </Label>
      <Input
        type="time"
        id={id}
        name={name}
        value={value ?? ""}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="tg:bg-background tg:[color-scheme:light] tg:dark:[color-scheme:dark]"
      />
      {error && <FormError>{error}</FormError>}
      {helperText && !error && <FormDescription>{helperText}</FormDescription>}
    </FormItem>
  );
};

export default DefaultTimeInput;
