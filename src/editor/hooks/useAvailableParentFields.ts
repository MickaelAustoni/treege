import { useEdges, useNodes } from "@xyflow/react";
import { useMemo } from "react";
import { useTreegeEditorContext } from "@/editor/context/TreegeEditorContext";
import { InputNodeData, TreegeNode } from "@/shared/types/node";
import { isInputNode } from "@/shared/utils/nodeTypeGuards";
import { getTranslatedText } from "@/shared/utils/translations";

/**
 * Returns every Input ancestor reachable from the given node, traversing
 * incoming edges depth-first. Cycle-safe (visited set). The result is the
 * pool of fields that a downstream node — typically a conditional edge —
 * may reference: each entry exposes the ancestor's `nodeId`, resolved
 * display `label`, raw `name`, input `type`, and static `options` (when
 * defined), so consumers can render a Select/Input bound to the right
 * source value.
 *
 * Non-Input ancestors (UI nodes, flow nodes, groups) are excluded because
 * they cannot supply a runtime value to evaluate a condition against.
 */
const useAvailableParentFields = (currentNodeId?: string) => {
  const nodes = useNodes() as TreegeNode[];
  const edges = useEdges();
  const { language } = useTreegeEditorContext();

  return useMemo(() => {
    if (!currentNodeId) {
      return [];
    }

    const findAncestors = (nodeId: string, visited = new Set<string>()): string[] => {
      if (visited.has(nodeId)) {
        return [];
      }

      const newVisited = new Set(visited).add(nodeId);
      const incomingEdges = edges.filter((edge) => edge.target === nodeId);

      return incomingEdges.flatMap((edge) => [edge.source, ...findAncestors(edge.source, newVisited)]);
    };

    const ancestorIds = findAncestors(currentNodeId);

    return nodes
      .filter((node) => {
        const isAncestor = ancestorIds.includes(node.id);
        return isAncestor && isInputNode(node);
      })
      .map((node) => {
        const data = node.data as InputNodeData;
        // Resolve the label in the editor's current language (falls back to
        // English, then any available translation) instead of always `en`.
        const label = getTranslatedText(data.label, language);

        return {
          label: label || data.name || node.id,
          name: data.name,
          nodeId: node.id,
          options: data.options,
          type: data.type || "text",
        };
      });
  }, [currentNodeId, nodes, edges, language]);
};

export default useAvailableParentFields;
