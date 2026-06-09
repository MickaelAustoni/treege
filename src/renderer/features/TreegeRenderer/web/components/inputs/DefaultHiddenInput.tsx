import { InputRenderProps } from "@/renderer/types/renderer";
import { Input } from "@/shared/components/ui/input";

const DefaultHiddenInput = ({ field }: InputRenderProps<"hidden">) => {
  const { id, name, value } = field;

  return <Input type="hidden" id={id} name={name} value={value ?? ""} />;
};

export default DefaultHiddenInput;
