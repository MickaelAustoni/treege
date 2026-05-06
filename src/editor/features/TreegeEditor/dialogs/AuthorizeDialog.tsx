import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useOpenApi } from "@/editor/context/OpenApiContext";
import useTranslate from "@/editor/hooks/useTranslate";
import { OpenApiDocument, OpenApiOAuth2PasswordScheme } from "@/editor/types/openapi";
import { extractSecuritySchemes, resolveTokenUrl } from "@/editor/utils/openapi";
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
 * Exchange a username/password for an access token via the OAuth2 password
 * grant, then return the resulting `Authorization` header. Throws on network
 * errors, non-2xx responses, or a missing `access_token` in the response.
 */
const fetchOAuth2PasswordToken = async (
  scheme: OpenApiOAuth2PasswordScheme,
  doc: OpenApiDocument,
  username: string,
  password: string,
): Promise<HttpHeader> => {
  const tokenUrl = resolveTokenUrl(scheme.tokenUrl, doc);
  const body = new URLSearchParams({ grant_type: "password", password, username }).toString();

  const response = await fetch(tokenUrl, {
    body,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    method: "POST",
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text ? `${response.status}: ${text.slice(0, 200)}` : `HTTP ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as { access_token?: string; token_type?: string };
  if (!data.access_token) {
    throw new Error("Token endpoint did not return an access_token");
  }
  const tokenType = data.token_type ? `${data.token_type[0].toUpperCase()}${data.token_type.slice(1).toLowerCase()}` : "Bearer";
  return { key: "Authorization", value: `${tokenType} ${data.access_token}` };
};

/**
 * Reads supported security schemes from the loaded OpenAPI document and
 * collects credentials from the user (Bearer token, API key value, or
 * OAuth2 password grant). On submit, exchanges OAuth2 credentials at the
 * token endpoint, builds the resulting `HttpHeader[]`, and calls
 * `onAuthorize` so the consumer can forward them to the renderer's
 * global `headers`.
 *
 * Inspired by Swagger UI's "Authorize" modal. OAuth2 flows other than
 * `password` (auth_code, client_credentials, implicit) are out of scope —
 * they require browser redirects, server-side state, or PKCE.
 */
const AuthorizeDialog = ({ open, onOpenChange, onAuthorize }: AuthorizeDialogProps) => {
  const [values, setValues] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const { document } = useOpenApi();
  const t = useTranslate();
  const schemes = useMemo(() => (document ? extractSecuritySchemes(document) : []), [document]);

  /** Compose state keys: `bearer` schemes use just `name`, OAuth2 password uses `name:username` / `name:password`. */
  const valueKey = (schemeName: string, suffix?: "username" | "password") => (suffix ? `${schemeName}:${suffix}` : schemeName);

  const handleApply = async () => {
    if (!document) {
      return;
    }

    setIsLoading(true);
    try {
      const headers: HttpHeader[] = [];

      for (const { name, scheme } of schemes) {
        if (scheme.type === "http" && scheme.scheme === "bearer") {
          const token = values[valueKey(name)]?.trim();
          if (token) {
            headers.push({ key: "Authorization", value: `Bearer ${token}` });
          }
        } else if (scheme.type === "apiKey" && scheme.in === "header") {
          const apiKey = values[valueKey(name)]?.trim();
          if (apiKey) {
            headers.push({ key: scheme.name, value: apiKey });
          }
        } else if (scheme.type === "oauth2") {
          const username = values[valueKey(name, "username")]?.trim();
          const password = values[valueKey(name, "password")];
          if (!(username && password)) {
            continue;
          }
          headers.push(await fetchOAuth2PasswordToken(scheme, document, username, password));
        }
      }

      onAuthorize?.(headers);
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(`${t("editor.authorizeDialog.exchangeFailed")}: ${message}`);
    } finally {
      setIsLoading(false);
    }
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
          <div className="tg:flex tg:flex-col tg:gap-4">
            {schemes.map(({ name, scheme }) => {
              if (scheme.type === "oauth2") {
                return (
                  <div key={name} className="tg:flex tg:flex-col tg:gap-2">
                    <Label className="tg:text-xs">
                      {name}
                      <span className="tg:ml-2 tg:text-muted-foreground tg:text-xs">
                        — {t("editor.authorizeDialog.oauth2PasswordLabel")}
                      </span>
                    </Label>
                    {scheme.description && <p className="tg:text-muted-foreground tg:text-xs">{scheme.description}</p>}
                    <Input
                      autoComplete="off"
                      value={values[valueKey(name, "username")] ?? ""}
                      onChange={(e) => setValues((prev) => ({ ...prev, [valueKey(name, "username")]: e.target.value }))}
                      placeholder={t("editor.authorizeDialog.usernamePlaceholder")}
                    />
                    <Input
                      type="password"
                      autoComplete="off"
                      value={values[valueKey(name, "password")] ?? ""}
                      onChange={(e) => setValues((prev) => ({ ...prev, [valueKey(name, "password")]: e.target.value }))}
                      placeholder={t("editor.authorizeDialog.passwordPlaceholder")}
                    />
                  </div>
                );
              }

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
                    value={values[valueKey(name)] ?? ""}
                    onChange={(e) => setValues((prev) => ({ ...prev, [valueKey(name)]: e.target.value }))}
                    placeholder={isBearer ? "eyJhbGc..." : "..."}
                  />
                </div>
              );
            })}
          </div>
        )}

        <DialogFooter className="tg:flex tg:items-center tg:justify-between">
          <Button type="button" variant="ghost" size="sm" onClick={handleClear} className="tg:text-destructive" disabled={isLoading}>
            {t("editor.authorizeDialog.clear")}
          </Button>
          <Button type="button" onClick={handleApply} disabled={schemes.length === 0 || isLoading}>
            {isLoading && <Loader2 className="tg:mr-2 tg:h-4 tg:w-4 tg:animate-spin" />}
            {t("editor.authorizeDialog.apply")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AuthorizeDialog;
