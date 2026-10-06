import { useTreegeRenderRuntime } from "@/renderer/context/TreegeRenderRuntimeProvider";
import { useTranslate as useTranslateShared } from "@/shared/hooks/useTranslate";

/**
 * Hook for translating text in the renderer with context-aware language preference.
 *
 * This hook uses the language from TreegeRenderRuntimeContext (or explicit override) and delegates to the shared useTranslate hook.
 *
 * @param language - Optional language override. If not provided, uses language from context.
 * @returns A function that translates either a translation key or a Translatable object
 *
 * @example
 * // Static translation (from translation files)
 * const t = useTranslate();
 * const errorMsg = t("validation.required"); // "This field is required"
 *
 * @example
 * // Dynamic translation (from node data)
 * const t = useTranslate();
 * const label = t(node.data.label); // Translates user-defined content
 *
 * @example
 * // With explicit language
 * const t = useTranslate("fr");
 * const errorMsg = t("validation.required"); // "Ce champ est requis"
 */
export const useTranslate = (language?: string) => {
  const context = useTreegeRenderRuntime();
  const lang = language ?? context.language;

  return useTranslateShared(lang);
};
