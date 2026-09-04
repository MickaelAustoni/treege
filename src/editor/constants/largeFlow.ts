/**
 * From this many nodes on, the editor switches to its large-flow strategies:
 * the initial flow is fed to the canvas in batches (`ProgressiveMount`) and
 * only the nodes and edges inside the viewport are rendered
 * (`onlyRenderVisibleElements`). Below it, every node stays mounted.
 */
export const LARGE_FLOW_NODE_COUNT = 150;
