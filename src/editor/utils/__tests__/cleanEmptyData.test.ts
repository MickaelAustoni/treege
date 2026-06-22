import { describe, expect, it } from "vitest";
import { cleanEmptyData, cleanFlowData } from "@/editor/utils/cleanEmptyData";
import type { Flow } from "@/shared/types/node";

describe("cleanEmptyData", () => {
  it("keeps a node with just a label untouched", () => {
    const data = { label: { en: "First name" }, type: "text" };
    expect(cleanEmptyData(data)).toEqual({ label: { en: "First name" }, type: "text" });
  });

  it("drops the empty defaults that the form fabricates around a `name`", () => {
    const data = {
      errorMessage: { en: "" },
      helperText: { en: "" },
      label: { en: "First name" },
      name: "test",
      options: [],
      pattern: "",
      placeholder: { en: "" },
      type: "text",
      variant: "card",
    };

    expect(cleanEmptyData(data)).toEqual({ label: { en: "First name" }, name: "test", type: "text" });
  });

  it("drops undefined, null, empty string, and empty array", () => {
    const data = { a: undefined, b: null, c: "", d: [], e: "keep" };
    expect(cleanEmptyData(data)).toEqual({ e: "keep" });
  });

  it("drops objects whose every entry is empty but keeps partially filled labels", () => {
    expect(cleanEmptyData({ label: { en: "", fr: "" } })).toEqual({});
    expect(cleanEmptyData({ label: { en: "", fr: "Nom" } })).toEqual({ label: { en: "", fr: "Nom" } });
  });

  it("keeps meaningful falsy values (false, 0)", () => {
    const data = { defaultValue: 0, normalizeOptionLabels: false, required: false };
    expect(cleanEmptyData(data)).toEqual({ defaultValue: 0, normalizeOptionLabels: false, required: false });
  });

  it("drops `variant` only when it equals the default 'card'", () => {
    expect(cleanEmptyData({ variant: "card" })).toEqual({});
    expect(cleanEmptyData({ variant: "default" })).toEqual({ variant: "default" });
  });

  it("keeps populated config blocks", () => {
    const httpConfig = { url: "https://api.example.com" };
    expect(cleanEmptyData({ httpConfig, type: "http" })).toEqual({ httpConfig, type: "http" });
  });
});

describe("cleanFlowData", () => {
  it("cleans each node's data without mutating the input flow", () => {
    const flow = {
      edges: [],
      id: "flow-1",
      nodes: [
        {
          data: { errorMessage: { en: "" }, label: { en: "First name" }, name: "test", options: [], pattern: "", type: "text" },
          id: "node-1",
          position: { x: 0, y: 0 },
          type: "input",
        },
      ],
    } as unknown as Flow;

    const result = cleanFlowData(flow);

    expect(result.nodes[0].data).toEqual({ label: { en: "First name" }, name: "test", type: "text" });
    // input flow untouched (live canvas keeps its values)
    expect(flow.nodes[0].data).toHaveProperty("pattern", "");
    expect(result).not.toBe(flow);
  });
});
