import { InputRenderProps } from "@/renderer/types/renderer";
import { FormDescription, FormError, FormItem } from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";

const DefaultTimeInput = ({ field, extra }: InputRenderProps<"time">) => {
  const { id, name, value, placeholder } = field;
  const { InputLabel, node, setValue, error, label, helperText } = extra;

  return (
    <FormItem className="tg:mb-4">
      <InputLabel htmlFor={id} label={label} required={node.data.required} />
      <Input
        type="time"
        id={id}
        name={name}
        aria-label={label || node.data.name}
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
