import { useEdges, useNodes } from "@xyflow/react";
import { nanoid } from "nanoid";
import { useEffect, useRef } from "react";
import { useTreegeEditorRuntime } from "@/editor/context/TreegeEditorRuntimeProvider";
import type { Flow } from "@/shared/types/node";

type FlowChangeEmitterProps = {
  /** Called (debounced) with the current flow whenever the canvas changes. */
  onChange?: (flow: Flow) => void;
  /** Debounce window in ms. @default 150 */
  debounceMs?: number;
};

/**
 * Emits the current flow (id + nodes + edges) through `onChange` whenever the
 * canvas changes, debounced. This is the editor's live outbound channel:
 * unlike Save (gated on having input nodes) it also reports an emptied canvas
 * after Clear, and unlike Save/Export it does NOT strip sensitive headers,
 * since live consumers (e.g. the renderer) need the real flow.
 *
 * Renders nothing — mount it inside `<ReactFlow>` alongside the canvas, like
 * `AutoLayout`.
 */
const FlowChangeEmitter = ({ onChange, debounceMs = 150 }: FlowChangeEmitterProps) => {
  const { flowId } = useTreegeEditorRuntime();
  const nodes = useNodes();
  const edges = useEdges();

  const fallbackId = useRef<string>("");
  if (!fallbackId.current) {
    fallbackId.current = nanoid();
  }

  // Keep the latest callback without re-arming the debounce when its identity
  // changes (parents often pass an inline function).
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Debounce every nodes/edges/flowId change: re-arm a timer on each update and
  // only emit once it settles for `debounceMs`. The cleanup clears the pending
  // timer, so a burst of edits (typing, dragging) collapses into a single
  // `onChange` instead of firing on every intermediate state.
  useEffect(() => {
    if (!onChangeRef.current) {
      return undefined;
    }

    const id = flowId || fallbackId.current;
    const timer = setTimeout(() => {
      onChangeRef.current?.({ edges, id, nodes });
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [nodes, edges, flowId, debounceMs]);

  return null;
};

export default FlowChangeEmitter;
