import { Node } from "@xyflow/react";
import { INPUT_TYPE } from "@/shared/constants/inputType";
import { TreegeNodeData } from "@/shared/types/node";
import { isGroupNode, isInputNode } from "@/shared/utils/nodeTypeGuards";

/**
 * A renderer step — a contiguous slice of visible nodes that share the same
 * `parentId` (group id) or no parent (orphan step).
 *
 * Steps are derived from the flow's visible nodes at render time; the editor's
 * group nodes carry only metadata (label) and are no longer rendered.
 */
export type FlowStep = {
  /**
   * Group id owning the step, or null for orphan steps (nodes without `parentId`).
   */
  groupId: string | null;
  /**
   * The actual nodes (input + ui) rendered in this step, in flow order.
   */
  nodes: Node<TreegeNodeData>[];
};

/**
 * Partition `visibleNodes` into ordered steps. A new step is started every
 * time the `parentId` of the next renderable node changes (i.e. the flow
 * crosses a group boundary, or moves between an orphan and a grouped node).
 *
 * Group nodes themselves are skipped — they're metadata only.
 */
export const computeSteps = (visibleNodes: Node<TreegeNodeData>[]): FlowStep[] =>
  visibleNodes
    .filter((node) => !isGroupNode(node))
    .reduce<FlowStep[]>((steps, node) => {
      const groupId = node.parentId ?? null;
      const last = steps.at(-1);
      return last && last.groupId === groupId
        ? [...steps.slice(0, -1), { ...last, nodes: [...last.nodes, node] }]
        : [...steps, { groupId, nodes: [node] }];
    }, []);

/**
 * Single-choice input types eligible for step auto-advance: picking an option
 * is a complete, unambiguous answer. Free-form inputs (text, number…) and
 * multi-select inputs (checkbox, `multiple` select) never auto-advance.
 * `http` is handled separately: it only qualifies when rendered as a
 * select/combobox (i.e. `httpConfig.responseMapping` is configured).
 */
const AUTO_ADVANCE_INPUT_TYPES: readonly string[] = [INPUT_TYPE.radio, INPUT_TYPE.select, INPUT_TYPE.autocomplete];

/**
 * When a step's only interactive field is a single-choice input (radio,
 * non-multiple select, autocomplete), return that node's id — selecting an
 * option can then advance the step automatically. Returns undefined when the
 * step has zero or several interactive fields, or when its single field is
 * free-form or multi-select. Hidden and submit inputs don't count as
 * interactive.
 */
export const getAutoAdvanceNodeId = (step: FlowStep | undefined): string | undefined => {
  if (!step) {
    return undefined;
  }

  const interactiveInputs = step.nodes
    .filter(isInputNode)
    .filter((node) => node.data.type !== INPUT_TYPE.hidden && node.data.type !== INPUT_TYPE.submit);

  if (interactiveInputs.length !== 1) {
    return undefined;
  }

  const [node] = interactiveInputs;
  const { httpConfig, multiple, type } = node.data;

  // An http input is a single-choice field only when its response is mapped to
  // options (select/combobox UI). Without `responseMapping` the fetch writes
  // the value programmatically through `setFieldValue`, which would trigger an
  // auto-advance with no user interaction (e.g. on a `fetchOnMount` fetch).
  if (type === INPUT_TYPE.http) {
    return httpConfig?.responseMapping ? node.id : undefined;
  }

  if (!(type && AUTO_ADVANCE_INPUT_TYPES.includes(type)) || multiple) {
    return undefined;
  }

  return node.id;
};
