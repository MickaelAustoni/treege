"use client";

import * as TogglePrimitive from "@radix-ui/react-toggle";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/shared/lib/utils";

const toggleVariants = cva(
  "tg:inline-flex tg:items-center tg:justify-center tg:gap-2 tg:rounded-md tg:font-medium tg:text-sm tg:whitespace-nowrap tg:outline-none tg:transition-[color,box-shadow] tg:hover:bg-muted tg:hover:text-muted-foreground tg:focus-visible:border-ring tg:focus-visible:ring-[3px] tg:focus-visible:ring-ring/50 tg:disabled:pointer-events-none tg:disabled:opacity-50 tg:aria-invalid:border-destructive tg:aria-invalid:ring-destructive/20 tg:data-[state=on]:bg-accent tg:data-[state=on]:text-accent-foreground tg:dark:aria-invalid:ring-destructive/40 tg:[&_svg]:pointer-events-none tg:[&_svg]:shrink-0 tg:[&_svg:not([class*='size-'])]:size-4",
  {
    defaultVariants: {
      size: "default",
      variant: "default",
    },
    variants: {
      size: {
        default: "tg:h-9 tg:min-w-9 tg:px-2",
        lg: "tg:h-10 tg:min-w-10 tg:px-2.5",
        sm: "tg:h-8 tg:min-w-8 tg:px-1.5",
      },
      variant: {
        default: "tg:bg-transparent",
        outline: "tg:border tg:border-input tg:bg-transparent tg:shadow-xs tg:hover:bg-accent tg:hover:text-accent-foreground",
      },
    },
  },
);

function Toggle({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> & VariantProps<typeof toggleVariants>) {
  return <TogglePrimitive.Root data-slot="toggle" className={cn(toggleVariants({ className, size, variant }))} {...props} />;
}

export { Toggle, toggleVariants };
