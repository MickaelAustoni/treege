import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { Separator } from "@/shared/components/ui/separator";
import { cn } from "@/shared/lib/utils";

function ItemGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: generic container holding Item rows, not <li> elements
    <div role="list" data-slot="item-group" className={cn("tg:group/item-group tg:flex tg:flex-col", className)} {...props} />
  );
}

function ItemSeparator({ className, ...props }: React.ComponentProps<typeof Separator>) {
  return <Separator data-slot="item-separator" orientation="horizontal" className={cn("tg:my-0", className)} {...props} />;
}

const itemVariants = cva(
  "tg:group/item tg:flex tg:flex-wrap tg:items-center tg:rounded-md tg:border tg:border-transparent tg:text-sm tg:outline-none tg:transition-colors tg:duration-100 tg:focus-visible:border-ring tg:focus-visible:ring-[3px] tg:focus-visible:ring-ring/50 tg:[a]:transition-colors tg:[a]:hover:bg-accent/50",
  {
    defaultVariants: {
      size: "default",
      variant: "default",
    },
    variants: {
      size: {
        default: "tg:gap-4 tg:p-4",
        sm: "tg:gap-2.5 tg:px-4 tg:py-3",
      },
      variant: {
        default: "tg:bg-transparent",
        muted: "tg:bg-muted/50",
        outline: "tg:border-border",
      },
    },
  },
);

function Item({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof itemVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "div";
  return (
    <Comp data-slot="item" data-variant={variant} data-size={size} className={cn(itemVariants({ className, size, variant }))} {...props} />
  );
}

const itemMediaVariants = cva(
  "tg:flex tg:shrink-0 tg:items-center tg:justify-center tg:gap-2 tg:group-has-[[data-slot=item-description]]/item:translate-y-0.5 tg:group-has-[[data-slot=item-description]]/item:self-start tg:[&_svg]:pointer-events-none",
  {
    defaultVariants: {
      variant: "default",
    },
    variants: {
      variant: {
        default: "tg:bg-transparent",
        icon: "tg:size-8 tg:rounded-sm tg:border tg:bg-muted tg:[&_svg:not([class*='size-'])]:size-4",
        image: "tg:size-10 tg:overflow-hidden tg:rounded-sm tg:[&_img]:size-full tg:[&_img]:object-cover",
      },
    },
  },
);

function ItemMedia({ className, variant = "default", ...props }: React.ComponentProps<"div"> & VariantProps<typeof itemMediaVariants>) {
  return <div data-slot="item-media" data-variant={variant} className={cn(itemMediaVariants({ className, variant }))} {...props} />;
}

function ItemContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-content"
      className={cn("tg:flex tg:flex-1 tg:flex-col tg:gap-1 tg:[&+[data-slot=item-content]]:flex-none", className)}
      {...props}
    />
  );
}

function ItemTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-title"
      className={cn("tg:flex tg:w-fit tg:items-center tg:gap-2 tg:font-medium tg:text-sm tg:leading-snug", className)}
      {...props}
    />
  );
}

function ItemDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="item-description"
      className={cn(
        "tg:line-clamp-2 tg:text-balance tg:font-normal tg:text-muted-foreground tg:text-sm tg:leading-normal",
        "tg:[&>a]:underline tg:[&>a]:underline-offset-4 tg:[&>a:hover]:text-primary",
        className,
      )}
      {...props}
    />
  );
}

function ItemActions({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="item-actions" className={cn("tg:flex tg:items-center tg:gap-2", className)} {...props} />;
}

function ItemHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-header"
      className={cn("tg:flex tg:basis-full tg:items-center tg:justify-between tg:gap-2", className)}
      {...props}
    />
  );
}

function ItemFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-footer"
      className={cn("tg:flex tg:basis-full tg:items-center tg:justify-between tg:gap-2", className)}
      {...props}
    />
  );
}

export { Item, ItemActions, ItemContent, ItemDescription, ItemFooter, ItemGroup, ItemHeader, ItemMedia, ItemSeparator, ItemTitle };
