import { InputExtraProps, InputFieldProps } from "@/renderer/types/renderer";

// Hidden input doesn't render anything but the value is still managed by the form
const DefaultHiddenInput = (_field: InputFieldProps<"hidden">, _extra: InputExtraProps<"hidden">) => {
  return null;
};

export default DefaultHiddenInput;
