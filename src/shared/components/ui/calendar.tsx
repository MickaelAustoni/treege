import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import * as React from "react";
import { DayButton, DayPicker, getDefaultClassNames } from "react-day-picker";
import { Button, buttonVariants } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"];
}) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "tg:group/calendar tg:bg-background tg:p-3 tg:[--cell-size:--spacing(8)] tg:[[data-slot=card-content]_&]:bg-transparent tg:[[data-slot=popover-content]_&]:bg-transparent",
        String.raw`tg:rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`tg:rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className,
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) => date.toLocaleString("default", { month: "short" }),
        ...formatters,
      }}
      classNames={{
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "tg:size-(--cell-size) tg:aria-disabled:opacity-50 tg:p-0 tg:select-none",
          defaultClassNames.button_next,
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "tg:size-(--cell-size) tg:aria-disabled:opacity-50 tg:p-0 tg:select-none",
          defaultClassNames.button_previous,
        ),
        caption_label: cn(
          "tg:select-none tg:font-medium",
          captionLayout === "label"
            ? "tg:text-sm"
            : "tg:rounded-md tg:pl-2 tg:pr-1 tg:flex tg:items-center tg:gap-1 tg:text-sm tg:h-8 tg:[&>svg]:text-muted-foreground tg:[&>svg]:size-3.5",
          defaultClassNames.caption_label,
        ),
        day: cn(
          "tg:relative tg:w-full tg:h-full tg:p-0 tg:text-center tg:[&:first-child[data-selected=true]_button]:rounded-l-md tg:[&:last-child[data-selected=true]_button]:rounded-r-md tg:group/day tg:aspect-square tg:select-none",
          defaultClassNames.day,
        ),
        disabled: cn("tg:text-muted-foreground tg:opacity-50", defaultClassNames.disabled),
        dropdown: cn("tg:absolute tg:bg-popover tg:inset-0 tg:opacity-0", defaultClassNames.dropdown),
        dropdown_root: cn(
          "tg:relative tg:has-focus:border-ring tg:border tg:border-input tg:shadow-xs tg:has-focus:ring-ring/50 tg:has-focus:ring-[3px] tg:rounded-md",
          defaultClassNames.dropdown_root,
        ),
        dropdowns: cn(
          "tg:w-full tg:flex tg:items-center tg:text-sm tg:font-medium tg:justify-center tg:h-(--cell-size) tg:gap-1.5",
          defaultClassNames.dropdowns,
        ),
        hidden: cn("tg:invisible", defaultClassNames.hidden),
        month: cn("tg:flex tg:flex-col tg:w-full tg:gap-4", defaultClassNames.month),
        month_caption: cn(
          "tg:flex tg:items-center tg:justify-center tg:h-(--cell-size) tg:w-full tg:px-(--cell-size)",
          defaultClassNames.month_caption,
        ),
        months: cn("tg:flex tg:gap-4 tg:flex-col tg:md:flex-row tg:relative", defaultClassNames.months),
        nav: cn("tg:flex tg:items-center tg:gap-1 tg:w-full tg:absolute tg:top-0 tg:inset-x-0 tg:justify-between", defaultClassNames.nav),
        outside: cn("tg:text-muted-foreground tg:aria-selected:text-muted-foreground", defaultClassNames.outside),
        range_end: cn("tg:rounded-r-md tg:bg-accent", defaultClassNames.range_end),
        range_middle: cn("tg:rounded-none", defaultClassNames.range_middle),
        range_start: cn("tg:rounded-l-md tg:bg-accent", defaultClassNames.range_start),
        root: cn("tg:w-fit", defaultClassNames.root),
        table: "tg:w-full tg:border-collapse",
        today: cn("tg:bg-accent tg:text-accent-foreground tg:rounded-md tg:data-[selected=true]:rounded-none", defaultClassNames.today),
        week: cn("tg:flex tg:w-full tg:mt-2", defaultClassNames.week),
        week_number: cn("tg:text-[0.8rem] tg:select-none tg:text-muted-foreground", defaultClassNames.week_number),
        week_number_header: cn("tg:select-none tg:w-(--cell-size)", defaultClassNames.week_number_header),
        weekday: cn(
          "tg:text-muted-foreground tg:rounded-md tg:flex-1 tg:font-normal tg:text-[0.8rem] tg:select-none",
          defaultClassNames.weekday,
        ),
        weekdays: cn("tg:flex", defaultClassNames.weekdays),
        ...classNames,
      }}
      components={{
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return <ChevronLeftIcon className={cn("tg:size-4", className)} {...props} />;
          }

          if (orientation === "right") {
            return <ChevronRightIcon className={cn("tg:size-4", className)} {...props} />;
          }

          return <ChevronDownIcon className={cn("tg:size-4", className)} {...props} />;
        },
        DayButton: CalendarDayButton,
        Root: ({ className, rootRef, ...props }) => {
          return <div data-slot="calendar" ref={rootRef} className={cn(className)} {...props} />;
        },
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="tg:flex tg:size-(--cell-size) tg:items-center tg:justify-center tg:text-center">{children}</div>
            </td>
          );
        },
        ...components,
      }}
      {...props}
    />
  );
}

function CalendarDayButton({ className, day, modifiers, ...props }: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames();

  const ref = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (modifiers.focused) {
      ref.current?.focus();
    }
  }, [modifiers.focused]);

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={modifiers.selected && !modifiers.range_start && !modifiers.range_end && !modifiers.range_middle}
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "tg:flex tg:aspect-square tg:size-auto tg:w-full tg:min-w-(--cell-size) tg:flex-col tg:gap-1 tg:font-normal tg:leading-none tg:data-[range-end=true]:rounded-md tg:data-[range-middle=true]:rounded-none tg:data-[range-start=true]:rounded-md tg:data-[range-end=true]:rounded-r-md tg:data-[range-start=true]:rounded-l-md tg:data-[range-end=true]:bg-primary tg:data-[range-middle=true]:bg-accent tg:data-[range-start=true]:bg-primary tg:data-[selected-single=true]:bg-primary tg:data-[range-end=true]:text-primary-foreground tg:data-[range-middle=true]:text-accent-foreground tg:data-[range-start=true]:text-primary-foreground tg:data-[selected-single=true]:text-primary-foreground tg:group-data-[focused=true]/day:relative tg:group-data-[focused=true]/day:z-10 tg:group-data-[focused=true]/day:border-ring tg:group-data-[focused=true]/day:ring-[3px] tg:group-data-[focused=true]/day:ring-ring/50 tg:dark:hover:text-accent-foreground tg:[&>span]:text-xs tg:[&>span]:opacity-70",
        defaultClassNames.day,
        className,
      )}
      {...props}
    />
  );
}

export { Calendar, CalendarDayButton };
