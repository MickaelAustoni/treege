import { Loader2, X } from "lucide-react";
import DependencyHint from "@/renderer/features/TreegeRenderer/web/components/DependencyHint";
import OptionItemContent from "@/renderer/features/TreegeRenderer/web/components/OptionItemContent";
import { useInputOptions } from "@/renderer/hooks/useInputOptions";
import { useTranslate } from "@/renderer/hooks/useTranslate";
import { InputRenderProps } from "@/renderer/types/renderer";
import { FormDescription, FormError, FormItem } from "@/shared/components/ui/form";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { cn } from "@/shared/lib/utils";

const DefaultSelectInput = ({ field, extra }: InputRenderProps<"select">) => {
  const { id, name, value, placeholder } = field;
  const { InputLabel, node, setValue, error, label, helperText, missingDependencies: missing } = extra;
  const { options, isLoading, error: inputOptionsError } = useInputOptions(node);
  const t = useTranslate();
  const normalizedValue = value ? String(value) : "";

  return (
    <FormItem className="tg:mb-4">
      <InputLabel htmlFor={id} label={label} required={node.data.required} />
      <DependencyHint missing={missing}>
        <div className="tg:relative">
          <Select name={name} value={normalizedValue} onValueChange={(val) => setValue(val)} disabled={isLoading || missing.length > 0}>
            <SelectTrigger
              id={id}
              name={name}
              aria-label={label || node.data.name}
              className={cn("tg:w-full", (normalizedValue || isLoading) && "tg:pr-14")}
            >
              <SelectValue placeholder={placeholder || t("renderer.defaultSelectInput.selectOption")} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {options.map((option, index) => {
                  return (
                    <SelectItem key={`${option.value}-${index}`} value={String(option.value)} disabled={option.disabled}>
                      <OptionItemContent label={t(option.label) || option.value} description={t(option.description)} image={option.image} />
                    </SelectItem>
                  );
                })}
              </SelectGroup>
            </SelectContent>
          </Select>
          {isLoading && (
            <Loader2 className="tg:-translate-y-1/2 tg:pointer-events-none tg:absolute tg:top-1/2 tg:right-8 tg:size-4 tg:animate-spin tg:text-muted-foreground" />
          )}
          {normalizedValue && !isLoading && missing.length === 0 && (
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
      {error && <FormError>{error}</FormError>}
      {inputOptionsError && !error && <FormError>{inputOptionsError}</FormError>}
      {helperText && !error && !inputOptionsError && <FormDescription>{helperText}</FormDescription>}
    </FormItem>
  );
};

export default DefaultSelectInput;
