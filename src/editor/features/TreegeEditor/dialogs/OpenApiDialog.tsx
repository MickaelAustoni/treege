import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useOpenApi } from "@/editor/context/OpenApiContext";
import useTranslate from "@/editor/hooks/useTranslate";
import { loadOpenApiDocument } from "@/editor/utils/openapi";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/shared/components/ui/toggle-group";

interface OpenApiDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Mode = "url" | "json";

const OpenApiDialog = ({ open, onOpenChange }: OpenApiDialogProps) => {
  const [mode, setMode] = useState<Mode>("url");
  const [url, setUrl] = useState("");
  const [json, setJson] = useState("");
  const [baseUrlDraft, setBaseUrlDraft] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { document, baseUrlOverride, lastSourceInput, setDocument, setBaseUrlOverride, setLastSourceInput } = useOpenApi();
  const t = useTranslate();

  const handleLoad = async () => {
    const input = mode === "url" ? url : json;
    if (!input.trim()) {
      toast.error(t("editor.openApiDialog.emptyInput"));
      return;
    }

    setIsLoading(true);
    try {
      const doc = await loadOpenApiDocument(input);
      setDocument(doc);
      setBaseUrlOverride(baseUrlDraft.trim());
      setLastSourceInput({ mode, value: input });
      toast.success(t("editor.openApiDialog.loadSuccess"));
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(`${t("editor.openApiDialog.loadFailed")}: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setDocument(null);
    setBaseUrlOverride("");
    setLastSourceInput(null);
    onOpenChange(false);
    toast.success(t("editor.openApiDialog.cleared"));
  };

  /**
   * Sync the local drafts whenever the dialog opens. Both the source input
   * (URL or pasted JSON) and the base URL override hydrate from the persisted
   * values so the user can tweak and re-load without re-entering everything.
   * Switches the mode toggle to whichever was last used.
   */
  useEffect(() => {
    if (!open) {
      return;
    }
    setBaseUrlDraft(baseUrlOverride);
    if (lastSourceInput) {
      setMode(lastSourceInput.mode);
      setUrl(lastSourceInput.mode === "url" ? lastSourceInput.value : "");
      setJson(lastSourceInput.mode === "json" ? lastSourceInput.value : "");
    } else {
      setMode("url");
      setUrl("");
      setJson("");
    }
  }, [open, baseUrlOverride, lastSourceInput]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="tg:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("editor.openApiDialog.title")}</DialogTitle>
        </DialogHeader>

        <p className="tg:text-muted-foreground tg:text-sm">{t("editor.openApiDialog.description")}</p>

        <ToggleGroup type="single" variant="outline" size="sm" value={mode} onValueChange={(next) => next && setMode(next as Mode)}>
          <ToggleGroupItem value="url">{t("editor.openApiDialog.modeUrl")}</ToggleGroupItem>
          <ToggleGroupItem value="json">{t("editor.openApiDialog.modeJson")}</ToggleGroupItem>
        </ToggleGroup>

        {mode === "url" ? (
          <div className="tg:flex tg:flex-col tg:gap-1">
            <Label className="tg:text-xs">{t("editor.openApiDialog.urlLabel")}</Label>
            <Input autoFocus value={url} placeholder="https://api.example.com/openapi.json" onChange={(e) => setUrl(e.target.value)} />
          </div>
        ) : (
          <div className="tg:flex tg:flex-col tg:gap-1">
            <Label className="tg:text-xs">{t("editor.openApiDialog.jsonLabel")}</Label>
            <Textarea
              autoFocus
              value={json}
              rows={10}
              className="tg:field-sizing-fixed tg:max-h-72 tg:overflow-auto tg:font-mono tg:text-xs"
              placeholder='{ "openapi": "3.0.3", ... }'
              onChange={(e) => setJson(e.target.value)}
            />
          </div>
        )}

        <div className="tg:flex tg:flex-col tg:gap-1">
          <Label className="tg:text-xs">{t("editor.openApiDialog.baseUrlLabel")}</Label>
          <Input value={baseUrlDraft} placeholder="https://api.example.com" onChange={(e) => setBaseUrlDraft(e.target.value)} />
          <p className="tg:text-muted-foreground tg:text-xs">{t("editor.openApiDialog.baseUrlHint")}</p>
        </div>

        <DialogFooter className="tg:flex tg:items-center tg:justify-between">
          {document ? (
            <Button type="button" variant="ghost" size="sm" onClick={handleClear} className="tg:text-destructive">
              {t("editor.openApiDialog.clear")}
            </Button>
          ) : (
            <span />
          )}
          <Button type="button" onClick={handleLoad} disabled={isLoading}>
            {isLoading && <Loader2 className="tg:mr-2 tg:h-4 tg:w-4 tg:animate-spin" />}
            {t("editor.openApiDialog.load")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OpenApiDialog;
