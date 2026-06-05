import { describe, expect, it } from "vitest";
import { cleanConfigForSubType } from "@/editor/utils/cleanNodeConfig";

const httpConfig = { url: "https://api.example.com" };
const optionsSource = { headers: [{ key: "Authorization", value: "bearer x" }], url: "https://api.example.com" };
const submitConfig = { method: "POST", url: "https://api.example.com" };

describe("cleanConfigForSubType", () => {
  it("drops optionsSource (and its leftover secret) when switching to http", () => {
    const result = cleanConfigForSubType({ optionsSource, type: "http" }, "http");
    expect(result).toEqual({ type: "http" });
    expect(result).not.toHaveProperty("optionsSource");
  });

  it("keeps httpConfig for the http subtype", () => {
    const result = cleanConfigForSubType({ httpConfig, type: "http" }, "http");
    expect(result).toEqual({ httpConfig, type: "http" });
  });

  it("keeps optionsSource for option-based subtypes", () => {
    for (const subType of ["select", "radio", "checkbox", "autocomplete"]) {
      const result = cleanConfigForSubType({ optionsSource, type: subType }, subType);
      expect(result.optionsSource).toBe(optionsSource);
    }
  });

  it("drops httpConfig and submitConfig when switching to an option-based subtype", () => {
    const result = cleanConfigForSubType({ httpConfig, optionsSource, submitConfig, type: "select" }, "select");
    expect(result).toEqual({ optionsSource, type: "select" });
  });

  it("keeps submitConfig only for the submit subtype", () => {
    expect(cleanConfigForSubType({ submitConfig, type: "submit" }, "submit")).toEqual({ submitConfig, type: "submit" });
    expect(cleanConfigForSubType({ submitConfig, type: "text" }, "text")).toEqual({ type: "text" });
  });

  it("drops every config block for a plain subtype with no config", () => {
    const result = cleanConfigForSubType({ httpConfig, optionsSource, submitConfig, type: "text" }, "text");
    expect(result).toEqual({ type: "text" });
  });

  it("returns the same reference when nothing needs cleaning", () => {
    const data = { label: { en: "Hi" }, type: "text" };
    expect(cleanConfigForSubType(data, "text")).toBe(data);
  });
});
