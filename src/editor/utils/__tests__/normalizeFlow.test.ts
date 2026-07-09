import { Node } from "@xyflow/react";
import { describe, expect, it } from "vitest";
import { normalizeFlowNodes } from "@/editor/utils/normalizeFlow";

const node = (id: string, type: string, extra: Partial<Node> = {}): Node => ({
  data: {},
  id,
  position: { x: 0, y: 0 },
  type,
  ...extra,
});

describe("normalizeFlowNodes", () => {
  it("should force hidden on group nodes missing the flag", () => {
    const nodes = [node("g-1", "group", { height: 620, width: 460 }), node("input-1", "input", { parentId: "g-1" })];

    const normalized = normalizeFlowNodes(nodes);

    expect(normalized[0].hidden).toBe(true);
    // Non-group nodes are untouched (same reference, no hidden flag added).
    expect(normalized[1]).toBe(nodes[1]);
    expect(normalized[1].hidden).toBeUndefined();
  });

  it("should force hidden on group nodes explicitly marked visible", () => {
    const normalized = normalizeFlowNodes([node("g-1", "group", { hidden: false })]);

    expect(normalized[0].hidden).toBe(true);
  });

  it("should leave already hidden group nodes as-is", () => {
    const nodes = [node("g-1", "group", { hidden: true })];

    expect(normalizeFlowNodes(nodes)[0]).toBe(nodes[0]);
  });

  it("should not mutate the input nodes", () => {
    const groupNode = node("g-1", "group");

    normalizeFlowNodes([groupNode]);

    expect(groupNode.hidden).toBeUndefined();
  });
});
