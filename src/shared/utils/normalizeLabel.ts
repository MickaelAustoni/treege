import type { Translatable } from "@/shared/types/translate";

/**
 * Normalizes a raw label string into a uniform, readable Title Case form.
 *
 * Designed for labels coming from an API where casing is often inconsistent
 * (ALL CAPS, snake_case, kebab-case, camelCase). Each word gets an uppercase
 * first letter and a lowercase remainder, with separators collapsed to single
 * spaces:
 *
 *   "DUPONT JEAN"   -> "Dupont Jean"
 *   "admin_user"    -> "Admin User"
 *   "dateNaissance" -> "Date Naissance"
 *
 * Empty/whitespace-only input is returned unchanged.
 */
export const normalizeLabel = (text: string): string => {
  if (!text.trim()) {
    return text;
  }

  return text
    .replace(/[_-]+/g, " ") // snake_case / kebab-case -> spaces
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2") // split camelCase boundaries
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

/**
 * Applies {@link normalizeLabel} to every language entry of a `Translatable`
 * label, preserving its shape.
 */
export const normalizeTranslatableLabel = (label: Translatable): Translatable =>
  Object.fromEntries(Object.entries(label).map(([lang, value]) => [lang, typeof value === "string" ? normalizeLabel(value) : value]));
