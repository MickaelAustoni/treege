import { Check, ChevronsUpDown, Loader2, X } from "lucide-react";
import { useState } from "react";
import DependencyHint from "@/renderer/features/TreegeRenderer/web/components/DependencyHint";
import OptionItemContent from "@/renderer/features/TreegeRenderer/web/components/OptionItemContent";
import { useInputOptions } from "@/renderer/hooks/useInputOptions";
import { useTranslate } from "@/renderer/hooks/useTranslate";
import { InputRenderProps } from "@/renderer/types/renderer";
import { Button } from "@/shared/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/shared/components/ui/command";
import { FormDescription, FormError, FormItem } from "@/shared/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";
import { cn } from "@/shared/lib/utils";

const DefaultAutocompleteInput = ({ field, extra }: InputRenderProps<"autocomplete">) => {
  const [open, setOpen] = useState(false);
  const { id, value, placeholder } = field;
  const { InputLabel, node, setValue, error, label, helperText, missingDependencies: missing } = extra;
  const { options, isLoading, error: inputOptionsError } = useInputOptions(node);
  const t = useTranslate();
  const triggerId = `${id}-trigger`;
  const errorId = `${id}-error`;
  const selectedOption = options.find((option) => option.value === value);

  return (
    <FormItem className="tg:mb-4">
      <InputLabel htmlFor={triggerId} label={label} required={node.data.required} />
      <DependencyHint missing={missing}>
        <div className="tg:relative">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                id={triggerId}
                variant="outline"
                role="combobox"
                aria-label={label || node.data.name}
                aria-expanded={open}
                aria-invalid={Boolean(error) || undefined}
                aria-describedby={error ? errorId : undefined}
                disabled={isLoading || missing.length > 0}
                className={cn("tg:w-full tg:justify-between tg:font-normal", (value || isLoading) && "tg:pr-14")}
              >
                <span className="tg:flex tg:items-center tg:gap-2 tg:truncate">
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
                        onSelect={() => {
                          // Use the option's own value (not cmdk's lowercased arg) and toggle off when re-selected.
                          setValue(option.value === value ? "" : option.value);
                          setOpen(false);
                        }}
                      >
                        <Check className={cn("tg:mr-2 tg:size-4", value === option.value ? "tg:opacity-100" : "tg:opacity-0")} />
                        <OptionItemContent
                          label={t(option.label) || option.value}
                          description={t(option.description)}
                          image={option.image}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {isLoading && (
            <Loader2 className="tg:-translate-y-1/2 tg:pointer-events-none tg:absolute tg:top-1/2 tg:right-8 tg:size-4 tg:animate-spin tg:text-muted-foreground" />
          )}
          {value && !isLoading && missing.length === 0 && (
            <button
              type="button"
              aria-label={t("common.clear")}
              onClick={() => setValue("")}
              className="tg:-translate-y-1/2 tg:absolute tg:top-1/2 tg:right-8 tg:rounded-sm tg:p-0.5 tg:text-muted-foreground tg:opacity-70 tg:transition-opacity tg:hover:opacity-100"
            >
              <X className="tg:size-4" />
            </button>
          )}
        </div>
      </DependencyHint>
      {error && <FormError id={errorId}>{error}</FormError>}
      {inputOptionsError && !error && <FormError>{inputOptionsError}</FormError>}
      {helperText && !error && !inputOptionsError && <FormDescription>{helperText}</FormDescription>}
    </FormItem>
  );
};

export default DefaultAutocompleteInput;
