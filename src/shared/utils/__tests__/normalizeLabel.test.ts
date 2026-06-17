import { describe, expect, it } from "vitest";
import { normalizeLabel, normalizeTranslatableLabel } from "@/shared/utils/normalizeLabel";

describe("normalizeLabel", () => {
  it("title-cases ALL CAPS labels", () => {
    expect(normalizeLabel("DUPONT JEAN")).toBe("Dupont Jean");
  });

  it("splits and title-cases snake_case", () => {
    expect(normalizeLabel("admin_user")).toBe("Admin User");
  });

  it("splits and title-cases kebab-case", () => {
    expect(normalizeLabel("admin-user")).toBe("Admin User");
  });

  it("splits and title-cases camelCase", () => {
    expect(normalizeLabel("dateNaissance")).toBe("Date Naissance");
  });

  it("collapses repeated separators and whitespace", () => {
    expect(normalizeLabel("  ADMIN___USER  ")).toBe("Admin User");
  });

  it("returns empty/whitespace-only input unchanged", () => {
    expect(normalizeLabel("")).toBe("");
    expect(normalizeLabel("   ")).toBe("   ");
  });
});

describe("normalizeTranslatableLabel", () => {
  it("normalizes every language entry while preserving shape", () => {
    expect(normalizeTranslatableLabel({ en: "ADMIN_USER", fr: "UTILISATEUR ADMIN" })).toEqual({
      en: "Admin User",
      fr: "Utilisateur Admin",
    });
  });

  it("leaves undefined entries untouched", () => {
    expect(normalizeTranslatableLabel({ en: "ADMIN", fr: undefined })).toEqual({ en: "Admin", fr: undefined });
  });
});
