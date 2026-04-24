import * as DialogPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";
import * as React from "react";

import { cn } from "@/shared/lib/utils";

function Dialog({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({ ...props }: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "tg:data-[state=closed]:fade-out-0 tg:data-[state=open]:fade-in-0 tg:fixed tg:inset-0 tg:z-50 tg:bg-black/50 tg:data-[state=closed]:animate-out tg:data-[state=open]:animate-in",
        className,
      )}
      {...props}
    />
  );
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean;
}) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "tg:data-[state=closed]:fade-out-0 tg:data-[state=open]:fade-in-0 tg:data-[state=closed]:zoom-out-95 tg:data-[state=open]:zoom-in-95 tg:fixed tg:top-[50%] tg:left-[50%] tg:z-50 tg:grid tg:w-full tg:max-w-[calc(100%-2rem)] tg:translate-x-[-50%] tg:translate-y-[-50%] tg:gap-4 tg:rounded-lg tg:border tg:bg-background tg:p-6 tg:shadow-lg tg:duration-200 tg:data-[state=closed]:animate-out tg:data-[state=open]:animate-in tg:sm:max-w-lg",
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="tg:absolute tg:top-4 tg:right-4 tg:rounded-xs tg:opacity-70 tg:ring-offset-background tg:transition-opacity tg:hover:opacity-100 tg:focus:outline-hidden tg:focus:ring-2 tg:focus:ring-ring tg:focus:ring-offset-2 tg:disabled:pointer-events-none tg:data-[state=open]:bg-accent tg:data-[state=open]:text-muted-foreground tg:[&_svg:not([class*='size-'])]:size-4 tg:[&_svg]:pointer-events-none tg:[&_svg]:shrink-0"
          >
            <XIcon />
            <span className="tg:sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="dialog-header" className={cn("tg:flex tg:flex-col tg:gap-2 tg:text-center tg:sm:text-left", className)} {...props} />
  );
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn("tg:flex tg:flex-col-reverse tg:gap-2 tg:sm:flex-row tg:sm:justify-end", className)}
      {...props}
    />
  );
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title data-slot="dialog-title" className={cn("tg:font-semibold tg:text-lg tg:leading-none", className)} {...props} />
  );
}

function DialogDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("tg:text-muted-foreground tg:text-sm", className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
