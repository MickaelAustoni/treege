import * as React from "react";

import { cn } from "@/shared/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "tg:field-sizing-content tg:flex tg:min-h-16 tg:w-full tg:rounded-md tg:border tg:border-input tg:bg-transparent tg:px-3 tg:py-2 tg:text-base tg:shadow-xs tg:outline-none tg:transition-[color,box-shadow] tg:placeholder:text-muted-foreground tg:focus-visible:border-ring tg:focus-visible:ring-[3px] tg:focus-visible:ring-ring/50 tg:disabled:cursor-not-allowed tg:disabled:opacity-50 tg:aria-invalid:border-destructive tg:aria-invalid:ring-destructive/20 tg:md:text-sm tg:dark:bg-input/30 tg:dark:aria-invalid:ring-destructive/40",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
