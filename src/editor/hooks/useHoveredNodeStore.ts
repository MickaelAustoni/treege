import { create } from "zustand";

type HoveredNodeStore = {
  hoveredNodeId: string | null;
  setHoveredNodeId: (id: string | null) => void;
};

/**
 * Lightweight Zustand store that tracks which node the pointer is currently
 * over. Used by `BottomHandleDropdown` to keep a predecessor's "between" affordances
 * (insert / branch) visible while the cursor sits on its stack successor — the
 * two nodes are independent ReactFlow nodes so they don't share a CSS `group`.
 */
const useHoveredNodeStore = create<HoveredNodeStore>((set) => ({
  hoveredNodeId: null,
  setHoveredNodeId: (id) => set({ hoveredNodeId: id }),
}));

export default useHoveredNodeStore;
