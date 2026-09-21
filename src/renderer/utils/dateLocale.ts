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

const MONTH_INDEXES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;

const DAY_INDEXES = [0, 1, 2, 3, 4, 5, 6] as const;

const capitalize = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * Localized labels of a month calendar grid, for pickers drawn by hand (the
 * native date inputs): month names, short weekday names already rotated to
 * start on the locale's first day of the week, and that first day (0 = Sunday)
 * so the grid can offset its first row the same way.
 */
export const getCalendarLabels = (language?: string): { monthNames: string[]; weekDays: string[]; weekStartsOn: number } => {
  const locale = getDateFnsLocale(language);
  const weekStartsOn = locale.options?.weekStartsOn ?? 0;

  return {
    monthNames: MONTH_INDEXES.map((month) => capitalize(locale.localize.month(month, { width: "wide" }))),
    weekDays: DAY_INDEXES.map((offset) => {
      const day = DAY_INDEXES[(weekStartsOn + offset) % 7];

      return capitalize(locale.localize.day(day, { width: "abbreviated" }));
    }),
    weekStartsOn,
  };
};
