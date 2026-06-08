import { useTreegeEditorRuntime } from "@/editor/context/TreegeEditorRuntimeProvider";
import { useTranslate as useTranslateShared } from "@/shared/hooks/useTranslate";

/**
 * Hook for translating text in the editor with context-aware language preference.
 *
 * This hook uses the language from TreegeEditorRuntimeContext and delegates to the shared useTranslate hook.
 *
 * @returns A function that translates either a translation key or a Translatable object
 *
 * @example
 * // Static translation (from translation files)
 * const t = useTranslate();
 * const saveButton = t("common.save"); // "Save"
 *
 * @example
 * // Dynamic translation (from node data)
 * const t = useTranslate();
 * const label = t(node.data.label); // Translates user-defined content
 */
export const useTranslate = (language?: string) => {
  const context = useTreegeEditorRuntime();
  const lang = language ?? context.language;

  return useTranslateShared(lang);
};

export default useTranslate;
