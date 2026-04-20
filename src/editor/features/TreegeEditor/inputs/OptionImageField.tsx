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

  useEffect(() => {
    if (!open) {
      setUrlDraft(value && /^https?:\/\//i.test(value) ? value : "");
    }
  }, [open, value]);

  useEffect(
    () => () => {
      if (autoApplyTimeoutRef.current) {
        clearTimeout(autoApplyTimeoutRef.current);
      }
    },
    [],
  );

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

  return (
    <div className="relative">
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          {value ? (
            <button
              type="button"
              className="h-9 w-9 cursor-pointer overflow-hidden rounded-md border border-input"
              aria-label={t("editor.inputNodeForm.optionImageReplace")}
            >
              <img src={value} alt="" className="h-full w-full object-cover" />
            </button>
          ) : (
            <Button type="button" variant="outline" size="icon" aria-label={t("editor.inputNodeForm.optionImageAdd")}>
              <ImagePlus className="h-4 w-4" />
            </Button>
          )}
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64 space-y-3 p-3">
          <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            {t("editor.inputNodeForm.optionImageUpload")}
          </Button>
          <Separator />
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" />
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
          className="-top-1 -right-1 absolute flex h-4 w-4 cursor-pointer items-center justify-center rounded-full bg-destructive text-destructive-foreground"
          aria-label={t("editor.inputNodeForm.optionImageRemove")}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
};

export default OptionImageField;
