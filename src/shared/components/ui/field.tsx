"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { useMemo } from "react";

import { Label } from "@/shared/components/ui/label";
import { Separator } from "@/shared/components/ui/separator";
import { cn } from "@/shared/lib/utils";

function FieldSet({ className, ...props }: React.ComponentProps<"fieldset">) {
  return (
    <fieldset
      data-slot="field-set"
      className={cn(
        "tg:flex tg:flex-col tg:gap-6",
        "tg:has-[>[data-slot=checkbox-group]]:gap-3 tg:has-[>[data-slot=radio-group]]:gap-3",
        className,
      )}
      {...props}
    />
  );
}

function FieldLegend({ className, variant = "legend", ...props }: React.ComponentProps<"legend"> & { variant?: "legend" | "label" }) {
  return (
    <legend
      data-slot="field-legend"
      data-variant={variant}
      className={cn("tg:mb-3 tg:font-medium", "tg:data-[variant=legend]:text-base", "tg:data-[variant=label]:text-sm", className)}
      {...props}
    />
  );
}

function FieldGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-group"
      className={cn(
        "tg:group/field-group tg:@container/field-group tg:flex tg:w-full tg:flex-col tg:gap-7 tg:data-[slot=checkbox-group]:gap-3 tg:[&>[data-slot=field-group]]:gap-4",
        className,
      )}
      {...props}
    />
  );
}

const fieldVariants = cva("tg:group/field tg:flex tg:w-full tg:gap-3 tg:data-[invalid=true]:text-destructive", {
  defaultVariants: {
    orientation: "vertical",
  },
  variants: {
    orientation: {
      horizontal: [
        "tg:flex-row tg:items-center",
        "tg:[&>[data-slot=field-label]]:flex-auto",
        "tg:has-[>[data-slot=field-content]]:items-start tg:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
      ],
      responsive: [
        "tg:flex-col tg:@md/field-group:flex-row tg:@md/field-group:items-center tg:[&>*]:w-full tg:@md/field-group:[&>*]:w-auto tg:[&>.sr-only]:w-auto",
        "tg:@md/field-group:[&>[data-slot=field-label]]:flex-auto",
        "tg:@md/field-group:has-[>[data-slot=field-content]]:items-start tg:@md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
      ],
      vertical: ["tg:flex-col tg:[&>*]:w-full tg:[&>.sr-only]:w-auto"],
    },
  },
});

function Field({ className, orientation = "vertical", ...props }: React.ComponentProps<"div"> & VariantProps<typeof fieldVariants>) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: matches the upstream shadcn primitive (a fieldset would change layout/styling)
    <div
      role="group"
      data-slot="field"
      data-orientation={orientation}
      className={cn(fieldVariants({ orientation }), className)}
      {...props}
    />
  );
}

function FieldContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-content"
      className={cn("tg:group/field-content tg:flex tg:flex-1 tg:flex-col tg:gap-1.5 tg:leading-snug", className)}
      {...props}
    />
  );
}

function FieldLabel({ className, ...props }: React.ComponentProps<typeof Label>) {
  return (
    <Label
      data-slot="field-label"
      className={cn(
        "tg:group/field-label tg:peer/field-label tg:flex tg:w-fit tg:gap-2 tg:leading-snug tg:group-data-[disabled=true]/field:opacity-50",
        "tg:has-[>[data-slot=field]]:w-full tg:has-[>[data-slot=field]]:flex-col tg:has-[>[data-slot=field]]:rounded-md tg:has-[>[data-slot=field]]:border tg:[&>*]:data-[slot=field]:p-4",
        "tg:has-data-[state=checked]:border-primary tg:has-data-[state=checked]:bg-primary/5 tg:dark:has-data-[state=checked]:bg-primary/10",
        className,
      )}
      {...props}
    />
  );
}

function FieldTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-label"
      className={cn(
        "tg:flex tg:w-fit tg:items-center tg:gap-2 tg:font-medium tg:text-sm tg:leading-snug tg:group-data-[disabled=true]/field:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

function FieldDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="field-description"
      className={cn(
        "tg:font-normal tg:text-muted-foreground tg:text-sm tg:leading-normal tg:group-has-[[data-orientation=horizontal]]/field:text-balance",
        "tg:last:mt-0 tg:nth-last-2:-mt-1 tg:[[data-variant=legend]+&]:-mt-1.5",
        "tg:[&>a]:underline tg:[&>a]:underline-offset-4 tg:[&>a:hover]:text-primary",
        className,
      )}
      {...props}
    />
  );
}

function FieldSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  children?: React.ReactNode;
}) {
  return (
    <div
      data-slot="field-separator"
      data-content={!!children}
      className={cn("tg:-my-2 tg:relative tg:h-5 tg:text-sm tg:group-data-[variant=outline]/field-group:-mb-2", className)}
      {...props}
    >
      <Separator className="tg:absolute tg:inset-0 tg:top-1/2" />
      {children && (
        <span
          className="tg:relative tg:mx-auto tg:block tg:w-fit tg:bg-background tg:px-2 tg:text-muted-foreground"
          data-slot="field-separator-content"
        >
          {children}
        </span>
      )}
    </div>
  );
}

function FieldError({
  className,
  children,
  errors,
  ...props
}: React.ComponentProps<"div"> & {
  errors?: Array<{ message?: string } | undefined>;
}) {
  const content = useMemo(() => {
    if (children) {
      return children;
    }

    if (!errors?.length) {
      return null;
    }

    const uniqueErrors = [...new Map(errors.map((error) => [error?.message, error])).values()];

    if (uniqueErrors?.length === 1) {
      return uniqueErrors[0]?.message;
    }

    return (
      <ul className="tg:ml-4 tg:flex tg:list-disc tg:flex-col tg:gap-1">
        {uniqueErrors.map((error, index) => error?.message && <li key={index}>{error.message}</li>)}
      </ul>
    );
  }, [children, errors]);

  if (!content) {
    return null;
  }

  return (
    <div role="alert" data-slot="field-error" className={cn("tg:font-normal tg:text-destructive tg:text-sm", className)} {...props}>
      {content}
    </div>
  );
}

export { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSeparator, FieldSet, FieldTitle };
