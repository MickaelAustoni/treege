import * as SwitchPrimitive from "@radix-ui/react-switch";
import * as React from "react";

import { cn } from "@/shared/lib/utils";

function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "tg:peer tg:inline-flex tg:h-[1.15rem] tg:w-8 tg:shrink-0 tg:items-center tg:rounded-full tg:border tg:border-transparent tg:shadow-xs tg:outline-none tg:transition-all tg:focus-visible:border-ring tg:focus-visible:ring-[3px] tg:focus-visible:ring-ring/50 tg:disabled:cursor-not-allowed tg:disabled:opacity-50 tg:data-[state=checked]:bg-primary tg:data-[state=unchecked]:bg-input tg:dark:data-[state=unchecked]:bg-input/80",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "tg:pointer-events-none tg:block tg:size-4 tg:rounded-full tg:bg-background tg:ring-0 tg:transition-transform tg:data-[state=checked]:translate-x-[calc(100%-2px)] tg:data-[state=unchecked]:translate-x-0 tg:dark:data-[state=checked]:bg-primary-foreground tg:dark:data-[state=unchecked]:bg-foreground",
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
