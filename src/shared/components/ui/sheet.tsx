import * as SheetPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";
import * as React from "react";

import { cn } from "@/shared/lib/utils";

function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger({ ...props }: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose({ ...props }: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetPortal({ ...props }: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

function SheetOverlay({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "tg:data-[state=closed]:fade-out-0 tg:data-[state=open]:fade-in-0 tg:fixed tg:inset-0 tg:z-50 tg:bg-black/50 tg:data-[state=closed]:animate-out tg:data-[state=open]:animate-in",
        className,
      )}
      {...props}
    />
  );
}

function SheetContent({
  className,
  children,
  side = "right",
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: "top" | "right" | "bottom" | "left";
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          "tg:fixed tg:z-50 tg:flex tg:flex-col tg:gap-4 tg:bg-background tg:shadow-lg tg:transition tg:ease-in-out tg:data-[state=closed]:animate-out tg:data-[state=open]:animate-in tg:data-[state=closed]:duration-300 tg:data-[state=open]:duration-500",
          side === "right" &&
            "tg:data-[state=closed]:slide-out-to-right tg:data-[state=open]:slide-in-from-right tg:inset-y-0 tg:right-0 tg:h-full tg:w-3/4 tg:border-l tg:sm:max-w-sm",
          side === "left" &&
            "tg:data-[state=closed]:slide-out-to-left tg:data-[state=open]:slide-in-from-left tg:inset-y-0 tg:left-0 tg:h-full tg:w-3/4 tg:border-r tg:sm:max-w-sm",
          side === "top" &&
            "tg:data-[state=closed]:slide-out-to-top tg:data-[state=open]:slide-in-from-top tg:inset-x-0 tg:top-0 tg:h-auto tg:border-b",
          side === "bottom" &&
            "tg:data-[state=closed]:slide-out-to-bottom tg:data-[state=open]:slide-in-from-bottom tg:inset-x-0 tg:bottom-0 tg:h-auto tg:border-t",
          className,
        )}
        {...props}
      >
        {children}
        <SheetPrimitive.Close className="tg:absolute tg:top-4 tg:right-4 tg:rounded-xs tg:opacity-70 tg:ring-offset-background tg:transition-opacity tg:hover:opacity-100 tg:focus:outline-hidden tg:focus:ring-2 tg:focus:ring-ring tg:focus:ring-offset-2 tg:disabled:pointer-events-none tg:data-[state=open]:bg-secondary">
          <XIcon className="tg:size-4" />
          <span className="tg:sr-only">Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPortal>
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sheet-header" className={cn("tg:flex tg:flex-col tg:gap-1.5 tg:p-4", className)} {...props} />;
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sheet-footer" className={cn("tg:mt-auto tg:flex tg:flex-col tg:gap-2 tg:p-4", className)} {...props} />;
}

function SheetTitle({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return <SheetPrimitive.Title data-slot="sheet-title" className={cn("tg:font-semibold tg:text-foreground", className)} {...props} />;
}

function SheetDescription({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description data-slot="sheet-description" className={cn("tg:text-muted-foreground tg:text-sm", className)} {...props} />
  );
}

export { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger };
