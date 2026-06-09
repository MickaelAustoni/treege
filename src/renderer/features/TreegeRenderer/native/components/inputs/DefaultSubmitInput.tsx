import { InputExtraProps, InputFieldProps } from "@/renderer/types/renderer";

/**
 * The `submit` input node is declarative only: it marks where the flow submits
 * and carries the optional custom label / `submitConfig`. The actual submit
 * button is rendered once by the step (see `DefaultStep`), so the node itself
 * renders nothing — guaranteeing a single, consistently-placed button whether
 * submission comes from an explicit submit node, the default "Submit", or a
 * "Continue" step.
 */
const DefaultSubmitInput = (_field: InputFieldProps<"submit">, _extra: InputExtraProps<"submit">) => null;

export default DefaultSubmitInput;
