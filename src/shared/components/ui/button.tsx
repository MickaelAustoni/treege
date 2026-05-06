import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/shared/lib/utils";

const buttonVariants = cva(
  "tg:inline-flex tg:items-center tg:justify-center tg:gap-2 tg:whitespace-nowrap tg:rounded-md tg:text-sm tg:font-medium tg:transition-all tg:disabled:pointer-events-none tg:disabled:opacity-50 tg:[&_svg]:pointer-events-none tg:[&_svg:not([class*='size-'])]:size-4 tg:shrink-0 tg:[&_svg]:shrink-0 tg:outline-none tg:focus-visible:border-ring tg:focus-visible:ring-ring/50 tg:focus-visible:ring-[3px] tg:aria-invalid:ring-destructive/20 tg:dark:aria-invalid:ring-destructive/40 tg:aria-invalid:border-destructive",
  {
    defaultVariants: {
      size: "default",
      variant: "default",
    },
    variants: {
      size: {
        default: "tg:h-9 tg:px-4 tg:py-2 tg:has-[>svg]:px-3",
        icon: "tg:size-9",
        "icon-lg": "tg:size-10",
        "icon-sm": "tg:size-8",
        lg: "tg:h-10 tg:rounded-md tg:px-6 tg:has-[>svg]:px-4",
        sm: "tg:h-8 tg:rounded-md tg:gap-1.5 tg:px-3 tg:has-[>svg]:px-2.5",
        xs: "tg:h-6 tg:rounded-md tg:gap-1 tg:px-2 tg:text-xs tg:has-[>svg]:px-1.5",
      },
      variant: {
        default: "tg:bg-primary tg:text-primary-foreground tg:hover:bg-primary/90",
        destructive:
          "tg:bg-destructive tg:text-white tg:hover:bg-destructive/90 tg:focus-visible:ring-destructive/20 tg:dark:focus-visible:ring-destructive/40 tg:dark:bg-destructive/60",
        ghost: "tg:hover:bg-accent tg:hover:text-accent-foreground tg:dark:hover:bg-accent/50",
        icon: "tg:opacity-60 tg:hover:bg-transparent! tg:hover:opacity-100",
        link: "tg:text-primary tg:underline-offset-4 tg:hover:underline",
        outline:
          "tg:border tg:bg-background tg:shadow-xs tg:hover:bg-accent tg:hover:text-accent-foreground tg:dark:bg-input/30 tg:dark:border-input tg:dark:hover:bg-input/50",
        secondary: "tg:bg-secondary tg:text-secondary-foreground tg:hover:bg-secondary/80",
      },
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return <Comp data-slot="button" className={cn(buttonVariants({ className, size, variant }))} {...props} />;
}

export { Button, buttonVariants };
