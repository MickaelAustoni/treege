import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { CheckIcon } from "lucide-react";
import * as React from "react";

import { cn } from "@/shared/lib/utils";

function Checkbox({ className, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "tg:peer tg:size-4 tg:shrink-0 tg:rounded-[4px] tg:border tg:border-input tg:shadow-xs tg:outline-none tg:transition-shadow tg:focus-visible:border-ring tg:focus-visible:ring-[3px] tg:focus-visible:ring-ring/50 tg:disabled:cursor-not-allowed tg:disabled:opacity-50 tg:aria-invalid:border-destructive tg:aria-invalid:ring-destructive/20 tg:data-[state=checked]:border-primary tg:data-[state=checked]:bg-primary tg:data-[state=checked]:text-primary-foreground tg:dark:bg-input/30 tg:dark:data-[state=checked]:bg-primary tg:dark:aria-invalid:ring-destructive/40",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="tg:grid tg:place-content-center tg:text-current tg:transition-none"
      >
        <CheckIcon className="tg:size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
