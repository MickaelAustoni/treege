import { useStore } from "@xyflow/react";
import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useTreegeEditorRuntime } from "@/editor/context/TreegeEditorRuntimeProvider";
import { collectAncestorIds, isAncestor } from "@/editor/utils/edge";
import { InputNodeData } from "@/shared/types/node";
import { getTranslatedText } from "@/shared/utils/translations";

/**
 * Display label of an Input field, resolved in the editor's current language
 * (falls back to English, then any available translation), then its `name`,
 * then its node id — so it is never empty.
 */
const resolveFieldLabel = (data: InputNodeData, nodeId: string, language: string): string =>
  getTranslatedText(data.label, language) || data.name || nodeId;

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
 * their `data` references only. Those selectors still compare one array per
 * ancestor on every store update, so this hook belongs in forms that are
 * mounted on demand (node sheet, edge popover) — a read-only summary should
 * use `useAncestorFieldLabel` instead.
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

        return [
          { label: resolveFieldLabel(data, nodeId, language), name: data.name, nodeId, options: data.options, type: data.type || "text" },
        ];
      }),
    [ancestorIds, ancestorData, language],
  );
};

/**
 * Display label of one field of `currentNodeId`'s ancestor pool — exactly the
 * `label` that `useAvailableParentFields` would list for `fieldId`, or
 * `undefined` when `fieldId` is not an Input ancestor (or is not given).
 *
 * Meant for read-only summaries that name a single field, such as the label
 * button of a conditional edge: the store subscription is a string selector
 * backed by memoized lookups, instead of the full ancestor list, which matters
 * when hundreds of edges are mounted at once.
 */
export const useAncestorFieldLabel = (currentNodeId: string | undefined, fieldId: string | undefined): string | undefined => {
  const { language } = useTreegeEditorRuntime();

  return useStore((state) => {
    if (!(currentNodeId && fieldId && isAncestor(state.edges, currentNodeId, fieldId))) {
      return undefined;
    }

    const node = state.nodeLookup.get(fieldId);

    if (node?.type !== "input") {
      return undefined;
    }

    const data = node.data as InputNodeData | undefined;

    return data ? resolveFieldLabel(data, fieldId, language) : undefined;
  });
};

export default useAvailableParentFields;
