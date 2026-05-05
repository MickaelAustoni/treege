import { Image, Link2, Upload, X } from "lucide-react";
import { ChangeEvent, MouseEvent, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import useFlowActions from "@/editor/hooks/useFlowActions";
import useTranslate from "@/editor/hooks/useTranslate";
import { imageFileToOptimizedDataUrl } from "@/editor/utils/image";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";
import { Separator } from "@/shared/components/ui/separator";
import { cn } from "@/shared/lib/utils";

interface NodeImageButtonProps {
  nodeId: string;
  image?: string;
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

const NodeImageButton = ({ nodeId, image }: NodeImageButtonProps) => {
  const [open, setOpen] = useState(false);
  const [urlDraft, setUrlDraft] = useState(image && /^https?:\/\//i.test(image) ? image : "");
  const { updateNodeData } = useFlowActions();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoApplyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const t = useTranslate();

  const apply = (value: string) => {
    updateNodeData(nodeId, { image: value || undefined });
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const dataUrl = await imageFileToOptimizedDataUrl(file);
      apply(dataUrl);
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
    if (!trimmed || trimmed === image) {
      return;
    }
    apply(trimmed);
    setOpen(false);
  };

  const handleUrlChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    setUrlDraft(nextValue);

    if (autoApplyTimeoutRef.current) {
      clearTimeout(autoApplyTimeoutRef.current);
    }

    const trimmed = nextValue.trim();
    if (!isValidImageUrl(trimmed) || trimmed === image) {
      return;
    }

    autoApplyTimeoutRef.current = setTimeout(() => apply(trimmed), URL_AUTO_APPLY_DELAY_MS);
  };

  const handleRemove = (event: MouseEvent) => {
    event.stopPropagation();
    apply("");
  };

  useEffect(() => {
    if (!open) {
      setUrlDraft(image && /^https?:\/\//i.test(image) ? image : "");
    }
  }, [open, image]);

  useEffect(
    () => () => {
      if (autoApplyTimeoutRef.current) {
        clearTimeout(autoApplyTimeoutRef.current);
      }
    },
    [],
  );

  return (
    <>
      <input ref={fileInputRef} type="file" accept="image/*" className="tg:hidden" onChange={handleFileChange} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "nodrag nopan tg:flex tg:size-6 tg:cursor-pointer tg:items-center tg:justify-center tg:rounded-md tg:transition-all tg:hover:opacity-100",
              image ? "tg:opacity-100" : "tg:opacity-60",
            )}
            aria-label={t("editor.inputNodeForm.optionImageAdd")}
          >
            <Image className="tg:h-3.5 tg:w-3.5" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="tg:w-64 tg:space-y-3 tg:p-3">
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
          {image && (
            <Button type="button" variant="outline" size="sm" className="tg:w-full tg:text-destructive" onClick={handleRemove}>
              <X className="tg:mr-2 tg:h-4 tg:w-4" />
              {t("editor.inputNodeForm.optionImageRemove")}
            </Button>
          )}
        </PopoverContent>
      </Popover>
    </>
  );
};

export default NodeImageButton;
