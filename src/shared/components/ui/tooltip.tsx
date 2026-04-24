import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import * as React from "react";

import { cn } from "@/shared/lib/utils";

function TooltipProvider({ delayDuration = 0, ...props }: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return <TooltipPrimitive.Provider data-slot="tooltip-provider" delayDuration={delayDuration} {...props} />;
}

function Tooltip({ ...props }: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return (
    <TooltipProvider>
      <TooltipPrimitive.Root data-slot="tooltip" {...props} />
    </TooltipProvider>
  );
}

function TooltipTrigger({ ...props }: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

function TooltipContent({ className, sideOffset = 0, children, ...props }: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "tg:fade-in-0 tg:zoom-in-95 tg:data-[state=closed]:fade-out-0 tg:data-[state=closed]:zoom-out-95 tg:data-[side=bottom]:slide-in-from-top-2 tg:data-[side=left]:slide-in-from-right-2 tg:data-[side=right]:slide-in-from-left-2 tg:data-[side=top]:slide-in-from-bottom-2 tg:z-50 tg:w-fit tg:origin-(--radix-tooltip-content-transform-origin) tg:animate-in tg:text-balance tg:rounded-md tg:bg-foreground tg:px-3 tg:py-1.5 tg:text-background tg:text-xs tg:data-[state=closed]:animate-out",
          className,
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="tg:z-50 tg:size-2.5 tg:translate-y-[calc(-50%_-_2px)] tg:rotate-45 tg:rounded-[2px] tg:bg-foreground tg:fill-foreground" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
