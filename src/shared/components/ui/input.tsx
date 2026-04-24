import * as React from "react";

import { cn } from "@/shared/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "tg:h-9 tg:w-full tg:min-w-0 tg:rounded-md tg:border tg:border-input tg:bg-transparent tg:px-3 tg:py-1 tg:text-base tg:shadow-xs tg:outline-none tg:transition-[color,box-shadow] tg:selection:bg-primary tg:selection:text-primary-foreground tg:file:inline-flex tg:file:h-7 tg:file:border-0 tg:file:bg-transparent tg:file:font-medium tg:file:text-foreground tg:file:text-sm tg:placeholder:text-muted-foreground tg:disabled:pointer-events-none tg:disabled:cursor-not-allowed tg:disabled:opacity-50 tg:md:text-sm tg:dark:bg-input/30",
        "tg:focus-visible:border-ring tg:focus-visible:ring-[3px] tg:focus-visible:ring-ring/50",
        "tg:aria-invalid:border-destructive tg:aria-invalid:ring-destructive/20 tg:dark:aria-invalid:ring-destructive/40",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
