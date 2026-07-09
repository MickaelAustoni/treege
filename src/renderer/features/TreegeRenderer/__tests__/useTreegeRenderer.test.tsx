import { act, renderHook } from "@testing-library/react";
import { Edge, Node } from "@xyflow/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTreegeRenderer } from "@/renderer/features/TreegeRenderer/useTreegeRenderer";
import { Flow, GroupNodeData, InputNodeData } from "@/shared/types/node";

const groupNode = (id: string, label: string): Node => ({
  data: { label: { en: label } } as GroupNodeData,
  id,
  position: { x: 0, y: 0 },
  type: "group",
});

const inputNode = (id: string, data: Partial<InputNodeData>, parentId: string): Node => ({
  data: data as InputNodeData,
  id,
  parentId,
  position: { x: 0, y: 0 },
  type: "input",
});

const edge = (source: string, target: string): Edge => ({ id: `${source}->${target}`, source, target });

const conditionalEdge = (source: string, target: string, field: string, value: string): Edge => ({
  data: { conditions: [{ field, operator: "===", value }] },
  id: `${source}->${target}`,
  source,
  target,
});

/**
 * Three steps (one group each), every step holding a single radio input —
 * each step qualifies for auto-advance except the last one.
 */
const singleChoiceFlow: Flow = {
  edges: [edge("radio-1", "radio-2"), edge("radio-2", "radio-3")],
  id: "flow-1",
  nodes: [
    groupNode("group-1", "Step 1"),
    groupNode("group-2", "Step 2"),
    groupNode("group-3", "Step 3"),
    inputNode("radio-1", { name: "choice1", type: "radio" }, "group-1"),
    inputNode("radio-2", { name: "choice2", type: "radio" }, "group-2"),
    inputNode("radio-3", { name: "choice3", type: "radio" }, "group-3"),
  ],
};

/**
 * Branching boundary step: the first step's radio decides which branch (and
 * thus which later steps) become visible. Before a selection, step 1 is the
 * only visible step — it must still auto-advance once the selection reveals
 * the chosen branch.
 */
const branchingFlow: Flow = {
  edges: [conditionalEdge("radio-1", "text-a", "radio-1", "a"), conditionalEdge("radio-1", "text-b", "radio-1", "b")],
  id: "flow-3",
  nodes: [
    groupNode("group-1", "Step 1"),
    groupNode("group-a", "Branch A"),
    groupNode("group-b", "Branch B"),
    inputNode("radio-1", { name: "choice1", type: "radio" }, "group-1"),
    inputNode("text-a", { name: "detailsA", type: "text" }, "group-a"),
    inputNode("text-b", { name: "detailsB", type: "text" }, "group-b"),
  ],
};

/**
 * First step holds a radio AND a text input — not eligible for auto-advance.
 */
const multiFieldFlow: Flow = {
  edges: [edge("radio-1", "text-1"), edge("text-1", "radio-2")],
  id: "flow-2",
  nodes: [
    groupNode("group-1", "Step 1"),
    groupNode("group-2", "Step 2"),
    inputNode("radio-1", { name: "choice1", type: "radio" }, "group-1"),
    inputNode("text-1", { name: "details", type: "text" }, "group-1"),
    inputNode("radio-2", { name: "choice2", type: "radio" }, "group-2"),
  ],
};

describe("useTreegeRenderer auto-advance", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should advance to the next step shortly after selecting the step's only single-choice field", () => {
    const { result } = renderHook(() => useTreegeRenderer({ flow: singleChoiceFlow }));

    expect(result.current.currentStepIndex).toBe(0);

    act(() => {
      result.current.setFieldValue("radio-1", "a");
    });

    // The selected state must render before the step moves.
    expect(result.current.currentStepIndex).toBe(0);

    act(() => {
      vi.advanceTimersByTime(179);
    });
    expect(result.current.currentStepIndex).toBe(0);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.currentStepIndex).toBe(1);
  });

  it("should auto-advance a branching boundary step once the selection reveals the next steps", () => {
    const { result } = renderHook(() => useTreegeRenderer({ flow: branchingFlow }));

    // Before any selection, the boundary step is the only visible step.
    expect(result.current.isLastStep).toBe(true);

    act(() => {
      result.current.setFieldValue("radio-1", "a");
    });
    act(() => {
      vi.advanceTimersByTime(180);
    });

    expect(result.current.currentStepIndex).toBe(1);
    expect(result.current.stepLabel).toBe("Branch A");
  });

  it("should never auto-advance on the last step", () => {
    const { result } = renderHook(() => useTreegeRenderer({ flow: singleChoiceFlow }));

    act(() => {
      result.current.goToNextStep();
    });
    act(() => {
      result.current.goToNextStep();
    });
    expect(result.current.isLastStep).toBe(true);

    act(() => {
      result.current.setFieldValue("radio-3", "a");
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.currentStepIndex).toBe(2);
  });

  it("should not auto-advance on mount when initial values pre-fill the field", () => {
    const { result } = renderHook(() => useTreegeRenderer({ flow: singleChoiceFlow, initialValues: { choice1: "a" } }));

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.currentStepIndex).toBe(0);
  });

  it("should not auto-advance when navigating back to an already answered step", () => {
    const { result } = renderHook(() => useTreegeRenderer({ flow: singleChoiceFlow }));

    act(() => {
      result.current.setFieldValue("radio-1", "a");
    });
    act(() => {
      vi.advanceTimersByTime(180);
    });
    expect(result.current.currentStepIndex).toBe(1);

    act(() => {
      result.current.goToPreviousStep();
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.currentStepIndex).toBe(0);
  });

  it("should cancel a pending advance when the selection is cleared", () => {
    const { result } = renderHook(() => useTreegeRenderer({ flow: singleChoiceFlow }));

    act(() => {
      result.current.setFieldValue("radio-1", "a");
    });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    act(() => {
      result.current.setFieldValue("radio-1", "");
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.currentStepIndex).toBe(0);
  });

  it("should restart the delay when the selection changes before it fires", () => {
    const { result } = renderHook(() => useTreegeRenderer({ flow: singleChoiceFlow }));

    act(() => {
      result.current.setFieldValue("radio-1", "a");
    });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    act(() => {
      result.current.setFieldValue("radio-1", "b");
    });

    // 100ms into the original delay + 100ms into the restarted one: not yet.
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current.currentStepIndex).toBe(0);

    act(() => {
      vi.advanceTimersByTime(80);
    });
    expect(result.current.currentStepIndex).toBe(1);
  });

  it("should not skip a step when the user advances manually before the timer fires", () => {
    const { result } = renderHook(() => useTreegeRenderer({ flow: singleChoiceFlow }));

    act(() => {
      result.current.setFieldValue("radio-1", "a");
    });
    act(() => {
      result.current.goToNextStep();
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.currentStepIndex).toBe(1);
  });

  it("should not auto-advance a step containing several interactive fields", () => {
    const { result } = renderHook(() => useTreegeRenderer({ flow: multiFieldFlow }));

    act(() => {
      result.current.setFieldValue("radio-1", "a");
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.currentStepIndex).toBe(0);
  });
});
