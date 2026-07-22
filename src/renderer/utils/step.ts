import { Node } from "@xyflow/react";
import { FormValues } from "@/renderer/types/renderer";
import { isFieldEmpty } from "@/renderer/utils/form";
import { getInputNodes, resolveNodeKey } from "@/renderer/utils/node";
import { INPUT_TYPE } from "@/shared/constants/inputType";
import { InputNodeData, TreegeNodeData } from "@/shared/types/node";
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
 * The step the renderer should open on given the consumer-provided `initialValues`: the first step not
 * already ENTIRELY pre-filled by them. When `initialValues` pre-fill whole steps (e.g. an AI assistant
 * seeding several steps at once), the fully-filled leading steps are skipped so the form opens where
 * work remains (steps 1-2 fully pre-filled → open step 3). Falls back to the last step when every step
 * is filled, and to 0 when there are no steps.
 *
 * A step counts as filled only when it HAS fillable fields and every one of them is non-empty in
 * `initialValues` — so with no pre-fill the form opens on step 0 as before, and a field-less
 * (informational) step is never silently skipped. Hidden/submit inputs carry no user answer and are ignored.
 *
 * IMPORTANT: this reads the RAW `initialValues` the consumer passed — NOT the renderer's internal
 * `formValues`, which also carries node `defaultValue`s. Basing it on defaults would make a pristine form
 * (no pre-fill) skip a step whose fields merely have defaults. `initialValues` may be keyed by `node.id`
 * or by the resolved field name (both accepted, like buildInitialFormValues), so each field is looked up by both.
 */
export const computeInitialStepIndex = (steps: FlowStep[], initialValues: FormValues): number => {
  if (steps.length === 0) {
    return 0;
  }

  const isFieldPrefilled = (node: Node<InputNodeData>): boolean => {
    const raw = initialValues[node.id] ?? initialValues[resolveNodeKey(node)];
    return !isFieldEmpty(raw);
  };

  const isStepFullyPrefilled = (step: FlowStep): boolean => {
    const fields = getInputNodes(step.nodes).filter((node) => node.data.type !== INPUT_TYPE.hidden && node.data.type !== INPUT_TYPE.submit);

    return fields.length > 0 && fields.every(isFieldPrefilled);
  };

  const firstUnfilled = steps.findIndex((step) => !isStepFullyPrefilled(step));

  return firstUnfilled === -1 ? steps.length - 1 : firstUnfilled;
};

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
