import { useEffect, useMemo, useState } from "react";
import { useOpenApi } from "@/editor/context/OpenApiContext";
import useTranslate from "@/editor/hooks/useTranslate";
import { extractSecuritySchemes } from "@/editor/utils/openapi";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { HttpHeader } from "@/shared/types/node";

interface AuthorizeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAuthorize?: (headers: HttpHeader[]) => void;
}

/**
 * Reads supported security schemes from the loaded OpenAPI document and
 * collects credentials from the user (Bearer token / API key value). On
 * submit, builds the resulting `HttpHeader[]` and calls `onAuthorize` so
 * the consumer can forward them to the renderer's global `headers`.
 *
 * Inspired by Swagger UI's "Authorize" modal. OAuth2 flows are not part of
 * this MVP and are filtered out at extraction time.
 */
const AuthorizeDialog = ({ open, onOpenChange, onAuthorize }: AuthorizeDialogProps) => {
  const [values, setValues] = useState<Record<string, string>>({});
  const { document } = useOpenApi();
  const t = useTranslate();
  const schemes = useMemo(() => (document ? extractSecuritySchemes(document) : []), [document]);

  const handleApply = () => {
    const headers: HttpHeader[] = [];
    for (const { name, scheme } of schemes) {
      const raw = values[name]?.trim();
      if (!raw) {
        continue;
      }
      if (scheme.type === "http" && scheme.scheme === "bearer") {
        headers.push({ key: "Authorization", value: `Bearer ${raw}` });
      } else if (scheme.type === "apiKey" && scheme.in === "header") {
        headers.push({ key: scheme.name, value: raw });
      }
    }
    onAuthorize?.(headers);
    onOpenChange(false);
  };

  const handleClear = () => {
    onAuthorize?.([]);
    onOpenChange(false);
  };

  /**
   * Reset the local credential drafts whenever the dialog opens so we never
   * leak credentials from a previous session into a freshly opened modal.
   */
  useEffect(() => {
    if (open) {
      setValues({});
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="tg:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("editor.authorizeDialog.title")}</DialogTitle>
        </DialogHeader>

        <p className="tg:text-muted-foreground tg:text-sm">{t("editor.authorizeDialog.description")}</p>

        {schemes.length === 0 ? (
          <p className="tg:py-4 tg:text-center tg:text-muted-foreground tg:text-sm">{t("editor.authorizeDialog.noSchemes")}</p>
        ) : (
          <div className="tg:flex tg:flex-col tg:gap-3">
            {schemes.map(({ name, scheme }) => {
              const isBearer = scheme.type === "http" && scheme.scheme === "bearer";
              const fieldLabel = isBearer
                ? t("editor.authorizeDialog.bearerLabel")
                : `${t("editor.authorizeDialog.apiKeyLabel")} (${scheme.type === "apiKey" ? scheme.name : ""})`;
              return (
                <div key={name} className="tg:flex tg:flex-col tg:gap-1">
                  <Label className="tg:text-xs">
                    {name}
                    <span className="tg:ml-2 tg:text-muted-foreground tg:text-xs">— {fieldLabel}</span>
                  </Label>
                  {scheme.description && <p className="tg:text-muted-foreground tg:text-xs">{scheme.description}</p>}
                  <Input
                    type="password"
                    autoComplete="off"
                    value={values[name] ?? ""}
                    onChange={(e) => setValues((prev) => ({ ...prev, [name]: e.target.value }))}
                    placeholder={isBearer ? "eyJhbGc..." : "..."}
                  />
                </div>
              );
            })}
          </div>
        )}

        <DialogFooter className="tg:flex tg:items-center tg:justify-between">
          <Button type="button" variant="ghost" size="sm" onClick={handleClear} className="tg:text-destructive">
            {t("editor.authorizeDialog.clear")}
          </Button>
          <Button type="button" onClick={handleApply} disabled={schemes.length === 0}>
            {t("editor.authorizeDialog.apply")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AuthorizeDialog;
