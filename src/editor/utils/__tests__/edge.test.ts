import { Edge, Node } from "@xyflow/react";
import { describe, expect, it } from "vitest";
import { buildConvergence, edgeExists, normalizeConditionalEdges, wouldCreateCycle } from "@/editor/utils/edge";

const e = (source: string, target: string): Edge => ({ id: `${source}-${target}`, source, target });

const leaf = (id: string, x: number, y: number, parentId?: string): Node => ({
  data: {},
  id,
  parentId,
  position: { x, y },
  type: "input",
});

describe("edgeExists", () => {
  const edges = [e("A", "B"), e("A", "C")];

  it("returns true when the edge is present", () => {
    expect(edgeExists(edges, "A", "B")).toBe(true);
  });

  it("returns false when the edge is absent", () => {
    expect(edgeExists(edges, "B", "C")).toBe(false);
  });

  it("is directional (source → target, not the reverse)", () => {
    expect(edgeExists(edges, "B", "A")).toBe(false);
  });
});

describe("wouldCreateCycle", () => {
  it("treats a self-loop as a cycle", () => {
    expect(wouldCreateCycle([], "A", "A")).toBe(true);
  });

  it("allows converging two leaves of the same parent (no cycle)", () => {
    // A → B, A → C ; linking B and C does not close a loop.
    const edges = [e("A", "B"), e("A", "C")];
    expect(wouldCreateCycle(edges, "B", "C")).toBe(false);
  });

  it("detects a direct back-edge", () => {
    // A → B ; adding B → A would loop.
    expect(wouldCreateCycle([e("A", "B")], "B", "A")).toBe(true);
  });

  it("detects a deep cycle through descendants", () => {
    // A → B → C ; adding C → A would loop.
    const edges = [e("A", "B"), e("B", "C")];
    expect(wouldCreateCycle(edges, "C", "A")).toBe(true);
  });

  it("does not flag a forward edge to a descendant's sibling", () => {
    // A → B → D, A → C ; adding B → C is forward, not a cycle.
    const edges = [e("A", "B"), e("B", "D"), e("A", "C")];
    expect(wouldCreateCycle(edges, "B", "C")).toBe(false);
  });
});

describe("normalizeConditionalEdges", () => {
  it("downgrades a conditional edge back to default when the parent has a single child", () => {
    const edges: Edge[] = [
      { data: { conditions: [{ field: "A", operator: "===", value: "x" }] }, id: "A-B", source: "A", target: "B", type: "conditional" },
    ];
    const result = normalizeConditionalEdges(edges, new Set(["A"]));
    expect(result[0].type).toBe("default");
    expect(result[0].data).toBeUndefined();
  });
});

describe("buildConvergence", () => {
  const baseNode: Partial<Node> = { data: { type: "text" }, type: "input" };
  const options = { baseNode, commonNodeId: "D", nodeHeight: 146, verticalSpacing: 100 };

  it("creates two edges from each leaf to the common node", () => {
    const { edges } = buildConvergence(leaf("B", 800, 870), leaf("C", 1120, 870), options);

    expect(edges).toHaveLength(2);
    expect(edges).toEqual([
      { id: "B-D", source: "B", target: "D", type: "default" },
      { id: "C-D", source: "C", target: "D", type: "default" },
    ]);
  });

  it("centers the common node between the leaves, one row below the lower one", () => {
    const { node } = buildConvergence(leaf("B", 800, 870), leaf("C", 1120, 900), options);

    expect(node.id).toBe("D");
    expect(node.position.x).toBe((800 + 1120) / 2); // 960
    expect(node.position.y).toBe(900 + 146 + 100); // max(y) + height + spacing = 1146
    expect(node.selected).toBe(true);
    expect(node.type).toBe("input"); // inherited from baseNode
  });

  it("inherits the group only when both leaves share the same parent", () => {
    const sharedParent = buildConvergence(leaf("B", 0, 0, "g1"), leaf("C", 100, 0, "g1"), options);
    expect(sharedParent.node.parentId).toBe("g1");

    const differentParents = buildConvergence(leaf("B", 0, 0, "g1"), leaf("C", 100, 0, "g2"), options);
    expect(differentParents.node.parentId).toBeUndefined();

    const noParents = buildConvergence(leaf("B", 0, 0), leaf("C", 100, 0), options);
    expect(noParents.node.parentId).toBeUndefined();
  });
});
