import { Node } from "@xyflow/react";
import { describe, expect, it } from "vitest";
import { computeInitialStepIndex, computeSteps, FlowStep, getAutoAdvanceNodeId } from "@/renderer/utils/step";
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

  describe("computeInitialStepIndex", () => {
    const s1 = step([inputNode("n1", { name: "a", type: "text" })]);
    const s2 = step([inputNode("n2", { name: "b", type: "text" })]);
    const s3 = step([inputNode("n3", { name: "c", type: "text" })]);

    it("should open on step 0 when nothing is pre-filled", () => {
      expect(computeInitialStepIndex([s1, s2, s3], {})).toBe(0);
    });

    it("should open on the first step not entirely pre-filled", () => {
      expect(computeInitialStepIndex([s1, s2, s3], { a: "x", b: "y" })).toBe(2);
    });

    it("should open on the last step when every step is filled", () => {
      expect(computeInitialStepIndex([s1, s2, s3], { a: "x", b: "y", c: "z" })).toBe(2);
    });

    it("should stop on a step with any empty field, even when earlier fields are filled", () => {
      const twoFieldStep = step([inputNode("n2a", { name: "b", type: "text" }), inputNode("n2b", { name: "b2", type: "text" })]);

      expect(computeInitialStepIndex([s1, twoFieldStep, s3], { a: "x", b: "y" })).toBe(1);
    });

    it("should ignore hidden/submit inputs when deciding a step is filled", () => {
      const stepWithHidden = step([inputNode("n1", { name: "a", type: "text" }), inputNode("h1", { name: "h", type: "hidden" })]);

      expect(computeInitialStepIndex([stepWithHidden, s2], { a: "x" })).toBe(1);
    });

    it("should never skip a field-less (UI-only) step", () => {
      expect(computeInitialStepIndex([step([uiNode("u1")]), s2], { b: "y" })).toBe(0);
    });

    it("should return 0 when there are no steps", () => {
      expect(computeInitialStepIndex([], { a: "x" })).toBe(0);
    });
  });
});
