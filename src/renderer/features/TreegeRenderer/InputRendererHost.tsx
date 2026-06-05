import { InputExtraProps, InputFieldProps, InputRenderer } from "@/renderer/types/renderer";
import { InputType } from "@/shared/types/node";

interface InputRendererHostProps<T extends InputType> {
  render: InputRenderer<T>;
  field: InputFieldProps<T>;
  extra: InputExtraProps<T>;
}

/**
 * Renders an input renderer (`(field, extra) => ReactNode`) inside a real
 * component boundary so the renderer can safely call hooks. Callers must give
 * this a stable `key` per node (and input type) so each input keeps a
 * consistent hook order across re-renders.
 */
function InputRendererHost<T extends InputType>({ render, field, extra }: InputRendererHostProps<T>) {
  return <>{render(field, extra)}</>;
}

export default InputRendererHost;
