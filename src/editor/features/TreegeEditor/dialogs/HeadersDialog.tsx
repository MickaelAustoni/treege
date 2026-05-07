import { Plus, Trash2 } from "lucide-react";
import useTranslate from "@/editor/hooks/useTranslate";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { HttpHeader } from "@/shared/types/node";

interface HeadersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  headers: HttpHeader[];
  onChange: (headers: HttpHeader[]) => void;
}

/**
 * Edit the editor's "global headers" — forwarded to every HTTP request the
 * runtime form issues (HTTP inputs, submit buttons, options-source fetches).
 * Field-level headers configured on individual nodes override these on key
 * collision (case-insensitive).
 *
 * The dialog is fully controlled: the parent owns the headers list and
 * receives every mutation via `onChange`, so the same value can be forwarded
 * to `TreegeRenderer` without any state duplication.
 */
const HeadersDialog = ({ open, onOpenChange, headers, onChange }: HeadersDialogProps) => {
  const t = useTranslate();

  const updateHeader = (index: number, patch: Partial<HttpHeader>) => {
    onChange(headers.map((h, i) => (i === index ? { ...h, ...patch } : h)));
  };

  const removeHeader = (index: number) => {
    onChange(headers.filter((_, i) => i !== index));
  };

  const addHeader = () => {
    onChange([...headers, { key: "", value: "" }]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="tg:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("editor.headersDialog.title")}</DialogTitle>
          <DialogDescription>{t("editor.headersDialog.description")}</DialogDescription>
        </DialogHeader>

        <div className="tg:flex tg:flex-col tg:gap-2">
          {headers.length === 0 && (
            <p className="tg:py-4 tg:text-center tg:text-muted-foreground tg:text-sm">{t("editor.headersDialog.empty")}</p>
          )}
          {headers.map((header, index) => (
            <div key={index} className="tg:flex tg:items-center tg:gap-2">
              <Input
                placeholder={t("editor.headersDialog.keyPlaceholder")}
                value={header.key}
                onChange={(e) => updateHeader(index, { key: e.target.value })}
              />
              <Input
                placeholder={t("editor.headersDialog.valuePlaceholder")}
                value={header.value}
                onChange={(e) => updateHeader(index, { value: e.target.value })}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeHeader(index)}
                aria-label={t("editor.headersDialog.removeHeader")}
              >
                <Trash2 className="tg:h-4 tg:w-4" />
              </Button>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={addHeader}>
            <Plus className="tg:mr-2 tg:h-4 tg:w-4" />
            {t("editor.headersDialog.addHeader")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default HeadersDialog;
