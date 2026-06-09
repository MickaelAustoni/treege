import { Loader2 } from "lucide-react";
import { ButtonHTMLAttributes, forwardRef } from "react";
import { useTranslate } from "@/renderer/hooks/useTranslate";

export interface SubmitButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
  /**
   * When true, shows a spinner inside the button (and keeps it disabled).
   */
  isSubmitting?: boolean;
}

/**
 * Default submit button
 */
const DefaultSubmitButton = forwardRef<HTMLButtonElement, SubmitButtonProps>(
  ({ label, id, disabled, isSubmitting, onBlur, onClick, onFocus, onPointerDown, onPointerLeave, onPointerMove, ...props }, ref) => {
    const t = useTranslate();

    return (
      <button
        ref={ref}
        id={id}
        onBlur={onBlur}
        onClick={onClick}
        onFocus={onFocus}
        onPointerDown={onPointerDown}
        disabled={disabled || isSubmitting}
        onPointerLeave={onPointerLeave}
        onPointerMove={onPointerMove}
        type="submit"
        className="tg:mt-4 tg:inline-flex tg:items-center tg:justify-center tg:gap-2 tg:rounded-md tg:bg-blue-500 tg:px-4 tg:py-2 tg:font-medium tg:text-white tg:transition-colors tg:hover:bg-blue-600 tg:focus:outline-none tg:focus:ring-2 tg:focus:ring-blue-500 tg:focus:ring-offset-2 tg:disabled:cursor-not-allowed tg:disabled:opacity-50"
        {...props}
      >
        {isSubmitting && <Loader2 className="tg:h-4 tg:w-4 tg:animate-spin" />}
        {label || t("renderer.defaultSubmitButton.submit")}
      </button>
    );
  },
);

export default DefaultSubmitButton;
