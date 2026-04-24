import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/shared/lib/utils";

const badgeVariants = cva(
  "tg:inline-flex tg:w-fit tg:shrink-0 tg:items-center tg:justify-center tg:gap-1 tg:overflow-hidden tg:rounded-full tg:border tg:border-transparent tg:px-2 tg:py-0.5 tg:text-xs tg:font-medium tg:whitespace-nowrap tg:transition-[color,box-shadow] tg:focus-visible:border-ring tg:focus-visible:ring-[3px] tg:focus-visible:ring-ring/50 tg:aria-invalid:border-destructive tg:aria-invalid:ring-destructive/20 tg:dark:aria-invalid:ring-destructive/40 tg:[&>svg]:pointer-events-none tg:[&>svg]:size-3",
  {
    defaultVariants: {
      variant: "default",
    },
    variants: {
      variant: {
        blue: "tg:bg-blue-500 tg:text-white tg:dark:bg-blue-600",
        default: "tg:border-transparent tg:bg-primary tg:text-primary-foreground tg:[a&]:hover:bg-primary/90",
        destructive:
          "tg:border-transparent tg:bg-destructive tg:text-white tg:[a&]:hover:bg-destructive/90 tg:focus-visible:ring-destructive/20 tg:dark:focus-visible:ring-destructive/40 tg:dark:bg-destructive/60",
        outline: "tg:border-foreground/30 tg:text-foreground tg:[a&]:hover:bg-accent tg:[a&]:hover:text-accent-foreground",
        purple: "tg:bg-purple-600 tg:hover:bg-purple-700 tg:text-white",
        secondary: "tg:border-transparent tg:bg-secondary tg:text-secondary-foreground tg:[a&]:hover:bg-secondary/90",
      },
    },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
