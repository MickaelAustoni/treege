import { describe, expect, it } from "vitest";
import { mergeExtraPayload } from "@/renderer/utils/extraPayload";

describe("mergeExtraPayload", () => {
  it("returns the base untouched when there is no extraPayload", () => {
    const base = { a: 1 };
    expect(mergeExtraPayload(base, undefined, {})).toBe(base);
  });

  it("merges a static object on top of the base", () => {
    expect(mergeExtraPayload({ a: 1 }, { userId: "u1" }, {})).toEqual({ a: 1, userId: "u1" });
  });

  it("evaluates the function form against the current values", () => {
    expect(mergeExtraPayload({ a: 1 }, (values) => ({ echoedName: values.name }), { name: "Ada" })).toEqual({ a: 1, echoedName: "Ada" });
  });

  it("lets the extra win on a key collision (spread last)", () => {
    expect(mergeExtraPayload({ userId: "form" }, { userId: "host" }, {})).toEqual({ userId: "host" });
  });

  it("emits the extra alone when the base would otherwise be empty", () => {
    expect(mergeExtraPayload(undefined, { userId: "u1" }, {})).toEqual({ userId: "u1" });
  });

  it("leaves a non-object base untouched (nothing to merge into)", () => {
    expect(mergeExtraPayload(["a"], { userId: "u1" }, {})).toEqual(["a"]);
  });

  it("ignores an extraPayload that resolves to a non-object", () => {
    const base = { a: 1 };
    expect(mergeExtraPayload(base, () => ["nope"] as unknown as Record<string, unknown>, {})).toBe(base);
  });
});
