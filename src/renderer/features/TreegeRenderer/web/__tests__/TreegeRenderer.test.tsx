import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Edge, Node } from "@xyflow/react";
import { describe, expect, it, vi } from "vitest";
import TreegeRenderer from "@/renderer/features/TreegeRenderer/web/TreegeRenderer";
import { ConditionalEdgeData } from "@/shared/types/edge";
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

const conditionalEdge = (source: string, target: string, value: string): Edge<ConditionalEdgeData> => ({
  data: { conditions: [{ field: source, operator: "===", value }] },
  id: `${source}->${target}`,
  source,
  target,
});

/**
 * A branching flow whose first step is a "boundary" step: until the radio is
 * answered, no conditional edge can be followed, so the first step is the last
 * *visible* one while the path is NOT complete (endOfPathReached is false).
 */
const branchingFlow: Flow = {
  edges: [conditionalEdge("radio-1", "text-a", "a"), conditionalEdge("radio-1", "text-b", "b")],
  id: "branching-flow",
  nodes: [
    groupNode("group-1", "Choice"),
    groupNode("group-2", "Branch A"),
    groupNode("group-3", "Branch B"),
    inputNode(
      "radio-1",
      {
        name: "choice",
        options: [
          { label: { en: "Option A" }, value: "a" },
          { label: { en: "Option B" }, value: "b" },
        ],
        type: "radio",
        variant: "default",
      },
      "group-1",
    ),
    inputNode("text-a", { name: "detailsA", type: "text" }, "group-2"),
    inputNode("text-b", { name: "detailsB", type: "text" }, "group-3"),
  ],
};

/**
 * A linear single-step flow whose only step is genuinely final.
 */
const linearFlow: Flow = {
  edges: [],
  id: "linear-flow",
  nodes: [groupNode("group-1", "Step 1"), inputNode("text-1", { name: "details", type: "text" }, "group-1")],
};

describe("TreegeRenderer (web) — Continue vs Submit", () => {
  it("should show a disabled Continue button — not Submit — on a boundary step", () => {
    render(<TreegeRenderer flow={branchingFlow} onSubmit={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Submit" })).not.toBeInTheDocument();
  });

  it("should not submit an incomplete flow when the form is submitted (Enter) on a boundary step", () => {
    const onSubmit = vi.fn();
    const { container } = render(<TreegeRenderer flow={branchingFlow} onSubmit={onSubmit} />);

    fireEvent.submit(container.querySelector("form") as HTMLFormElement);

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("should show Submit and submit on a genuinely final step", async () => {
    const onSubmit = vi.fn();
    const { container } = render(<TreegeRenderer flow={linearFlow} onSubmit={onSubmit} />);

    expect(screen.getByRole("button", { name: "Submit" })).toBeEnabled();
    expect(screen.queryByRole("button", { name: "Continue" })).not.toBeInTheDocument();

    fireEvent.submit(container.querySelector("form") as HTMLFormElement);

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
  });

  it("should remove the step section border and padding with disableSectionBorder", () => {
    const { container } = render(<TreegeRenderer flow={linearFlow} onSubmit={vi.fn()} disableSectionBorder />);

    const section = container.querySelector("section");
    expect(section).not.toBeNull();
    const classes = (section as HTMLElement).className.split(" ");
    // tailwind-merge drops the conflicting defaults `tg:border` and `tg:p-4`
    // in favor of `tg:border-0` and `tg:p-0`; layout classes are kept.
    expect(classes).toContain("tg:border-0");
    expect(classes).not.toContain("tg:border");
    expect(classes).toContain("tg:p-0");
    expect(classes).not.toContain("tg:p-4");
  });

  it("should keep the default step section border without disableSectionBorder", () => {
    const { container } = render(<TreegeRenderer flow={linearFlow} onSubmit={vi.fn()} />);

    const classes = (container.querySelector("section") as HTMLElement).className.split(" ");
    expect(classes).toContain("tg:border");
    expect(classes).toContain("tg:rounded-lg");
    // "Powered by Treege" always carries a 16px horizontal padding to stay
    // aligned with the step content.
    expect(screen.getByText("Powered by Treege").className.split(" ")).toContain("tg:px-4");
  });

  it("should apply the style prop to the renderer's root container", () => {
    const { container } = render(<TreegeRenderer flow={linearFlow} onSubmit={vi.fn()} style={{ maxWidth: "480px" }} />);

    const root = container.querySelector(".treege-renderer") as HTMLElement;
    expect(root.style.maxWidth).toBe("480px");
  });

  it("should enable Continue once the branch is chosen, then show Submit on the revealed final step", () => {
    render(<TreegeRenderer flow={branchingFlow} onSubmit={vi.fn()} />);

    fireEvent.click(screen.getByRole("radio", { name: "Option A" }));

    const continueButton = screen.getByRole("button", { name: "Continue" });
    expect(continueButton).toBeEnabled();

    fireEvent.click(continueButton);

    expect(screen.getByRole("button", { name: "Submit" })).toBeInTheDocument();
  });
});
