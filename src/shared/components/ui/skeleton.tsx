import type * as React from "react";

import { cn } from "@/shared/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="skeleton" className={cn("tg:animate-pulse tg:rounded-md tg:bg-accent", className)} {...props} />;
}

export { Skeleton };
