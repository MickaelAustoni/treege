/**
 * Static translations for the application
 * These are internal translations for UI elements, validation messages, etc.
 */

import ar from "@/shared/locales/ar.json";
import de from "@/shared/locales/de.json";
import en from "@/shared/locales/en.json";
import es from "@/shared/locales/es.json";
import fr from "@/shared/locales/fr.json";
import it from "@/shared/locales/it.json";
import pt from "@/shared/locales/pt.json";
import type { Translatable } from "@/shared/types/translate";

export type TranslationDict = {
  [key: string]: string | TranslationDict;
};

/**
 * Helper type to extract all dot-notation paths from a nested object
 */
type DotNotationKeys<T, Prefix extends string = ""> = T extends Record<string, unknown>
  ? {
      [K in keyof T & string]: T[K] extends Record<string, unknown> ? DotNotationKeys<T[K], `${Prefix}${K}.`> : `${Prefix}${K}`;
    }[keyof T & string]
  : never;

/**
 * Dynamically generated type of all available translation keys
 * based on the English locale file
 */
export type TranslationKey = DotNotationKeys<typeof en>;

/**
 * Get the translated text (label, placeholder, helper text, error message, etc.)
 * with fallback to English or first available language
 * @param text - The translatable text object or plain string
 * @param language - Optional preferred language (defaults to 'en')
 * @returns The translated string or empty string if none available
 */
export const getTranslatedText = (text?: Translatable | string, language: string = "en"): string => {
  if (!text) {
    return "";
  }

  if (typeof text === "string") {
    return text;
  }

  return text[language] || text.en || Object.values(text).find(Boolean) || "";
};

/**
 * Available locales
 */
const locales: Record<string, TranslationDict> = {
  ar,
  de,
  en,
  es,
  fr,
  it,
  pt,
};

/**
 * Flatten nested translation object to dot notation
 * e.g., { validation: { required: "..." } } => { "validation.required": "..." }
 */
const flattenTranslations = (obj: TranslationDict, prefix = ""): Record<string, string> =>
  Object.keys(obj).reduce(
    (acc, key) => {
      const value = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        Object.assign(acc, flattenTranslations(value, newKey));
      } else {
        acc[newKey] = String(value);
      }

      return acc;
    },
    {} as Record<string, string>,
  );

/**
 * Get static translations for a specific language
 * Falls back to English if language not found
 */
export const getStaticTranslations = (language: string): Record<string, string> => {
  const locale = locales[language] || locales.en;
  return flattenTranslations(locale);
};
