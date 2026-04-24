import * as React from "react";
import { cn } from "@/shared/lib/utils";

function FormItem({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="form-item" className={cn("tg:grid tg:gap-2", className)} {...props} />;
}

function FormDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p data-slot="form-description" className={cn("tg:text-muted-foreground tg:text-xs", className)} {...props} />;
}

function FormError({ className, ...props }: React.ComponentProps<"p">) {
  return <p data-slot="form-error" className={cn("tg:text-destructive tg:text-xs", className)} {...props} />;
}

export { FormDescription, FormError, FormItem };
