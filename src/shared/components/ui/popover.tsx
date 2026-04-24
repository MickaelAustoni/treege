import * as PopoverPrimitive from "@radix-ui/react-popover";
import * as React from "react";

import { cn } from "@/shared/lib/utils";

function Popover({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

function PopoverTrigger({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

function PopoverContent({
  className,
  align = "center",
  sideOffset = 4,
  disablePortal = false,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content> & {
  disablePortal?: boolean;
}) {
  const content = (
    <PopoverPrimitive.Content
      data-slot="popover-content"
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "tg:data-[state=closed]:fade-out-0 tg:data-[state=open]:fade-in-0 tg:data-[state=closed]:zoom-out-95 tg:data-[state=open]:zoom-in-95 tg:data-[side=bottom]:slide-in-from-top-2 tg:data-[side=left]:slide-in-from-right-2 tg:data-[side=right]:slide-in-from-left-2 tg:data-[side=top]:slide-in-from-bottom-2 tg:z-50 tg:w-72 tg:origin-(--radix-popover-content-transform-origin) tg:rounded-md tg:border tg:bg-popover tg:p-4 tg:text-popover-foreground tg:shadow-md tg:outline-hidden tg:data-[state=closed]:animate-out tg:data-[state=open]:animate-in",
        className,
      )}
      {...props}
    />
  );

  if (disablePortal) {
    return content;
  }

  return <PopoverPrimitive.Portal>{content}</PopoverPrimitive.Portal>;
}

function PopoverAnchor({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />;
}

export { Popover, PopoverAnchor, PopoverContent, PopoverTrigger };
