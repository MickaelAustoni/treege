import { describe, expect, it } from "vitest";
import { resolveUrl } from "@/renderer/utils/http";

describe("resolveUrl", () => {
  it("returns the url unchanged when no base URL is configured", () => {
    expect(resolveUrl("/v2/items")).toBe("/v2/items");
    expect(resolveUrl("/v2/items", undefined)).toBe("/v2/items");
    expect(resolveUrl("/v2/items", "")).toBe("/v2/items");
  });

  it("prepends the base URL to a relative url", () => {
    expect(resolveUrl("/v2/items", "https://api.example.com")).toBe("https://api.example.com/v2/items");
    expect(resolveUrl("v2/items", "https://api.example.com")).toBe("https://api.example.com/v2/items");
  });

  it("enforces a single slash at the join", () => {
    expect(resolveUrl("/v2/items", "https://api.example.com/")).toBe("https://api.example.com/v2/items");
    expect(resolveUrl("/v2/items", "https://api.example.com//")).toBe("https://api.example.com/v2/items");
  });

  it("leaves absolute urls untouched", () => {
    expect(resolveUrl("https://other.example.com/v2/items", "https://api.example.com")).toBe("https://other.example.com/v2/items");
    expect(resolveUrl("http://other.example.com/v2/items", "https://api.example.com")).toBe("http://other.example.com/v2/items");
    expect(resolveUrl("HTTPS://other.example.com/x", "https://api.example.com")).toBe("HTTPS://other.example.com/x");
  });

  it("leaves protocol-relative urls untouched", () => {
    expect(resolveUrl("//cdn.example.com/x", "https://api.example.com")).toBe("//cdn.example.com/x");
  });

  it("returns an empty url as-is", () => {
    expect(resolveUrl("", "https://api.example.com")).toBe("");
  });
});
