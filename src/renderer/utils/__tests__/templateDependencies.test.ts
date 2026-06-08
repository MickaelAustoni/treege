import { Node } from "@xyflow/react";
import { describe, expect, it } from "vitest";
import { getTemplateDependencyIds } from "@/renderer/utils/templateDependencies";
import { InputNodeData } from "@/shared/types/node";

const makeNode = (data: InputNodeData): Node<InputNodeData> => ({
  data,
  id: "n1",
  position: { x: 0, y: 0 },
  type: "input",
});

describe("getTemplateDependencyIds", () => {
  it("returns [] when the node has no dynamic config", () => {
    expect(getTemplateDependencyIds(makeNode({ type: "text" }))).toEqual([]);
  });

  it("extracts refs from an httpConfig url", () => {
    const node = makeNode({ httpConfig: { url: "https://api/{{plan}}/sub/{{centre}}" }, type: "http" });
    expect(getTemplateDependencyIds(node)).toEqual(["plan", "centre"]);
  });

  it("extracts refs from optionsSource url, query params and body", () => {
    const node = makeNode({
      optionsSource: {
        body: "{{c}}",
        queryParams: { q: "{{b}}" },
        url: "https://api/{{a}}",
      },
      type: "select",
    });
    expect(getTemplateDependencyIds(node)).toEqual(["a", "c", "b"]);
  });

  it("de-duplicates repeated references", () => {
    const node = makeNode({ httpConfig: { url: "https://api/{{a}}/{{a}}/{{b}}" }, type: "http" });
    expect(getTemplateDependencyIds(node)).toEqual(["a", "b"]);
  });

  it("prefers httpConfig over optionsSource when both are present", () => {
    const node = makeNode({
      httpConfig: { url: "https://api/{{fromHttp}}" },
      optionsSource: { url: "https://api/{{fromOptions}}" },
      type: "http",
    });
    expect(getTemplateDependencyIds(node)).toEqual(["fromHttp"]);
  });

  it("returns [] when dynamic config has no template variables", () => {
    expect(getTemplateDependencyIds(makeNode({ httpConfig: { url: "https://api/static" }, type: "http" }))).toEqual([]);
  });
});
