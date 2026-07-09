import { Node } from "@xyflow/react";
import { describe, expect, it } from "vitest";
import { computeSteps, FlowStep, getAutoAdvanceNodeId } from "@/renderer/utils/step";
import { InputNodeData, TreegeNodeData, UINodeData } from "@/shared/types/node";

const inputNode = (id: string, data: Partial<InputNodeData>, parentId?: string): Node<TreegeNodeData> => ({
  data: data as InputNodeData,
  id,
  parentId,
  position: { x: 0, y: 0 },
  type: "input",
});

const uiNode = (id: string, parentId?: string): Node<TreegeNodeData> => ({
  data: { type: "title" } as UINodeData,
  id,
  parentId,
  position: { x: 0, y: 0 },
  type: "ui",
});

const step = (nodes: Node<TreegeNodeData>[]): FlowStep => ({ groupId: "group-1", nodes });

describe("Step Utils", () => {
  describe("computeSteps", () => {
    it("should partition nodes into steps by parentId", () => {
      const steps = computeSteps([
        inputNode("input-1", { type: "text" }, "group-1"),
        inputNode("input-2", { type: "text" }, "group-1"),
        inputNode("input-3", { type: "text" }, "group-2"),
      ]);

      expect(steps).toHaveLength(2);
      expect(steps[0].groupId).toBe("group-1");
      expect(steps[0].nodes).toHaveLength(2);
      expect(steps[1].groupId).toBe("group-2");
    });
  });

  describe("getAutoAdvanceNodeId", () => {
    it("should return the node id for a step with a single radio input", () => {
      expect(getAutoAdvanceNodeId(step([inputNode("radio-1", { type: "radio" })]))).toBe("radio-1");
    });

    it("should return the node id for a step with a single non-multiple select input", () => {
      expect(getAutoAdvanceNodeId(step([inputNode("select-1", { type: "select" })]))).toBe("select-1");
    });

    it("should return the node id for a step with a single autocomplete input", () => {
      expect(getAutoAdvanceNodeId(step([inputNode("autocomplete-1", { type: "autocomplete" })]))).toBe("autocomplete-1");
    });

    it("should return undefined for a multiple select", () => {
      expect(getAutoAdvanceNodeId(step([inputNode("select-1", { multiple: true, type: "select" })]))).toBeUndefined();
    });

    it("should return undefined for non single-choice input types", () => {
      expect(getAutoAdvanceNodeId(step([inputNode("text-1", { type: "text" })]))).toBeUndefined();
      expect(getAutoAdvanceNodeId(step([inputNode("checkbox-1", { type: "checkbox" })]))).toBeUndefined();
      expect(getAutoAdvanceNodeId(step([inputNode("switch-1", { type: "switch" })]))).toBeUndefined();
    });

    it("should return the node id for an http input mapped to options", () => {
      const node = inputNode("http-1", { httpConfig: { responseMapping: { labelField: "name", valueField: "id" } }, type: "http" });

      expect(getAutoAdvanceNodeId(step([node]))).toBe("http-1");
    });

    it("should return undefined for an http input without responseMapping (programmatic value)", () => {
      expect(getAutoAdvanceNodeId(step([inputNode("http-1", { httpConfig: { url: "https://api.test" }, type: "http" })]))).toBeUndefined();
      expect(getAutoAdvanceNodeId(step([inputNode("http-1", { type: "http" })]))).toBeUndefined();
    });

    it("should return undefined when the input has no type", () => {
      expect(getAutoAdvanceNodeId(step([inputNode("input-1", {})]))).toBeUndefined();
    });

    it("should return undefined when the step has several interactive inputs", () => {
      expect(getAutoAdvanceNodeId(step([inputNode("radio-1", { type: "radio" }), inputNode("text-1", { type: "text" })]))).toBeUndefined();
    });

    it("should ignore UI nodes when counting interactive fields", () => {
      expect(getAutoAdvanceNodeId(step([uiNode("title-1"), inputNode("radio-1", { type: "radio" })]))).toBe("radio-1");
    });

    it("should ignore hidden and submit inputs when counting interactive fields", () => {
      const nodes = [
        inputNode("hidden-1", { type: "hidden" }),
        inputNode("radio-1", { type: "radio" }),
        inputNode("submit-1", { type: "submit" }),
      ];

      expect(getAutoAdvanceNodeId(step(nodes))).toBe("radio-1");
    });

    it("should return undefined for a step with no interactive input", () => {
      expect(getAutoAdvanceNodeId(step([uiNode("title-1"), inputNode("hidden-1", { type: "hidden" })]))).toBeUndefined();
    });

    it("should return undefined without a step", () => {
      expect(getAutoAdvanceNodeId(undefined)).toBeUndefined();
    });
  });
});
