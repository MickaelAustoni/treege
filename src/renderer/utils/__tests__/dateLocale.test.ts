import { describe, expect, it } from "vitest";
import { getDateFnsLocale } from "@/renderer/utils/dateLocale";

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
