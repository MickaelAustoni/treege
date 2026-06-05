import { InputExtraProps, InputFieldProps } from "@/renderer/types/renderer";
import { Input } from "@/shared/components/ui/input";

const DefaultHiddenInput = (field: InputFieldProps<"hidden">, _extra: InputExtraProps<"hidden">) => {
  const { id, name, value } = field;

  return <Input type="hidden" id={id} name={name} value={value ?? ""} />;
};

export default DefaultHiddenInput;
