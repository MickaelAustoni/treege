import { useCallback, useState } from "react";
import useFlowActions from "@/editor/hooks/useFlowActions";
import { InputOption } from "@/shared/types/node";

/**
 * Bridges the inline option controls rendered by `NodeInputPreview` (radio /
 * checkbox) with the edit popover that lives in `NodeOptions`.
 *
 * - `onEditOption(index)` is forwarded to the preview's hover overlay; it
 *   stores the requested index in local state.
 * - `onDeleteOption(index)` patches `data.options` immediately, no popover.
 * - `editIndex` + `clearEdit` are consumed by `NodeOptions` to open / close
 *   its popover with the right entry pre-filled.
 *
 * Keeps `TreegeNode` free of the option-edit plumbing.
 */
const useOptionEditor = (nodeId: string, options: InputOption[] | undefined) => {
  const { updateNodeData } = useFlowActions();
  const [editIndex, setEditIndex] = useState<number | null>(null);

  const onEditOption = useCallback((index: number) => setEditIndex(index), []);
  const clearEdit = useCallback(() => setEditIndex(null), []);
  const onDeleteOption = useCallback(
    (index: number) => {
      const current = options ?? [];
      updateNodeData(nodeId, { options: current.filter((_, i) => i !== index) });
    },
    [nodeId, options, updateNodeData],
  );

  return { clearEdit, editIndex, onDeleteOption, onEditOption };
};

export default useOptionEditor;
