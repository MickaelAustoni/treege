import { OnBeforeDelete, useReactFlow } from "@xyflow/react";
import { useCallback, useEffect } from "react";
import useHistoryStore from "@/editor/hooks/useHistoryStore";

type UseUndoRedoOptions = {
  enableShortcuts?: boolean;
};

/**
 * Snapshot-based undo/redo for the ReactFlow editor.
 *
 * Maintains `past` / `future` stacks of `{ nodes, edges }` snapshots in `useHistoryStore`.
 * Callers must invoke `takeSnapshot()` before any mutation they want to be undoable
 * (drag start, node/edge creation, deletion, type change, …); the hook itself does
 * not observe ReactFlow state changes.
 *
 * @param enableShortcuts - When true, binds Cmd/Ctrl+Z (undo) and Cmd/Ctrl+Shift+Z /
 *   Cmd/Ctrl+Y (redo) to the window. Should be enabled in a single root component
 *   (e.g. the editor) to avoid duplicate listeners.
 *
 * @returns
 * - `takeSnapshot`: pushes the current flow onto `past` and clears `future`.
 * - `onBeforeDelete`: adapter typed for ReactFlow's `onBeforeDelete` prop.
 * - `undo` / `redo`: restore the previous / next snapshot.
 * - `canUndo` / `canRedo`: booleans driven by stack length, suitable for disabling UI buttons.
 */
const useUndoRedo = ({ enableShortcuts = false }: UseUndoRedoOptions = {}) => {
  const { getNodes, getEdges, setNodes, setEdges } = useReactFlow();
  const canUndo = useHistoryStore((s) => s.past.length > 0);
  const canRedo = useHistoryStore((s) => s.future.length > 0);

  const takeSnapshot = useCallback(() => {
    const { pushPast, clearFuture } = useHistoryStore.getState();
    pushPast({ edges: getEdges(), nodes: getNodes() });
    clearFuture();
  }, [getNodes, getEdges]);

  const onBeforeDelete: OnBeforeDelete = useCallback(() => {
    takeSnapshot();
    return Promise.resolve(true);
  }, [takeSnapshot]);

  const undo = useCallback(() => {
    const { popPast, pushFuture } = useHistoryStore.getState();
    const previous = popPast();
    if (!previous) {
      return;
    }
    pushFuture({ edges: getEdges(), nodes: getNodes() });
    setNodes(previous.nodes);
    setEdges(previous.edges);
  }, [getNodes, getEdges, setNodes, setEdges]);

  const redo = useCallback(() => {
    const { popFuture, pushPast } = useHistoryStore.getState();
    const next = popFuture();
    if (!next) {
      return;
    }
    pushPast({ edges: getEdges(), nodes: getNodes() });
    setNodes(next.nodes);
    setEdges(next.edges);
  }, [getNodes, getEdges, setNodes, setEdges]);

  /**
   *  Binds Cmd/Ctrl+Z (undo) and Cmd/Ctrl+Shift+Z / Cmd/Ctrl+Y (redo) at the window level when
   *  `enableShortcuts` is true. Skips when focus is on an editable field so the browser's native
   *  input undo keeps working.
   */
  useEffect(() => {
    if (!enableShortcuts) {
      return;
    }

    const handler = (event: KeyboardEvent) => {
      // Don't intercept while the user is typing in a field — let the browser handle native undo there.
      const target = event.target as HTMLElement | null;
      const isEditable =
        target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || (target?.isContentEditable ?? false);
      if (isEditable) {
        return;
      }

      const meta = event.metaKey || event.ctrlKey;
      if (!meta) {
        return;
      }

      const key = event.key.toLowerCase();
      if (key === "z" && !event.shiftKey) {
        event.preventDefault();
        undo();
        return;
      }
      if ((key === "z" && event.shiftKey) || key === "y") {
        event.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [enableShortcuts, undo, redo]);

  return {
    canRedo,
    canUndo,
    onBeforeDelete,
    redo,
    takeSnapshot,
    undo,
  };
};

export default useUndoRedo;
