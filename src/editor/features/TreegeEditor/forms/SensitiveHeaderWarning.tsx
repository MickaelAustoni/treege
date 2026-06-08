import { ShieldAlert } from "lucide-react";
import useTranslate from "@/editor/hooks/useTranslate";
import { hasSensitiveHeader } from "@/editor/utils/sensitiveHeaders";
import { KeyValueEntry } from "@/shared/utils/httpRecord";

interface SensitiveHeaderWarningProps {
  headers?: KeyValueEntry[];
}

/**
 * Inline alert shown when a field-level header carries credentials (e.g. an
 * `Authorization` bearer or API key). These headers are persisted in the
 * exported/saved tree, so the user is nudged toward the non-persisted global
 * headers (Authorize) for authentication. Renders nothing when no sensitive
 * header is present.
 */
const SensitiveHeaderWarning = ({ headers }: SensitiveHeaderWarningProps) => {
  const t = useTranslate();

  if (!hasSensitiveHeader(headers)) {
    return null;
  }

  return (
    <div
      role="alert"
      className="tg:flex tg:items-start tg:gap-2 tg:rounded-md tg:border tg:border-destructive/50 tg:bg-destructive/10 tg:p-2 tg:text-destructive tg:text-xs"
    >
      <ShieldAlert className="tg:mt-0.5 tg:h-4 tg:w-4 tg:shrink-0" />
      <span>{t("editor.sensitiveHeaderWarning.message")}</span>
    </div>
  );
};

export default SensitiveHeaderWarning;
