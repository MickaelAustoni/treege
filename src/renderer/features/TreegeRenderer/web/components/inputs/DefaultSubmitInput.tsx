import { InputRenderProps } from "@/renderer/types/renderer";

/**
 * The `submit` input node is declarative only: it marks where the flow submits
 * and carries the optional custom label / `submitConfig`. The actual submit
 * button is rendered once by the step (in its action row, next to Back) — see
 * `DefaultStep` — so the node itself renders nothing. This guarantees a single,
 * consistently-placed button whether submission comes from an explicit submit
 * node, the default "Submit", or a "Continue" step.
 */
const DefaultSubmitInput = (_props: InputRenderProps<"submit">) => null;

export default DefaultSubmitInput;
