import { Node } from "@xyflow/react";
import { describe, expect, it } from "vitest";
import { FormValues } from "@/renderer/types/renderer";
import { isJsonTemplateValid, resolveJsonTemplate } from "@/renderer/utils/jsonTemplate";
import { InputNodeData } from "@/shared/types/node";

const nodes: Node<InputNodeData>[] = [
  { data: { name: "firstName", type: "text" }, id: "id1", position: { x: 0, y: 0 }, type: "input" },
  { data: { name: "age", type: "number" }, id: "id2", position: { x: 0, y: 0 }, type: "input" },
];

describe("resolveJsonTemplate", () => {
  it("wraps flat values into the template structure", () => {
    const formValues: FormValues = { id1: "Jean", id2: "18" };
    const template = '{ "data": { "name": "{{id1}}", "age": "{{id2}}" } }';

    expect(resolveJsonTemplate(template, formValues, nodes)).toEqual({
      data: { age: "18", name: "Jean" },
    });
  });

  it("preserves value types (a number value stays a number)", () => {
    const formValues: FormValues = { id1: "Jean", id2: 18 };
    const template = '{ "name": "{{id1}}", "age": "{{id2}}" }';

    expect(resolveJsonTemplate(template, formValues, nodes)).toEqual({ age: 18, name: "Jean" });
  });

  it("resolves references by field name as well as node id", () => {
    const formValues: FormValues = { id1: "Jean", id2: "18" };
    const template = '{ "name": "{{firstName}}", "age": "{{age}}" }';

    expect(resolveJsonTemplate(template, formValues, nodes)).toEqual({ age: "18", name: "Jean" });
  });

  it("inlines object/array values when the whole string is a token", () => {
    const formValues: FormValues = { id1: { city: "Paris", zip: "75001" } };
    const template = '{ "address": "{{id1}}" }';

    expect(resolveJsonTemplate(template, formValues, nodes)).toEqual({
      address: { city: "Paris", zip: "75001" },
    });
  });

  it("interpolates tokens embedded inside a longer string", () => {
    const formValues: FormValues = { id1: "Jean" };
    const template = '{ "greeting": "Hello {{id1}}!" }';

    expect(resolveJsonTemplate(template, formValues, nodes)).toEqual({ greeting: "Hello Jean!" });
  });

  it("resolves tokens used as object keys", () => {
    const formValues: FormValues = { id1: "category" };
    const template = '{ "{{id1}}": "value" }';

    expect(resolveJsonTemplate(template, formValues, nodes)).toEqual({ category: "value" });
  });

  it("emits null for a whole-token field that has no value", () => {
    const template = '{ "name": "{{id1}}" }';

    expect(resolveJsonTemplate(template, {}, nodes)).toEqual({ name: null });
  });

  it("returns undefined for an empty template", () => {
    expect(resolveJsonTemplate("", { id1: "Jean" }, nodes)).toBeUndefined();
    expect(resolveJsonTemplate(undefined, { id1: "Jean" }, nodes)).toBeUndefined();
    expect(resolveJsonTemplate("   ", { id1: "Jean" }, nodes)).toBeUndefined();
  });

  it("returns undefined when the template is not valid JSON", () => {
    const template = '{ "name": "{{id1}}"'; // missing closing brace

    expect(resolveJsonTemplate(template, { id1: "Jean" }, nodes)).toBeUndefined();
  });
});

describe("isJsonTemplateValid", () => {
  it("treats empty templates as valid", () => {
    expect(isJsonTemplateValid("")).toBe(true);
    expect(isJsonTemplateValid(undefined)).toBe(true);
    expect(isJsonTemplateValid("   ")).toBe(true);
  });

  it("accepts valid JSON (tokens inside quotes stay valid)", () => {
    expect(isJsonTemplateValid('{ "name": "{{id1}}" }')).toBe(true);
  });

  it("rejects malformed JSON", () => {
    expect(isJsonTemplateValid('{ "name": "{{id1}}"')).toBe(false);
  });
});
