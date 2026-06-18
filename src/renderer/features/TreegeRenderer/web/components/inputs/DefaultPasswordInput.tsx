import { InputRenderProps } from "@/renderer/types/renderer";
import { FormDescription, FormError, FormItem } from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";

const DefaultPasswordInput = ({ field, extra }: InputRenderProps<"password">) => {
  const { id, name, value, placeholder } = field;
  const { InputLabel, node, setValue, error, label, helperText } = extra;

  return (
    <FormItem className="tg:mb-4">
      <InputLabel htmlFor={id} label={label} required={node.data.required} />
      <Input
        id={id}
        name={name}
        type="password"
        aria-label={label || node.data.name}
        value={value ?? ""}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        autoComplete="new-password"
      />
      {error && <FormError>{error}</FormError>}
      {helperText && !error && <FormDescription>{helperText}</FormDescription>}
    </FormItem>
  );
};

export default DefaultPasswordInput;
