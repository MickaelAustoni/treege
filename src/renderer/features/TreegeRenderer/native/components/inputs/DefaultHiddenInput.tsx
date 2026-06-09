import { InputRenderProps } from "@/renderer/types/renderer";

// Hidden input doesn't render anything but the value is still managed by the form
const DefaultHiddenInput = (_props: InputRenderProps<"hidden">) => {
  return null;
};

export default DefaultHiddenInput;
