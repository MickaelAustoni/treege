import { InputRenderProps } from "@/renderer/types/renderer";
import { FormDescription, FormError, FormItem } from "@/shared/components/ui/form";
import { Textarea } from "@/shared/components/ui/textarea";

const DefaultTextAreaInput = ({ field, extra }: InputRenderProps<"textarea">) => {
  const { id, name, value, placeholder } = field;
  const { InputLabel, node, setValue, error, label, helperText } = extra;

  return (
    <FormItem className="tg:mb-4">
      <InputLabel htmlFor={id} label={label} required={node.data.required} />
      <Textarea
        id={id}
        name={name}
        aria-label={label || node.data.name}
        value={value ?? ""}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="tg:w-full tg:rounded-md tg:border tg:px-3 tg:py-2"
        rows={4}
      />
      {error && <FormError>{error}</FormError>}
      {helperText && !error && <FormDescription>{helperText}</FormDescription>}
    </FormItem>
  );
};

export default DefaultTextAreaInput;
