import type { Edge, Node } from "@xyflow/react";
import { create } from "zustand";

type Snapshot = {
  nodes: Node[];
  edges: Edge[];
};

type HistoryStore = {
  past: Snapshot[];
  future: Snapshot[];
  pushPast: (snapshot: Snapshot) => void;
  popPast: () => Snapshot | undefined;
  pushFuture: (snapshot: Snapshot) => void;
  popFuture: () => Snapshot | undefined;
  clearFuture: () => void;
  reset: () => void;
};

const MAX_HISTORY = 100;

/**
 * Zustand store backing the editor's undo/redo history.
 *
 * Holds two stacks of `{ nodes, edges }` snapshots: `past` (states to undo into) and
 * `future` (states to redo into). Both are capped at `MAX_HISTORY` to bound memory.
 *
 * Consumed exclusively by `useUndoRedo` — components should not read or mutate this
 * store directly. Call `reset()` when loading a new flow to drop stale history.
 */
const useHistoryStore = create<HistoryStore>((set, get) => ({
  clearFuture: () => set({ future: [] }),
  future: [],
  past: [],
  popFuture: () => {
    const { future } = get();
    if (future.length === 0) {
      return undefined;
    }
    const last = future[future.length - 1];
    set({ future: future.slice(0, -1) });
    return last;
  },
  popPast: () => {
    const { past } = get();
    if (past.length === 0) {
      return undefined;
    }
    const last = past[past.length - 1];
    set({ past: past.slice(0, -1) });
    return last;
  },
  pushFuture: (snapshot) =>
    set((state) => ({
      future: [...state.future, snapshot].slice(-MAX_HISTORY),
    })),
  pushPast: (snapshot) =>
    set((state) => ({
      past: [...state.past, snapshot].slice(-MAX_HISTORY),
    })),
  reset: () => set({ future: [], past: [] }),
}));

export default useHistoryStore;
