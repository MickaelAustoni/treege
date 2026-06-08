import { useMemo } from "react";
import { useTreegeRenderRuntime } from "@/renderer/context/TreegeRenderRuntimeProvider";
import { sanitize } from "@/renderer/utils/sanitize";
import { useTranslate as useTranslateShared } from "@/shared/hooks/useTranslate";
import { Translatable } from "@/shared/types/translate";

/**
 * Hook for translating text in the renderer with context-aware language preference.
 *
 * This hook uses the language from TreegeRenderRuntimeContext (or explicit override) and delegates to the shared useTranslate hook.
 * All translations are automatically sanitized to prevent XSS attacks.
 *
 * @param language - Optional language override. If not provided, uses language from context.
 * @returns A function that translates either a translation key or a Translatable object (with XSS protection)
 *
 * @example
 * // Static translation (from translation files)
 * const t = useTranslate();
 * const errorMsg = t("validation.required"); // "This field is required"
 *
 * @example
 * // Dynamic translation (from node data) - automatically sanitized
 * const t = useTranslate();
 * const label = t(node.data.label); // Translates and sanitizes user-defined content
 *
 * @example
 * // With explicit language
 * const t = useTranslate("fr");
 * const errorMsg = t("validation.required"); // "Ce champ est requis"
 */
export const useTranslate = (language?: string) => {
  const context = useTreegeRenderRuntime();
  const lang = language ?? context.language;
  const translateFn = useTranslateShared(lang);

  return useMemo(
    () => (key?: Translatable | string) => {
      const translated = translateFn(key);

      // Only sanitize dynamic translations (Translatable objects)
      // Static translations from files are already safe
      if (typeof key === "object" && key !== null) {
        return sanitize(translated);
      }

      return translated;
    },
    [translateFn],
  );
};
