import { ComponentProps } from "react";
import { Input } from "@/shared/components/ui/input";
import { Translatable } from "@/shared/types/translate";
import { getTranslatableValue, setTranslatableValue } from "@/shared/utils/translations";

interface TranslatableInputProps extends Omit<ComponentProps<typeof Input>, "value" | "onChange"> {
  /** Current translatable value (per-language object). */
  value: Translatable | undefined;
  /** Language entry being edited. */
  language: string;
  /** Receives the updated, always-object value (never a spread-corrupted string). */
  onChange: (value: Translatable) => void;
}

/**
 * Text input bound to a single language entry of a translatable field. Reading
 * and writing go through the translatable helpers, so a plain-string value is
 * shown for any language and is safely coerced on edit instead of being spread
 * into indexed character keys. Use this for every translatable field edited in
 * the editor.
 */
const TranslatableInput = ({ value, language, onChange, ...props }: TranslatableInputProps) => (
  <Input
    {...props}
    value={getTranslatableValue(value, language)}
    onChange={({ target }) => onChange(setTranslatableValue(value, language, target.value))}
  />
);

export default TranslatableInput;
