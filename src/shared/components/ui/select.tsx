import * as SelectPrimitive from "@radix-ui/react-select";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import * as React from "react";
import { cn } from "@/shared/lib/utils";

const Select = ({ ...props }: React.ComponentProps<typeof SelectPrimitive.Root>) => <SelectPrimitive.Root data-slot="select" {...props} />;

const SelectGroup = ({ ...props }: React.ComponentProps<typeof SelectPrimitive.Group>) => (
  <SelectPrimitive.Group data-slot="select-group" {...props} />
);

const SelectValue = ({ ...props }: React.ComponentProps<typeof SelectPrimitive.Value>) => (
  <SelectPrimitive.Value data-slot="select-value" {...props} />
);

const SelectTrigger = ({
  className,
  size = "default",
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: "sm" | "default";
}) => (
  <SelectPrimitive.Trigger
    data-slot="select-trigger"
    data-size={size}
    className={cn(
      "tg:flex tg:w-fit tg:items-center tg:justify-between tg:gap-2 tg:whitespace-nowrap tg:rounded-md tg:border tg:border-input tg:bg-transparent tg:px-3 tg:py-2 tg:text-sm tg:shadow-xs tg:outline-none tg:transition-[color,box-shadow] tg:focus-visible:border-ring tg:focus-visible:ring-[3px] tg:focus-visible:ring-ring/50 tg:disabled:cursor-not-allowed tg:disabled:opacity-50 tg:aria-invalid:border-destructive tg:aria-invalid:ring-destructive/20 tg:data-[size=default]:h-9 tg:data-[size=sm]:h-8 tg:data-[placeholder]:text-muted-foreground tg:*:data-[slot=select-value]:line-clamp-1 tg:*:data-[slot=select-value]:flex tg:*:data-[slot=select-value]:items-center tg:*:data-[slot=select-value]:gap-2 tg:dark:bg-input/30 tg:dark:aria-invalid:ring-destructive/40 tg:dark:hover:bg-input/50 tg:[&_svg:not([class*='size-'])]:size-4 tg:[&_svg:not([class*='text-'])]:text-muted-foreground tg:[&_svg]:pointer-events-none tg:[&_svg]:shrink-0",
      className,
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDownIcon className="tg:size-4 tg:opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
);

const SelectContent = ({ className, children, position = "popper", ...props }: React.ComponentProps<typeof SelectPrimitive.Content>) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      data-slot="select-content"
      className={cn(
        "tg:data-[state=closed]:fade-out-0 tg:data-[state=open]:fade-in-0 tg:data-[state=closed]:zoom-out-95 tg:data-[state=open]:zoom-in-95 tg:data-[side=bottom]:slide-in-from-top-2 tg:data-[side=left]:slide-in-from-right-2 tg:data-[side=right]:slide-in-from-left-2 tg:data-[side=top]:slide-in-from-bottom-2 tg:relative tg:z-50 tg:max-h-(--radix-select-content-available-height) tg:min-w-[8rem] tg:origin-(--radix-select-content-transform-origin) tg:overflow-y-auto tg:overflow-x-hidden tg:rounded-md tg:border tg:bg-popover tg:text-popover-foreground tg:shadow-md tg:data-[state=closed]:animate-out tg:data-[state=open]:animate-in",
        position === "popper" &&
          "tg:data-[side=left]:-translate-x-1 tg:data-[side=top]:-translate-y-1 tg:data-[side=right]:translate-x-1 tg:data-[side=bottom]:translate-y-1",
        className,
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          "tg:p-1",
          position === "popper" &&
            "tg:h-[var(--radix-select-trigger-height)] tg:w-full tg:min-w-[var(--radix-select-trigger-width)] tg:scroll-my-1",
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
);

const SelectLabel = ({
  className,
  htmlFor,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label> & { htmlFor?: string }) => (
  <SelectPrimitive.Label
    data-slot="select-label"
    className={cn("tg:pb-1.5 tg:font-medium tg:text-muted-foreground tg:text-sm", className)}
    {...props}
  >
    <label htmlFor={htmlFor}>{children}</label>
  </SelectPrimitive.Label>
);

const SelectItem = ({ className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Item>) => (
  <SelectPrimitive.Item
    data-slot="select-item"
    className={cn(
      "tg:relative tg:flex tg:w-full tg:cursor-pointer tg:select-none tg:items-center tg:gap-2 tg:rounded-sm tg:py-1.5 tg:pr-8 tg:pl-2 tg:text-sm tg:outline-hidden tg:focus:bg-accent tg:focus:text-accent-foreground tg:data-[disabled]:pointer-events-none tg:data-[disabled]:opacity-50 tg:[&_svg:not([class*='size-'])]:size-4 tg:[&_svg:not([class*='text-'])]:text-muted-foreground tg:[&_svg]:pointer-events-none tg:[&_svg]:shrink-0 tg:*:[span]:last:flex tg:*:[span]:last:items-center tg:*:[span]:last:gap-2",
      className,
    )}
    {...props}
  >
    <span className="tg:absolute tg:right-2 tg:flex tg:size-3.5 tg:items-center tg:justify-center">
      <SelectPrimitive.ItemIndicator>
        <CheckIcon className="tg:size-4" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
);

const SelectSeparator = ({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Separator>) => (
  <SelectPrimitive.Separator
    data-slot="select-separator"
    className={cn("tg:-mx-1 tg:pointer-events-none tg:my-1 tg:h-px tg:bg-border", className)}
    {...props}
  />
);

const SelectScrollUpButton = ({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) => (
  <SelectPrimitive.ScrollUpButton
    data-slot="select-scroll-up-button"
    className={cn("tg:flex tg:cursor-default tg:items-center tg:justify-center tg:py-1", className)}
    {...props}
  >
    <ChevronUpIcon className="tg:size-4" />
  </SelectPrimitive.ScrollUpButton>
);

const SelectScrollDownButton = ({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) => (
  <SelectPrimitive.ScrollDownButton
    data-slot="select-scroll-down-button"
    className={cn("tg:flex tg:cursor-default tg:items-center tg:justify-center tg:py-1", className)}
    {...props}
  >
    <ChevronDownIcon className="tg:size-4" />
  </SelectPrimitive.ScrollDownButton>
);

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
