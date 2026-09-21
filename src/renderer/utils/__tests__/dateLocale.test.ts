import { describe, expect, it } from "vitest";
import { getCalendarLabels, getDateFnsLocale } from "@/renderer/utils/dateLocale";

describe("getDateFnsLocale", () => {
  it("should resolve every shipped renderer language", () => {
    expect(getDateFnsLocale("fr").code).toBe("fr");
    expect(getDateFnsLocale("de").code).toBe("de");
    expect(getDateFnsLocale("es").code).toBe("es");
    expect(getDateFnsLocale("it").code).toBe("it");
    expect(getDateFnsLocale("pt").code).toBe("pt");
    expect(getDateFnsLocale("ar").code).toBe("ar");
    expect(getDateFnsLocale("en").code).toBe("en-US");
  });

  it("should start the week on Monday for French", () => {
    expect(getDateFnsLocale("fr").options?.weekStartsOn).toBe(1);
  });

  it("should fall back to the base language for regional variants", () => {
    expect(getDateFnsLocale("fr-FR").code).toBe("fr");
    expect(getDateFnsLocale("PT-br").code).toBe("pt");
  });

  it("should fall back to English for unknown or missing languages", () => {
    expect(getDateFnsLocale("xx").code).toBe("en-US");
    expect(getDateFnsLocale(undefined).code).toBe("en-US");
    expect(getDateFnsLocale("").code).toBe("en-US");
  });
});

describe("getCalendarLabels", () => {
  it("should name the months and weekdays in French, the week starting on Monday", () => {
    const { monthNames, weekDays, weekStartsOn } = getCalendarLabels("fr");

    expect(monthNames).toHaveLength(12);
    expect(monthNames[8]).toBe("Septembre");
    expect(weekStartsOn).toBe(1);
    expect(weekDays).toHaveLength(7);
    expect(weekDays[0]).toBe("Lun.");
    expect(weekDays[6]).toBe("Dim.");
  });

  it("should keep the English week starting on Sunday", () => {
    const { monthNames, weekDays, weekStartsOn } = getCalendarLabels("en");

    expect(monthNames[0]).toBe("January");
    expect(weekStartsOn).toBe(0);
    expect(weekDays[0]).toBe("Sun");
  });

  it("should fall back to English for an unknown language", () => {
    expect(getCalendarLabels("xx").monthNames[11]).toBe("December");
  });
});
