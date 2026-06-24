import { Edge, Node } from "@xyflow/react";
import { describe, expect, it } from "vitest";
import { getViewerFields, isImageFile, viewerFieldsFromResponse } from "@/renderer/features/TreegeViewer/utils/viewerFields";
import { SerializableFile } from "@/shared/types/file";
import { Flow } from "@/shared/types/node";

const makeFile = (overrides: Partial<SerializableFile>): SerializableFile => ({
  data: "",
  lastModified: 0,
  name: "f",
  size: 0,
  type: "",
  ...overrides,
});

/**
 * A small two-branch flow: a `root` radio selects between the `a` and `b`
 * branches. Branch `a` holds one of each tricky type (select, daterange, file,
 * switch, checkbox), a `hidden` field and a `submit`. Branch `b` is never
 * reached by the test values.
 */
const flow: Flow = {
  edges: [
    {
      data: { conditions: [{ field: "root", operator: "===", value: "a" }] },
      id: "e-a",
      source: "root",
      target: "a-select",
      type: "conditional",
    },
    {
      data: { conditions: [{ field: "root", operator: "===", value: "b" }] },
      id: "e-b",
      source: "root",
      target: "b-text",
      type: "conditional",
    },
    { id: "e-a1", source: "a-select", target: "a-dates", type: "default" },
    { id: "e-a2", source: "a-dates", target: "a-file", type: "default" },
    { id: "e-a3", source: "a-file", target: "a-switch", type: "default" },
    { id: "e-a4", source: "a-switch", target: "a-tags", type: "default" },
    { id: "e-a5", source: "a-tags", target: "a-hidden", type: "default" },
    { id: "e-a6", source: "a-hidden", target: "a-submit", type: "default" },
  ] as Edge[],
  id: "test",
  nodes: [
    {
      data: {
        options: [
          { label: { en: "A" }, value: "a" },
          { label: { en: "B" }, value: "b" },
        ],
        required: true,
        type: "radio",
      },
      id: "root",
      position: { x: 0, y: 0 },
      type: "input",
    },
    {
      data: {
        label: { en: "Reason" },
        name: "reason",
        options: [{ label: { en: "Broken", fr: "Cassé" }, value: "broken" }],
        type: "select",
      },
      id: "a-select",
      position: { x: 0, y: 0 },
      type: "input",
    },
    { data: { label: { en: "Dates" }, name: "dates", type: "daterange" }, id: "a-dates", position: { x: 0, y: 0 }, type: "input" },
    { data: { label: { en: "Docs" }, name: "docs", type: "file" }, id: "a-file", position: { x: 0, y: 0 }, type: "input" },
    { data: { label: { en: "Active" }, name: "active", type: "switch" }, id: "a-switch", position: { x: 0, y: 0 }, type: "input" },
    {
      data: {
        label: { en: "Tags" },
        name: "tags",
        options: [
          { label: { en: "One" }, value: "1" },
          { label: { en: "Two" }, value: "2" },
        ],
        type: "checkbox",
      },
      id: "a-tags",
      position: { x: 0, y: 0 },
      type: "input",
    },
    { data: { name: "secret", type: "hidden" }, id: "a-hidden", position: { x: 0, y: 0 }, type: "input" },
    { data: { name: "send", type: "submit" }, id: "a-submit", position: { x: 0, y: 0 }, type: "input" },
    { data: { label: { en: "Other" }, name: "other", type: "text" }, id: "b-text", position: { x: 0, y: 0 }, type: "input" },
  ] as Node[],
};

