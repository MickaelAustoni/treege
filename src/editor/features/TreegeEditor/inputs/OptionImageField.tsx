import { ImagePlus, Link2, Upload, X } from "lucide-react";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import useTranslate from "@/editor/hooks/useTranslate";
import { imageFileToOptimizedDataUrl } from "@/editor/utils/image";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";
import { Separator } from "@/shared/components/ui/separator";

interface OptionImageFieldProps {
  value?: string;
  onChange: (value: string) => void;
}

const URL_AUTO_APPLY_DELAY_MS = 400;

const isValidImageUrl = (value: string): boolean => {
  if (!/^https?:\/\//i.test(value)) {
    return false;
  }
  try {
    const parsed = new URL(value);
    return Boolean(parsed.hostname);
  } catch {
    return false;
  }
};

const OptionImageField = ({ value, onChange }: OptionImageFieldProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoApplyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);
  const [urlDraft, setUrlDraft] = useState(value && /^https?:\/\//i.test(value) ? value : "");
  const t = useTranslate();

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const dataUrl = await imageFileToOptimizedDataUrl(file);
      onChange(dataUrl);
      setOpen(false);
    } catch (error) {
      const code = (error as Error).message;
      if (code === "too_large") {
        toast.error(t("editor.inputNodeForm.optionImageTooLarge"));
      } else if (code === "invalid_type") {
        toast.error(t("editor.inputNodeForm.optionImageInvalid"));
      } else {
        toast.error(t("editor.inputNodeForm.optionImageError"));
      }
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const applyUrl = () => {
    const trimmed = urlDraft.trim();
    if (!trimmed) {
      return;
    }
    onChange(trimmed);
    setOpen(false);
  };

  const handleUrlChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    setUrlDraft(nextValue);

    if (autoApplyTimeoutRef.current) {
      clearTimeout(autoApplyTimeoutRef.current);
    }

    const trimmed = nextValue.trim();
    if (!isValidImageUrl(trimmed) || trimmed === value) {
      return;
    }

    autoApplyTimeoutRef.current = setTimeout(() => {
      onChange(trimmed);
    }, URL_AUTO_APPLY_DELAY_MS);
  };

  /**
   * Reset the URL draft to the persisted value whenever the popover closes,
   * so reopening shows the current state rather than a stale typed value.
   */
  useEffect(() => {
    if (!open) {
      setUrlDraft(value && /^https?:\/\//i.test(value) ? value : "");
    }
  }, [open, value]);

  /**
   * Cancel the pending auto-apply timer on unmount so we don't call onChange
   * after the consumer is gone.
   */
  useEffect(
    () => () => {
      if (autoApplyTimeoutRef.current) {
        clearTimeout(autoApplyTimeoutRef.current);
      }
    },
    [],
  );

  return (
    <div className="tg:relative">
      <input ref={fileInputRef} type="file" accept="image/*" className="tg:hidden" onChange={handleFileChange} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          {value ? (
            <button
              type="button"
              className="tg:h-9 tg:w-9 tg:cursor-pointer tg:overflow-hidden tg:rounded-md tg:border tg:border-input"
              aria-label={t("editor.inputNodeForm.optionImageReplace")}
            >
              <img src={value} alt="" className="tg:h-full tg:w-full tg:object-cover" />
            </button>
          ) : (
            <Button type="button" variant="outline" size="icon" aria-label={t("editor.inputNodeForm.optionImageAdd")}>
              <ImagePlus className="tg:h-4 tg:w-4" />
            </Button>
          )}
        </PopoverTrigger>
        <PopoverContent align="start" className="tg:w-64 tg:space-y-3 tg:p-3">
          <Button type="button" variant="outline" size="sm" className="tg:w-full" onClick={() => fileInputRef.current?.click()}>
            <Upload className="tg:mr-2 tg:h-4 tg:w-4" />
            {t("editor.inputNodeForm.optionImageUpload")}
          </Button>
          <Separator />
          <div className="tg:flex tg:items-center tg:gap-2">
            <Link2 className="tg:h-4 tg:w-4 tg:shrink-0 tg:text-muted-foreground" />
            <Input
              placeholder={t("editor.inputNodeForm.optionImageUrlPlaceholder")}
              value={urlDraft}
              onChange={handleUrlChange}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  applyUrl();
                }
              }}
              onBlur={applyUrl}
            />
          </div>
        </PopoverContent>
      </Popover>
      {value && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onChange("");
          }}
          className="tg:-top-1 tg:-right-1 tg:absolute tg:flex tg:h-4 tg:w-4 tg:cursor-pointer tg:items-center tg:justify-center tg:rounded-full tg:bg-destructive tg:text-destructive-foreground"
          aria-label={t("editor.inputNodeForm.optionImageRemove")}
        >
          <X className="tg:h-3 tg:w-3" />
        </button>
      )}
    </div>
  );
};

export default OptionImageField;
