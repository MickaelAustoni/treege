import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { useState } from "react";
import DependencyHint from "@/renderer/features/TreegeRenderer/web/components/DependencyHint";
import { useInputOptions } from "@/renderer/hooks/useInputOptions";
import { useMissingDependencies } from "@/renderer/hooks/useMissingDependencies";
import { useTranslate } from "@/renderer/hooks/useTranslate";
import { InputRenderProps } from "@/renderer/types/renderer";
import { Button } from "@/shared/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/shared/components/ui/command";
import { FormDescription, FormError, FormItem } from "@/shared/components/ui/form";
import { Label } from "@/shared/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";
import { cn } from "@/shared/lib/utils";

const DefaultAutocompleteInput = ({
  node,
  value,
  setValue,
  error,
  label,
  placeholder,
  helperText,
  id,
}: InputRenderProps<"autocomplete">) => {
  const t = useTranslate();
  const [open, setOpen] = useState(false);
  const { options, isLoading, error: inputOptionsError } = useInputOptions(node);
  const missing = useMissingDependencies(node);
  const triggerId = `${id}-trigger`;
  const errorId = `${id}-error`;
  const selectedOption = options.find((option) => option.value === value);

  return (
    <FormItem className="tg:mb-4">
      <Label htmlFor={triggerId}>
        {label || node.data.name}
        {node.data.required && <span className="tg:text-red-500">*</span>}
      </Label>
      <DependencyHint missing={missing}>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              id={triggerId}
              variant="outline"
              role="combobox"
              aria-expanded={open}
              aria-invalid={Boolean(error) || undefined}
              aria-describedby={error ? errorId : undefined}
              disabled={isLoading || missing.length > 0}
              className="tg:w-full tg:justify-between tg:font-normal"
            >
              <span className="tg:flex tg:items-center tg:gap-2 tg:truncate">
                {isLoading && <Loader2 className="tg:h-4 tg:w-4 tg:shrink-0 tg:animate-spin" />}
                {value
                  ? selectedOption?.label
                    ? t(selectedOption.label)
                    : value
                  : placeholder || t("renderer.defaultAutocompleteInput.selectOption")}
              </span>
              <ChevronsUpDown className="tg:ml-2 tg:size-4 tg:shrink-0 tg:opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="tg:w-(--radix-popover-trigger-width) tg:p-0" align="start">
            <Command>
              <CommandInput placeholder={placeholder || t("renderer.defaultAutocompleteInput.search")} />
              <CommandList>
                <CommandEmpty>{t("renderer.defaultAutocompleteInput.noResults")}</CommandEmpty>
                <CommandGroup>
                  {options.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      disabled={option.disabled}
                      onSelect={(currentValue) => {
                        setValue(currentValue === value ? "" : currentValue);
                        setOpen(false);
                      }}
                    >
                      <Check className={cn("tg:mr-2 tg:size-4", value === option.value ? "tg:opacity-100" : "tg:opacity-0")} />
                      {t(option.label)}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </DependencyHint>
      {error && <FormError id={errorId}>{error}</FormError>}
      {inputOptionsError && !error && <FormError>{inputOptionsError}</FormError>}
      {helperText && !error && !inputOptionsError && <FormDescription>{helperText}</FormDescription>}
    </FormItem>
  );
};

export default DefaultAutocompleteInput;