describe("getViewerFields", () => {
  const values = {
    "a-tags": ["1", "2"],
    active: true,
    dates: ["2026-06-01T00:00:00.000Z", "2026-07-15T00:00:00.000Z"],
    docs: [{ data: "data:application/pdf;base64,AA", name: "contract.pdf", size: 1, type: "application/pdf" }],
    reason: "broken",
    root: "a",
    secret: "should-not-show",
  };

  it("returns only the reachable branch, excluding hidden and submit nodes", () => {
    const fields = getViewerFields(flow, values);
    const ids = fields.map((field) => field.id);

    expect(ids).toEqual(["root", "a-select", "a-dates", "a-file", "a-switch", "a-tags"]);
    expect(ids).not.toContain("a-hidden");
    expect(ids).not.toContain("a-submit");
    expect(ids).not.toContain("b-text");
  });

  it("resolves single-choice option labels in the requested language", () => {
    const field = getViewerFields(flow, values, { language: "fr" }).find((entry) => entry.name === "reason");
    expect(field?.display).toEqual({ kind: "text", text: "Cassé" });
  });

  it("formats a daterange given as an array", () => {
    const field = getViewerFields(flow, values).find((entry) => entry.name === "dates");
    expect(field?.display.kind).toBe("text");
    expect(field?.display).toMatchObject({ text: expect.stringContaining(" → ") });
  });

  it("formats a daterange given as a comma-string", () => {
    const field = getViewerFields(flow, { ...values, dates: "2026-06-01,2026-07-15" }).find((entry) => entry.name === "dates");
    expect(field?.display.kind).toBe("text");
    expect(field?.display).toMatchObject({ text: expect.stringContaining(" → ") });
  });

  it("maps multi-checkbox values to option labels (tags)", () => {
    const field = getViewerFields(flow, values).find((entry) => entry.name === "tags");
    expect(field?.display).toEqual({ kind: "tags", tags: ["One", "Two"] });
  });

  it("exposes a switch as a boolean", () => {
    const field = getViewerFields(flow, values).find((entry) => entry.name === "active");
    expect(field?.display).toEqual({ checked: true, kind: "boolean" });
  });

  it("normalizes files", () => {
    const field = getViewerFields(flow, values).find((entry) => entry.name === "docs");
    expect(field?.display.kind).toBe("files");
    expect(field?.display).toMatchObject({ files: [{ name: "contract.pdf" }] });
  });

  it("accepts a file given as a URL string (name derived from the URL)", () => {
    const field = getViewerFields(flow, { ...values, docs: "https://cdn.example.com/files/report.pdf?token=abc" }).find(
      (entry) => entry.name === "docs",
    );
    expect(field?.display).toMatchObject({ files: [{ data: "https://cdn.example.com/files/report.pdf?token=abc", name: "report.pdf" }] });
  });

  it("accepts a mix of URL strings and SerializableFiles", () => {
    const field = getViewerFields(flow, {
      ...values,
      docs: ["https://cdn.example.com/a.png", { data: "data:application/pdf;base64,AA", name: "b.pdf", size: 1, type: "application/pdf" }],
    }).find((entry) => entry.name === "docs");
    expect(field?.display.kind).toBe("files");
    expect(field?.display).toMatchObject({ files: [{ name: "a.png" }, { name: "b.pdf" }] });
  });

  it("resolves relative file paths against baseUrl, leaving data-URLs untouched", () => {
    const field = getViewerFields(
      flow,
      {
        ...values,
        docs: ["uploads/photo.png", { data: "data:application/pdf;base64,AA", name: "b.pdf", size: 1, type: "application/pdf" }],
      },
      { baseUrl: "https://api.example.com/" },
    ).find((entry) => entry.name === "docs");
    expect(field?.display).toMatchObject({
      files: [
        { data: "https://api.example.com/uploads/photo.png", name: "photo.png" },
        { data: "data:application/pdf;base64,AA", name: "b.pdf" },
      ],
    });
  });

  it("leaves absolute file URLs untouched even with a baseUrl", () => {
    const field = getViewerFields(flow, { ...values, docs: "https://cdn.example.com/a.png" }, { baseUrl: "https://api.example.com" }).find(
      (entry) => entry.name === "docs",
    );
    expect(field?.display).toMatchObject({ files: [{ data: "https://cdn.example.com/a.png" }] });
  });

  it("marks an absent value as empty", () => {
    const field = getViewerFields(flow, { ...values, active: undefined }).find((entry) => entry.name === "active");
    expect(field?.display).toEqual({ kind: "empty" });
  });

  it("accepts node-id-keyed values too", () => {
    const fields = getViewerFields(flow, { "a-select": "broken", root: "a" });
    expect(fields.find((entry) => entry.name === "reason")?.display).toEqual({ kind: "text", text: "Broken" });
  });
});

describe("viewerFieldsFromResponse", () => {
  it("builds fields from self-describing entries (no flow)", () => {
    const fields = viewerFieldsFromResponse(
      [
        { label: { en: "City" }, name: "city", type: "text", value: "Paris" },
        { name: "active", type: "switch", value: true },
        { label: { en: "Dates" }, name: "dates", type: "daterange", value: "2026-06-01,2026-07-15" },
      ],
      { language: "en" },
    );

    expect(fields.map((field) => [field.label, field.display])).toEqual([
      ["City", { kind: "text", text: "Paris" }],
      ["active", { checked: true, kind: "boolean" }],
      ["Dates", { kind: "text", text: expect.stringContaining(" → ") }],
    ]);
  });

  it("falls back to the name when no label, and tolerates a plain-string label", () => {
    const fields = viewerFieldsFromResponse([
      { name: "comment", type: "text", value: "x" },
      { label: "Libellé", name: "other", type: "text", value: "y" },
    ]);
    expect(fields.map((field) => field.label)).toEqual(["comment", "Libellé"]);
  });

  it("skips hidden/submit and unnamed entries", () => {
    const fields = viewerFieldsFromResponse([
      { name: "secret", type: "hidden", value: "x" },
      { name: "send", type: "submit", value: "y" },
      { type: "text", value: "no-name" },
      { name: "kept", type: "text", value: "z" },
    ]);
    expect(fields.map((field) => field.name)).toEqual(["kept"]);
  });
});

describe("isImageFile", () => {
  it("detects images by MIME type", () => {
    expect(isImageFile(makeFile({ type: "image/png" }))).toBe(true);
    expect(isImageFile(makeFile({ type: "application/pdf" }))).toBe(false);
  });

  it("detects images by data-URL", () => {
    expect(isImageFile(makeFile({ data: "data:image/jpeg;base64,AA" }))).toBe(true);
    expect(isImageFile(makeFile({ data: "data:application/pdf;base64,AA" }))).toBe(false);
  });

  it("detects images by URL extension (ignoring query/hash)", () => {
    expect(isImageFile(makeFile({ data: "https://cdn.example.com/a.png" }))).toBe(true);
    expect(isImageFile(makeFile({ data: "https://cdn.example.com/a.jpg?token=x" }))).toBe(true);
    expect(isImageFile(makeFile({ data: "https://cdn.example.com/doc.pdf" }))).toBe(false);
  });
});
