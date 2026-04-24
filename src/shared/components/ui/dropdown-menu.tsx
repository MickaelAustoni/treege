import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react";
import * as React from "react";

import { cn } from "@/shared/lib/utils";

function DropdownMenu({ ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

function DropdownMenuPortal({ ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Portal>) {
  return <DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />;
}

function DropdownMenuTrigger({ ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
  return <DropdownMenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />;
}

function DropdownMenuContent({ className, sideOffset = 4, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        className={cn(
          "tg:data-[state=closed]:fade-out-0 tg:data-[state=open]:fade-in-0 tg:data-[state=closed]:zoom-out-95 tg:data-[state=open]:zoom-in-95 tg:data-[side=bottom]:slide-in-from-top-2 tg:data-[side=left]:slide-in-from-right-2 tg:data-[side=right]:slide-in-from-left-2 tg:data-[side=top]:slide-in-from-bottom-2 tg:z-50 tg:max-h-(--radix-dropdown-menu-content-available-height) tg:min-w-[8rem] tg:origin-(--radix-dropdown-menu-content-transform-origin) tg:overflow-y-auto tg:overflow-x-hidden tg:rounded-md tg:border tg:bg-popover tg:p-1 tg:text-popover-foreground tg:shadow-md tg:data-[state=closed]:animate-out tg:data-[state=open]:animate-in",
          className,
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

function DropdownMenuGroup({ ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Group>) {
  return <DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />;
}

function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
  inset?: boolean;
  variant?: "default" | "destructive";
}) {
  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "tg:data-[variant=destructive]:*:[svg]:!text-destructive tg:relative tg:flex tg:cursor-default tg:select-none tg:items-center tg:gap-2 tg:rounded-sm tg:px-2 tg:py-1.5 tg:text-sm tg:outline-hidden tg:focus:bg-accent tg:focus:text-accent-foreground tg:data-[disabled]:pointer-events-none tg:data-[inset]:pl-8 tg:data-[variant=destructive]:text-destructive tg:data-[disabled]:opacity-50 tg:data-[variant=destructive]:focus:bg-destructive/10 tg:data-[variant=destructive]:focus:text-destructive tg:dark:data-[variant=destructive]:focus:bg-destructive/20 tg:[&_svg:not([class*='size-'])]:size-4 tg:[&_svg:not([class*='text-'])]:text-muted-foreground tg:[&_svg]:pointer-events-none tg:[&_svg]:shrink-0",
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      className={cn(
        "tg:relative tg:flex tg:cursor-default tg:select-none tg:items-center tg:gap-2 tg:rounded-sm tg:py-1.5 tg:pr-2 tg:pl-8 tg:text-sm tg:outline-hidden tg:focus:bg-accent tg:focus:text-accent-foreground tg:data-[disabled]:pointer-events-none tg:data-[disabled]:opacity-50 tg:[&_svg:not([class*='size-'])]:size-4 tg:[&_svg]:pointer-events-none tg:[&_svg]:shrink-0",
        className,
      )}
      checked={checked}
      {...props}
    >
      <span className="tg:pointer-events-none tg:absolute tg:left-2 tg:flex tg:size-3.5 tg:items-center tg:justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CheckIcon className="tg:size-4" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  );
}

function DropdownMenuRadioGroup({ ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>) {
  return <DropdownMenuPrimitive.RadioGroup data-slot="dropdown-menu-radio-group" {...props} />;
}

function DropdownMenuRadioItem({ className, children, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) {
  return (
    <DropdownMenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      className={cn(
        "tg:relative tg:flex tg:cursor-default tg:select-none tg:items-center tg:gap-2 tg:rounded-sm tg:py-1.5 tg:pr-2 tg:pl-8 tg:text-sm tg:outline-hidden tg:focus:bg-accent tg:focus:text-accent-foreground tg:data-[disabled]:pointer-events-none tg:data-[disabled]:opacity-50 tg:[&_svg:not([class*='size-'])]:size-4 tg:[&_svg]:pointer-events-none tg:[&_svg]:shrink-0",
        className,
      )}
      {...props}
    >
      <span className="tg:pointer-events-none tg:absolute tg:left-2 tg:flex tg:size-3.5 tg:items-center tg:justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CircleIcon className="tg:size-2 tg:fill-current" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  );
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & {
  inset?: boolean;
}) {
  return (
    <DropdownMenuPrimitive.Label
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn("tg:px-1.5 tg:py-1 tg:font-medium tg:text-muted-foreground tg:text-xs tg:data-[inset]:pl-7", className)}
      {...props}
    />
  );
}

function DropdownMenuSeparator({ className, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn("tg:-mx-1 tg:my-1 tg:h-px tg:bg-border", className)}
      {...props}
    />
  );
}

function DropdownMenuShortcut({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn("tg:ml-auto tg:text-muted-foreground tg:text-xs tg:tracking-widest", className)}
      {...props}
    />
  );
}

function DropdownMenuSub({ ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Sub>) {
  return <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...props} />;
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & {
  inset?: boolean;
}) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        "tg:flex tg:cursor-default tg:select-none tg:items-center tg:gap-2 tg:rounded-sm tg:px-2 tg:py-1.5 tg:text-sm tg:outline-hidden tg:focus:bg-accent tg:focus:text-accent-foreground tg:data-[state=open]:bg-accent tg:data-[inset]:pl-8 tg:data-[state=open]:text-accent-foreground tg:[&_svg:not([class*='size-'])]:size-4 tg:[&_svg:not([class*='text-'])]:text-muted-foreground tg:[&_svg]:pointer-events-none tg:[&_svg]:shrink-0",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="tg:ml-auto tg:size-4" />
    </DropdownMenuPrimitive.SubTrigger>
  );
}

function DropdownMenuSubContent({ className, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.SubContent>) {
  return (
    <DropdownMenuPrimitive.SubContent
      data-slot="dropdown-menu-sub-content"
      className={cn(
        "tg:data-[state=closed]:fade-out-0 tg:data-[state=open]:fade-in-0 tg:data-[state=closed]:zoom-out-95 tg:data-[state=open]:zoom-in-95 tg:data-[side=bottom]:slide-in-from-top-2 tg:data-[side=left]:slide-in-from-right-2 tg:data-[side=right]:slide-in-from-left-2 tg:data-[side=top]:slide-in-from-bottom-2 tg:z-50 tg:min-w-[8rem] tg:origin-(--radix-dropdown-menu-content-transform-origin) tg:overflow-hidden tg:rounded-md tg:border tg:bg-popover tg:p-1 tg:text-popover-foreground tg:shadow-lg tg:data-[state=closed]:animate-out tg:data-[state=open]:animate-in",
        className,
      )}
      {...props}
    />
  );
}

export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
};
