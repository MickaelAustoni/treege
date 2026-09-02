import { useStore } from "@xyflow/react";
import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useTreegeEditorRuntime } from "@/editor/context/TreegeEditorRuntimeProvider";
import { collectAncestorIds } from "@/editor/utils/edge";
import { InputNodeData } from "@/shared/types/node";
import { getTranslatedText } from "@/shared/utils/translations";

/**
 * Returns every Input ancestor reachable from the given node, traversing
 * incoming edges depth-first (see `collectAncestorIds`). The result is the
 * pool of fields that a downstream node — typically a conditional edge —
 * may reference: each entry exposes the ancestor's `nodeId`, resolved
 * display `label`, raw `name`, input `type`, and static `options` (when
 * defined), so consumers can render a Select/Input bound to the right
 * source value.
 *
 * Non-Input ancestors (UI nodes, flow nodes, groups) are excluded because
 * they cannot supply a runtime value to evaluate a condition against.
 *
 * Subscribes to the store through shallow selectors on the ancestor ids and
 * their `data` references only: a flow holds one instance of this hook per
 * conditional edge, so re-rendering them all on every node measurement or
 * drag would make large flows unusable.
 */
const useAvailableParentFields = (currentNodeId?: string) => {
  const { language } = useTreegeEditorRuntime();

  const ancestorIds = useStore(
    useShallow((state) =>
      currentNodeId ? collectAncestorIds(state.edges, currentNodeId).filter((id) => state.nodeLookup.get(id)?.type === "input") : [],
    ),
  );
  const ancestorData = useStore(
    useShallow((state) => ancestorIds.map((id) => state.nodeLookup.get(id)?.data as InputNodeData | undefined)),
  );

  return useMemo(
    () =>
      ancestorIds.flatMap((nodeId, index) => {
        const data = ancestorData[index];

        if (!data) {
          return [];
        }

        // Resolve the label in the editor's current language (falls back to
        // English, then any available translation) instead of always `en`.
        const label = getTranslatedText(data.label, language);

        return [{ label: label || data.name || nodeId, name: data.name, nodeId, options: data.options, type: data.type || "text" }];
      }),
    [ancestorIds, ancestorData, language],
  );
};

export default useAvailableParentFields;
