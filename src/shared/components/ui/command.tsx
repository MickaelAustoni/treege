"use client";

import { Command as CommandPrimitive } from "cmdk";
import { SearchIcon } from "lucide-react";
import * as React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { cn } from "@/shared/lib/utils";

function Command({ className, ...props }: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn(
        "tg:flex tg:h-full tg:w-full tg:flex-col tg:overflow-hidden tg:rounded-md tg:bg-popover tg:text-popover-foreground",
        className,
      )}
      {...props}
    />
  );
}

function CommandDialog({
  title = "Command Palette",
  description = "Search for a command to run...",
  children,
  className,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof Dialog> & {
  title?: string;
  description?: string;
  className?: string;
  showCloseButton?: boolean;
}) {
  return (
    <Dialog {...props}>
      <DialogHeader className="tg:sr-only">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogContent className={cn("tg:overflow-hidden tg:p-0", className)} showCloseButton={showCloseButton}>
        <Command className="tg:**:data-[slot=command-input-wrapper]:h-12 tg:[&_[cmdk-group-heading]]:px-2 tg:[&_[cmdk-group-heading]]:font-medium tg:[&_[cmdk-group-heading]]:text-muted-foreground tg:[&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 tg:[&_[cmdk-group]]:px-2 tg:[&_[cmdk-input-wrapper]_svg]:h-5 tg:[&_[cmdk-input-wrapper]_svg]:w-5 tg:[&_[cmdk-input]]:h-12 tg:[&_[cmdk-item]]:px-2 tg:[&_[cmdk-item]]:py-3 tg:[&_[cmdk-item]_svg]:h-5 tg:[&_[cmdk-item]_svg]:w-5">
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  );
}

function CommandInput({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div data-slot="command-input-wrapper" className="tg:flex tg:h-9 tg:items-center tg:gap-2 tg:border-b tg:px-3">
      <SearchIcon className="tg:size-4 tg:shrink-0 tg:opacity-50" />
      <CommandPrimitive.Input
        data-slot="command-input"
        className={cn(
          "tg:flex tg:h-10 tg:w-full tg:rounded-md tg:bg-transparent tg:py-3 tg:text-sm tg:outline-hidden tg:placeholder:text-muted-foreground tg:disabled:cursor-not-allowed tg:disabled:opacity-50",
          className,
        )}
        {...props}
      />
    </div>
  );
}

function CommandList({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn("tg:max-h-[300px] tg:scroll-py-1 tg:overflow-y-auto tg:overflow-x-hidden", className)}
      {...props}
    />
  );
}

function CommandEmpty({ ...props }: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return <CommandPrimitive.Empty data-slot="command-empty" className="tg:py-6 tg:text-center tg:text-sm" {...props} />;
}

function CommandGroup({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn(
        "tg:overflow-hidden tg:p-1 tg:text-foreground tg:[&_[cmdk-group-heading]]:px-2 tg:[&_[cmdk-group-heading]]:py-1.5 tg:[&_[cmdk-group-heading]]:font-medium tg:[&_[cmdk-group-heading]]:text-muted-foreground tg:[&_[cmdk-group-heading]]:text-xs",
        className,
      )}
      {...props}
    />
  );
}

function CommandSeparator({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return <CommandPrimitive.Separator data-slot="command-separator" className={cn("tg:-mx-1 tg:h-px tg:bg-border", className)} {...props} />;
}

function CommandItem({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        "tg:relative tg:flex tg:cursor-default tg:select-none tg:items-center tg:gap-2 tg:rounded-sm tg:px-2 tg:py-1.5 tg:text-sm tg:outline-hidden tg:data-[disabled=true]:pointer-events-none tg:data-[selected=true]:bg-accent tg:data-[selected=true]:text-accent-foreground tg:data-[disabled=true]:opacity-50 tg:[&_svg:not([class*='size-'])]:size-4 tg:[&_svg:not([class*='text-'])]:text-muted-foreground tg:[&_svg]:pointer-events-none tg:[&_svg]:shrink-0",
        className,
      )}
      {...props}
    />
  );
}

function CommandShortcut({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn("tg:ml-auto tg:text-muted-foreground tg:text-xs tg:tracking-widest", className)}
      {...props}
    />
  );
}

export { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut };
