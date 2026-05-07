import { Node } from "@xyflow/react";
import { TreegeNodeData } from "@/shared/types/node";
import { isFlowNode, isGroupNode } from "@/shared/utils/nodeTypeGuards";

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
 * Group / flow nodes themselves are skipped — they're metadata only.
 */
export const computeSteps = (visibleNodes: Node<TreegeNodeData>[]): FlowStep[] =>
  visibleNodes
    .filter((node) => !(isGroupNode(node) || isFlowNode(node)))
    .reduce<FlowStep[]>((steps, node) => {
      const groupId = node.parentId ?? null;
      const last = steps.at(-1);
      return last && last.groupId === groupId
        ? [...steps.slice(0, -1), { ...last, nodes: [...last.nodes, node] }]
        : [...steps, { groupId, nodes: [node] }];
    }, []);
