import { Check, ChevronsUpDown, Plus, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/shared/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";
import { cn } from "@/shared/lib/utils";

export type ComboboxOption = {
  value?: string | null;
  label: string;
};

/**
 * Reusable Combobox component with search, create, and clear functionality
 */
const ComboboxWithCreate = ({
  options,
  id,
  value,
  onValueChange,
  placeholder = "Select...",
  searchPlaceholder = "Search or create...",
  createLabel = (query: string) => `Use: ${query}`,
  clearLabel = "Clear selection",
  emptyLabel = "No results found",
  className,
  allowClear = true,
  allowCreate = true,
}: {
  id?: string;
  options: ComboboxOption[];
  value?: string | null;
  onValueChange?: (newValue: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  createLabel?: (query: string) => string;
  clearLabel?: string;
  emptyLabel?: string;
  className?: string;
  allowClear?: boolean;
  allowCreate?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  // Normalize values to a string for consistent comparisons
  const normalize = (v?: string | null) => v ?? "";
  const normalizeSearch = (q: string) => q.trim().toLowerCase();
  const normalizedValue = normalize(value);
  const hasSelection = value !== null && value !== "";
  const selectedOption = hasSelection ? options.find((option) => normalize(option.value) === normalizedValue) : undefined;
  const searchNormalized = normalizeSearch(search);

  const canCreate =
    allowCreate &&
    searchNormalized !== "" &&
    !options.some((o) => normalizeSearch(o.label) === searchNormalized || normalizeSearch(o.value ?? "") === searchNormalized);

  const handleSelect = (selectedValue: string) => {
    if (selectedValue === normalizedValue) {
      if (allowClear) {
        onValueChange?.("");
      }
      // if clearing isn't allowed, keep selection as-is
    } else {
      onValueChange?.(selectedValue);
    }
    setOpen(false);
    setSearch("");
  };

  const handleCreate = () => {
    if (search.trim()) {
      onValueChange?.(search.trim());
      setOpen(false);
      setSearch("");
    }
  };

  const handleClear = () => {
    onValueChange?.("");
    setOpen(false);
    setSearch("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild id={id}>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("tg:w-full tg:justify-between tg:font-normal", className)}
        >
          <span className="tg:truncate">{hasSelection && selectedOption ? selectedOption.label : placeholder}</span>
          <ChevronsUpDown className="tg:ml-2 tg:h-4 tg:w-4 tg:shrink-0 tg:opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="tg:w-full tg:p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder={searchPlaceholder} value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>{emptyLabel}</CommandEmpty>

            {/* Clear option - appears at the end if there's a selection */}
            {allowClear && hasSelection && (
              <CommandGroup>
                <CommandItem value="__clear__" onSelect={handleClear} className="tg:mt-1 tg:text-muted-foreground">
                  <X className="tg:mr-2 tg:h-4 tg:w-4" />
                  {clearLabel}
                </CommandItem>
              </CommandGroup>
            )}

            <CommandGroup>
              {/* Create new option */}
              {canCreate && (
                <CommandItem value={`__create__${search}`} onSelect={handleCreate} className="tg:text-primary">
                  <Plus className="tg:mr-2 tg:h-4 tg:w-4" />
                  {createLabel(search)}
                </CommandItem>
              )}

              {/* Existing options */}
              {options
                .filter((option) => {
                  const s = search.toLowerCase();
                  return option.label.toLowerCase().includes(s) || (option.value?.toLowerCase() ?? "").includes(s);
                })
                .map((option, idx) => (
                  <CommandItem
                    key={option.value ?? option.label ?? idx}
                    value={option.label}
                    onSelect={() => handleSelect(option?.value || "")}
                  >
                    <Check
                      aria-hidden="true"
                      className={cn(
                        "tg:mr-2 tg:h-4 tg:w-4",
                        hasSelection && normalize(option.value) === normalizedValue ? "tg:opacity-100" : "tg:opacity-0",
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default ComboboxWithCreate;
