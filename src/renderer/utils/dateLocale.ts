import type { Locale } from "date-fns";
import { ar, de, enUS, es, fr, it, pt } from "date-fns/locale";

/**
 * date-fns locales for every language shipped in `src/shared/locales`. The
 * locale drives the calendar's day/month names, the localized date display
 * format, and the first day of the week (e.g. Monday for `fr`).
 */
const DATE_FNS_LOCALES: Record<string, Locale> = {
  ar,
  de,
  en: enUS,
  es,
  fr,
  it,
  pt,
};

/**
 * Resolve the date-fns locale for a renderer language. Regional variants fall
 * back to their base language (`fr-FR` → `fr`), unknown languages to English.
 */
export const getDateFnsLocale = (language?: string): Locale => {
  const baseLanguage = language?.toLowerCase().split("-")[0] ?? "";
  return DATE_FNS_LOCALES[baseLanguage] ?? enUS;
};
