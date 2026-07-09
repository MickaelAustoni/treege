import { Node } from "@xyflow/react";
import { describe, expect, it } from "vitest";
import { AIGenerationResponse } from "@/editor/types/ai";
import { sanitizeGeneratedFlow } from "@/editor/utils/aiFlowGenerator";

const node = (id: string, type: string, extra: Partial<Node> = {}): Node => ({
  data: {},
  id,
  position: { x: 0, y: 0 },
  type,
  ...extra,
});

describe("sanitizeGeneratedFlow", () => {
  it("should throw on a response without nodes/edges arrays", () => {
    expect(() => sanitizeGeneratedFlow({} as AIGenerationResponse)).toThrow("Invalid AI response");
    expect(() => sanitizeGeneratedFlow({ edges: [], nodes: "oops" } as unknown as AIGenerationResponse)).toThrow("Invalid AI response");
  });

  it("should force group nodes hidden and anchored at the origin", () => {
    const result = sanitizeGeneratedFlow({
      edges: [],
      nodes: [node("g-1", "group", { height: 400, position: { x: 600, y: 120 }, width: 600 })],
    });

    expect(result.nodes[0].hidden).toBe(true);
    expect(result.nodes[0].position).toEqual({ x: 0, y: 0 });
  });

  it("should hoist group nodes before their children", () => {
    const result = sanitizeGeneratedFlow({
      edges: [],
      nodes: [node("input-1", "input", { parentId: "g-1" }), node("g-1", "group"), node("input-2", "input", { parentId: "g-1" })],
    });

    expect(result.nodes.map((n) => n.id)).toEqual(["g-1", "input-1", "input-2"]);
  });

  it("should drop a parentId that does not reference a group node", () => {
    const result = sanitizeGeneratedFlow({
      edges: [],
      nodes: [node("input-1", "input", { parentId: "missing-group" }), node("input-2", "input", { parentId: "input-1" })],
    });

    expect(result.nodes.every((n) => n.parentId === undefined)).toBe(true);
  });

  it("should keep valid input nodes and edges untouched", () => {
    const inputNode = node("input-1", "input", { parentId: "g-1" });
    const edges = [{ id: "e1", source: "input-1", target: "input-2" }];

    const result = sanitizeGeneratedFlow({ edges, nodes: [node("g-1", "group", { hidden: true }), inputNode] });

    expect(result.nodes[1]).toBe(inputNode);
    expect(result.edges).toBe(edges);
  });
});
