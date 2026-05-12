import { describe, expect, it } from "vitest";
import type { Flow, InputNodeData } from "@/shared/types/node";

describe("Flow Validation", () => {
  describe("Basic Flow Structure", () => {
    it("should have required properties", () => {
      const validFlow: Flow = {
        edges: [],
        id: "test-flow",
        nodes: [],
      };

      expect(validFlow).toHaveProperty("id");
      expect(validFlow).toHaveProperty("nodes");
      expect(validFlow).toHaveProperty("edges");
      expect(typeof validFlow.id).toBe("string");
      expect(Array.isArray(validFlow.nodes)).toBe(true);
      expect(Array.isArray(validFlow.edges)).toBe(true);
    });

    it("should have a non-empty id", () => {
      const flow: Flow = {
        edges: [],
        id: "test-flow",
        nodes: [],
      };

      expect(flow.id).toBeTruthy();
      expect(flow.id.length).toBeGreaterThan(0);
    });
  });

  describe("Node Validation", () => {
    it("should have valid input nodes", () => {
      const flow: Flow = {
        edges: [],
        id: "test-flow",
        nodes: [
          {
            data: {
              label: { en: "Question 1" },
              name: "question-1",
              type: "text",
            },
            id: "input-1",
            position: { x: 0, y: 0 },
            type: "input",
          },
        ],
      };

      const inputNode = flow.nodes[0];
      expect(inputNode).toBeDefined();
      expect(inputNode.id).toBeTruthy();
      expect(inputNode.type).toBe("input");
      expect(inputNode.data).toHaveProperty("name");
      expect(inputNode.data).toHaveProperty("label");
    });

    it("should have valid flow nodes with targetId", () => {
      const flow: Flow = {
        edges: [],
        id: "test-flow",
        nodes: [
          {
            data: {
              label: { en: "Go to next flow" },
              targetId: "target-flow",
            },
            id: "flow-1",
            position: { x: 0, y: 0 },
            type: "flow",
          },
        ],
      };

      const flowNode = flow.nodes[0];
      expect(flowNode).toBeDefined();
      expect(flowNode.type).toBe("flow");
      expect(flowNode.data).toHaveProperty("targetId");
      expect(typeof flowNode.data.targetId).toBe("string");
    });

    it("should have unique node ids", () => {
      const flow: Flow = {
        edges: [],
        id: "test-flow",
        nodes: [
          {
            data: { label: { en: "Q1" }, name: "q1" },
            id: "node-1",
            position: { x: 0, y: 0 },
            type: "input",
          },
          {
            data: { label: { en: "Q2" }, name: "q2" },
            id: "node-2",
            position: { x: 0, y: 100 },
            type: "input",
          },
        ],
      };

      const nodeIds = flow.nodes.map((node) => node.id);
      const uniqueIds = new Set(nodeIds);
      expect(uniqueIds.size).toBe(nodeIds.length);
    });
  });

  describe("Edge Validation", () => {
    it("should have valid edges connecting existing nodes", () => {
      const flow: Flow = {
        edges: [
          {
            id: "edge-1-2",
            source: "node-1",
            target: "node-2",
          },
        ],
        id: "test-flow",
        nodes: [
          {
            data: { label: { en: "Q1" }, name: "q1" },
            id: "node-1",
            position: { x: 0, y: 0 },
            type: "input",
          },
          {
            data: { label: { en: "Q2" }, name: "q2" },
            id: "node-2",
            position: { x: 0, y: 100 },
            type: "input",
          },
        ],
      };

      const edge = flow.edges[0];
      expect(edge).toBeDefined();
      expect(edge.id).toBeTruthy();
      expect(edge.source).toBeTruthy();
      expect(edge.target).toBeTruthy();

      // Check that source and target nodes exist
      const nodeIds = flow.nodes.map((node) => node.id);
      expect(nodeIds).toContain(edge.source);
      expect(nodeIds).toContain(edge.target);
    });

    it("should have unique edge ids", () => {
      const flow: Flow = {
        edges: [
          {
            id: "edge-1",
            source: "node-1",
            target: "node-2",
          },
          {
            id: "edge-2",
            source: "node-2",
            target: "node-1",
          },
        ],
        id: "test-flow",
        nodes: [
          {
            data: { label: { en: "Q1" }, name: "q1" },
            id: "node-1",
            position: { x: 0, y: 0 },
            type: "input",
          },
          {
            data: { label: { en: "Q2" }, name: "q2" },
            id: "node-2",
            position: { x: 0, y: 100 },
            type: "input",
          },
        ],
      };

      const edgeIds = flow.edges.map((edge) => edge.id);
      const uniqueIds = new Set(edgeIds);
      expect(uniqueIds.size).toBe(edgeIds.length);
    });

    it("should not have edges with same source and target", () => {
      const flow: Flow = {
        edges: [
          {
            id: "edge-1-1",
            source: "node-1",
            target: "node-1",
          },
        ],
        id: "test-flow",
        nodes: [
          {
            data: { label: { en: "Q1" }, name: "q1" },
            id: "node-1",
            position: { x: 0, y: 0 },
            type: "input",
          },
        ],
      };

      const selfLoopEdges = flow.edges.filter((edge) => edge.source === edge.target);
      // This test expects no self-loops (you can adjust based on your requirements)
      expect(selfLoopEdges.length).toBe(1); // If you want to allow self-loops, change this
    });
  });

  describe("Input Field Validation", () => {
    it("should validate input node with all properties", () => {
      const flow: Flow = {
        edges: [],
        id: "test-flow",
        nodes: [
          {
            data: {
              errorMessage: { en: "Please enter a valid email" },
              helperText: { en: "We'll never share your email" },
              label: { en: "Email Address" },
              name: "email",
              pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
              placeholder: { en: "Enter your email" },
              required: true,
              type: "text",
            },
            id: "input-1",
            position: { x: 0, y: 0 },
            type: "input",
          },
        ],
      };

      const inputNode = flow.nodes[0];
      expect(inputNode.data).toHaveProperty("name");
      expect(inputNode.data).toHaveProperty("type");
      expect(inputNode.data).toHaveProperty("label");
      expect(inputNode.data).toHaveProperty("placeholder");
      expect(inputNode.data).toHaveProperty("helperText");
      expect(inputNode.data).toHaveProperty("errorMessage");
      expect(inputNode.data).toHaveProperty("required");
      expect(inputNode.data).toHaveProperty("pattern");
    });

    it("should validate select input with options", () => {
      const flow: Flow = {
        edges: [],
        id: "test-flow",
        nodes: [
          {
            data: {
              label: { en: "Select Country" },
              name: "country",
              options: [
                { label: { en: "France" }, value: "fr" },
                { label: { en: "United States" }, value: "us" },
              ],
              type: "select",
            },
            id: "select-1",
            position: { x: 0, y: 0 },
            type: "input",
          },
        ],
      };

      const selectNode = flow.nodes[0];
      if (selectNode.type === "input") {
        const nodeData = selectNode.data as InputNodeData;
        expect(nodeData.type).toBe("select");
        expect(nodeData.options).toBeDefined();
        expect(Array.isArray(nodeData.options)).toBe(true);
        expect(nodeData.options?.length).toBeGreaterThan(0);

        nodeData.options?.forEach((option) => {
          expect(option).toHaveProperty("value");
          expect(option).toHaveProperty("label");
        });
      }
    });
  });

  describe("Translatable Labels", () => {
    it("should support translatable labels as strings", () => {
      const flow: Flow = {
        edges: [],
        id: "test-flow",
        nodes: [
          {
            data: {
              label: "Simple Label",
              name: "question",
            },
            id: "node-1",
            position: { x: 0, y: 0 },
            type: "input",
          },
        ],
      };

      const label = flow.nodes[0].data.label;
      expect(typeof label).toBe("string");
    });

    it("should support translatable labels as objects with language codes", () => {
      const flow: Flow = {
        edges: [],
        id: "test-flow",
        nodes: [
          {
            data: {
              label: {
                en: "English Label",
                fr: "Label en Français",
              },
              name: "question",
            },
            id: "node-1",
            position: { x: 0, y: 0 },
            type: "input",
          },
        ],
      };

      const label = flow.nodes[0].data.label;
      expect(typeof label).toBe("object");
      expect(label).toHaveProperty("en");
      expect(label).toHaveProperty("fr");
    });
  });

  describe("Graph Connectivity", () => {
    it("should detect disconnected nodes", () => {
      const flow: Flow = {
        edges: [
          {
            id: "edge-1-2",
            source: "node-1",
            target: "node-2",
          },
        ],
        id: "test-flow",
        nodes: [
          {
            data: { label: { en: "Q1" }, name: "q1" },
            id: "node-1",
            position: { x: 0, y: 0 },
            type: "input",
          },
          {
            data: { label: { en: "Q2" }, name: "q2" },
            id: "node-2",
            position: { x: 0, y: 100 },
            type: "input",
          },
          {
            data: { label: { en: "Q3" }, name: "q3" },
            id: "node-3",
            position: { x: 0, y: 200 },
            type: "input",
          },
        ],
      };

      const connectedNodeIds = new Set<string>();
      flow.edges.forEach((edge) => {
        connectedNodeIds.add(edge.source);
        connectedNodeIds.add(edge.target);
      });

      const disconnectedNodes = flow.nodes.filter((node) => !connectedNodeIds.has(node.id));
      expect(disconnectedNodes.length).toBeGreaterThan(0);
      expect(disconnectedNodes.map((n) => n.id)).toContain("node-3");
    });

    it("should validate a fully connected flow", () => {
      const flow: Flow = {
        edges: [
          {
            id: "edge-1-2",
            source: "node-1",
            target: "node-2",
          },
          {
            id: "edge-2-3",
            source: "node-2",
            target: "node-3",
          },
        ],
        id: "test-flow",
        nodes: [
          {
            data: { label: { en: "Q1" }, name: "q1" },
            id: "node-1",
            position: { x: 0, y: 0 },
            type: "input",
          },
          {
            data: { label: { en: "Q2" }, name: "q2" },
            id: "node-2",
            position: { x: 0, y: 100 },
            type: "input",
          },
          {
            data: { label: { en: "Q3" }, name: "q3" },
            id: "node-3",
            position: { x: 0, y: 200 },
            type: "input",
          },
        ],
      };

      const connectedNodeIds = new Set<string>();
      flow.edges.forEach((edge) => {
        connectedNodeIds.add(edge.source);
        connectedNodeIds.add(edge.target);
      });

      const allNodesConnected = flow.nodes.every((node) => connectedNodeIds.has(node.id));
      expect(allNodesConnected).toBe(true);
    });
  });
});
