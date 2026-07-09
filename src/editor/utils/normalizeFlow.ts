import { Node } from "@xyflow/react";
import { NODE_TYPE } from "@/shared/constants/node";

/**
 * Normalize nodes coming from outside the editor (the `flow` prop, a JSON
 * import, AI generation) before handing them to xyflow.
 *
 * Group nodes are metadata-only in the editor: they carry the step label and
 * drive grouping, but are never rendered (the group node type renders `null`
 * and `SelectNodeGroup` always creates them with `hidden: true`). External
 * flows may lack that flag — often with an explicit width/height — in which
 * case xyflow still mounts an invisible, interactive wrapper covering all the
 * group's children: clicking the empty space inside selects it, the selection
 * elevates it to z-index 1000, and it then swallows every pointer event meant
 * for the child nodes. Forcing `hidden: true` here makes that impossible.
 */
export const normalizeFlowNodes = <NodeType extends Node>(nodes: NodeType[]): NodeType[] =>
  nodes.map((node) => (node.type === NODE_TYPE.group && !node.hidden ? { ...node, hidden: true } : node));
