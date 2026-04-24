import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { CircleIcon } from "lucide-react";
import * as React from "react";

import { cn } from "@/shared/lib/utils";

function RadioGroup({ className, ...props }: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return <RadioGroupPrimitive.Root data-slot="radio-group" className={cn("tg:grid tg:gap-3", className)} {...props} />;
}

function RadioGroupItem({ className, ...props }: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        "tg:aspect-square tg:size-4 tg:shrink-0 tg:rounded-full tg:border tg:border-input tg:text-primary tg:shadow-xs tg:outline-none tg:transition-[color,box-shadow] tg:focus-visible:border-ring tg:focus-visible:ring-[3px] tg:focus-visible:ring-ring/50 tg:disabled:cursor-not-allowed tg:disabled:opacity-50 tg:aria-invalid:border-destructive tg:aria-invalid:ring-destructive/20 tg:dark:bg-input/30 tg:dark:aria-invalid:ring-destructive/40",
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator data-slot="radio-group-indicator" className="tg:relative tg:flex tg:items-center tg:justify-center">
        <CircleIcon className="tg:-translate-x-1/2 tg:-translate-y-1/2 tg:absolute tg:top-1/2 tg:left-1/2 tg:size-2 tg:fill-primary" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
}

export { RadioGroup, RadioGroupItem };
