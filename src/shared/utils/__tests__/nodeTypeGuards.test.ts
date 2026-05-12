import { Node } from "@xyflow/react";
import { describe, expect, it } from "vitest";
import type { GroupNodeData, InputNodeData, TreegeNode, UINodeData } from "@/shared/types/node";
import { isGroupNode, isInputNode, isUINode } from "@/shared/utils/nodeTypeGuards";

describe("Node Type Guards", () => {
  describe("isInputNode", () => {
    it("should return true for input nodes", () => {
      const node: TreegeNode = {
        data: {
          label: { en: "Test Input" },
          name: "test-input",
          type: "text",
        },
        id: "input-1",
        position: { x: 0, y: 0 },
        type: "input",
      } as Node<InputNodeData, "input">;

      expect(isInputNode(node)).toBe(true);
    });

    it("should return false for non-input nodes", () => {
      const uiNode: TreegeNode = {
        data: { label: { en: "Title" }, type: "title" },
        id: "ui-1",
        position: { x: 0, y: 0 },
        type: "ui",
      } as Node<UINodeData, "ui">;

      expect(isInputNode(uiNode)).toBe(false);
    });

    it("should return false for undefined node", () => {
      expect(isInputNode(undefined)).toBe(false);
    });

    it("should narrow type correctly", () => {
      const node: TreegeNode = {
        data: {
          label: { en: "Test" },
          name: "test",
          type: "text",
        },
        id: "input-1",
        position: { x: 0, y: 0 },
        type: "input",
      } as Node<InputNodeData, "input">;

      if (isInputNode(node)) {
        // TypeScript should infer this as Node<InputNodeData, "input">
        expect(node.data.name).toBeDefined();
        expect(node.type).toBe("input");
      }
    });
  });

  describe("isUINode", () => {
    it("should return true for UI nodes", () => {
      const node: TreegeNode = {
        data: {
          label: { en: "Test UI" },
          type: "title",
        },
        id: "ui-1",
        position: { x: 0, y: 0 },
        type: "ui",
      } as Node<UINodeData, "ui">;

      expect(isUINode(node)).toBe(true);
    });

    it("should return false for non-UI nodes", () => {
      const inputNode: TreegeNode = {
        data: {
          label: { en: "Input" },
          name: "input",
        },
        id: "input-1",
        position: { x: 0, y: 0 },
        type: "input",
      } as Node<InputNodeData, "input">;

      expect(isUINode(inputNode)).toBe(false);
    });

    it("should return false for undefined node", () => {
      expect(isUINode(undefined)).toBe(false);
    });

    it("should narrow type correctly", () => {
      const node: TreegeNode = {
        data: {
          label: { en: "Button" },
          type: "title",
        },
        id: "ui-1",
        position: { x: 0, y: 0 },
        type: "ui",
      } as Node<UINodeData, "ui">;

      if (isUINode(node)) {
        // TypeScript should infer this as Node<UINodeData, "ui">
        expect(node.data.type).toBeDefined();
        expect(node.type).toBe("ui");
      }
    });
  });

  describe("isGroupNode", () => {
    it("should return true for group nodes", () => {
      const node: TreegeNode = {
        data: {
          label: { en: "Group Container" },
        },
        id: "group-1",
        position: { x: 0, y: 0 },
        type: "group",
      } as Node<GroupNodeData, "group">;

      expect(isGroupNode(node)).toBe(true);
    });

    it("should return false for non-group nodes", () => {
      const inputNode: TreegeNode = {
        data: {
          label: { en: "Input" },
          name: "input",
        },
        id: "input-1",
        position: { x: 0, y: 0 },
        type: "input",
      } as Node<InputNodeData, "input">;

      expect(isGroupNode(inputNode)).toBe(false);
    });

    it("should return false for undefined node", () => {
      expect(isGroupNode(undefined)).toBe(false);
    });

    it("should narrow type correctly", () => {
      const node: TreegeNode = {
        data: {
          label: { en: "My Group" },
        },
        id: "group-1",
        position: { x: 0, y: 0 },
        type: "group",
      } as Node<GroupNodeData, "group">;

      if (isGroupNode(node)) {
        // TypeScript should infer this as Node<GroupNodeData, "group">
        expect(node.data.label).toBeDefined();
        expect(node.type).toBe("group");
      }
    });
  });

  describe("Type Guard Edge Cases", () => {
    it("should handle nodes with missing data", () => {
      const node: TreegeNode = {
        data: {},
        id: "node-1",
        position: { x: 0, y: 0 },
        type: "input",
      } as Node<InputNodeData, "input">;

      expect(isInputNode(node)).toBe(true);
      expect(isUINode(node)).toBe(false);
      expect(isGroupNode(node)).toBe(false);
    });

    it("should differentiate between all node types", () => {
      const inputNode: TreegeNode = {
        data: { name: "input" },
        id: "1",
        position: { x: 0, y: 0 },
        type: "input",
      } as Node<InputNodeData, "input">;

      const uiNode: TreegeNode = {
        data: { type: "title" },
        id: "2",
        position: { x: 0, y: 0 },
        type: "ui",
      } as Node<UINodeData, "ui">;

      const groupNode: TreegeNode = {
        data: { label: { en: "Group" } },
        id: "3",
        position: { x: 0, y: 0 },
        type: "group",
      } as Node<GroupNodeData, "group">;

      expect(isInputNode(inputNode)).toBe(true);
      expect(isUINode(uiNode)).toBe(true);
      expect(isGroupNode(groupNode)).toBe(true);

      // Cross-check that types are mutually exclusive
      expect(isUINode(inputNode)).toBe(false);
      expect(isGroupNode(inputNode)).toBe(false);

      expect(isInputNode(uiNode)).toBe(false);
      expect(isGroupNode(uiNode)).toBe(false);

      expect(isInputNode(groupNode)).toBe(false);
      expect(isUINode(groupNode)).toBe(false);
    });
  });
});
