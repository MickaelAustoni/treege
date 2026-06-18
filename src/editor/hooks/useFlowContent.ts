import { useStore } from "@xyflow/react";
import { NODE_TYPE } from "@/shared/constants/node";

/**
 * Content flags for the current flow, used to gate editor actions.
 *
 * A lone `group` node is just a container — it carries no form value, so it
 * must not make the flow "saveable". `hasInputNodes` therefore counts only
 * `input` nodes: that is what Save and Export JSON should gate on.
 *
 * `isEmpty` is broader (no nodes and no edges at all) and is meant for the
 * Clear action, which should stay enabled as long as there is anything on the
 * canvas to wipe — including an orphan group.
 */
export const useFlowContent = () => {
  const hasInputNodes = useStore((state) => state.nodes.some((node) => node.type === NODE_TYPE.input));
  const isEmpty = useStore((state) => state.nodes.length === 0 && state.edges.length === 0);

  return {
    hasInputNodes,
    isEmpty,
  };
};

export default useFlowContent;
