import type { InputLabelRenderProps } from "@/renderer/types/renderer";
import { Label } from "@/shared/components/ui/label";

/**
 * Default input label (web). Renders nothing when no end-user label is
 * configured, so the technical node key (`node.data.name`) never leaks into the
 * rendered form. Inputs keep an accessible name through an `aria-label` fallback
 * on the field itself. Override globally via `components.inputLabel`.
 */
const DefaultInputLabel = ({ label, required, htmlFor, id, className }: InputLabelRenderProps) => {
  if (!label) {
    return null;
  }

  return (
    <Label htmlFor={htmlFor} id={id} className={className}>
      {label}
      {required && <span className="tg:text-red-500">*</span>}
    </Label>
  );
};

export default DefaultInputLabel;
