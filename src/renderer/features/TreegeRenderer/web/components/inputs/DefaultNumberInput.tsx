import { InputExtraProps, InputFieldProps } from "@/renderer/types/renderer";
import { FormDescription, FormError, FormItem } from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

const DefaultNumberInput = (field: InputFieldProps<"number">, extra: InputExtraProps<"number">) => {
  const { id, name, value, placeholder } = field;
  const { node, setValue, error, label, helperText } = extra;

  return (
    <FormItem className="tg:mb-4">
      <Label htmlFor={id}>
        {label || node.data.name}
        {node.data.required && <span className="tg:text-red-500">*</span>}
      </Label>
      <Input
        id={id}
        type="number"
        name={name}
        value={value ?? ""}
        onChange={(e) => setValue(e.target.value === "" ? null : Number(e.target.value))}
        placeholder={placeholder}
      />
      {error && <FormError>{error}</FormError>}
      {helperText && !error && <FormDescription>{helperText}</FormDescription>}
    </FormItem>
  );
};

export default DefaultNumberInput;
