import * as LabelPrimitive from "@radix-ui/react-label";
import * as React from "react";
import { cn } from "@/shared/lib/utils";

const Label = ({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>) => (
  <LabelPrimitive.Root
    data-slot="label"
    className={cn(
      "tg:flex tg:select-none tg:items-center tg:gap-2 tg:font-medium tg:text-muted-foreground tg:text-sm tg:leading-none tg:peer-disabled:cursor-not-allowed tg:peer-disabled:opacity-50 tg:group-data-[disabled=true]:pointer-events-none tg:group-data-[disabled=true]:opacity-50",
      className,
    )}
    {...props}
  />
);

export { Label };
