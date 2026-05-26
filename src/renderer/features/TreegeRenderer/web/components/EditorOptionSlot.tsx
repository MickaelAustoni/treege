import { createContext, PropsWithChildren, ReactNode, useContext } from "react";
import { InputOption } from "@/shared/types/node";

export type EditorOptionSlotRenderProps = {
  option: InputOption;
  index: number;
  /** Optional layout hint forwarded by the renderer (e.g. "card" for radio cards). */
  variant?: string;
};

type EditorOptionSlotRenderer = (props: EditorOptionSlotRenderProps) => ReactNode;

const EditorOptionSlotContext = createContext<EditorOptionSlotRenderer | null>(null);

/**
 * Wraps a section of the renderer tree to inject per-option editor controls
 * (e.g. inline edit / delete buttons rendered by `NodeInputPreview` on the
 * radio / checkbox options). Outside an editor context the slot is absent,
 * so the renderers stay 100% runtime-pure.
 */
export const EditorOptionSlotProvider = ({ render, children }: PropsWithChildren<{ render: EditorOptionSlotRenderer }>) => (
  <EditorOptionSlotContext.Provider value={render}>{children}</EditorOptionSlotContext.Provider>
);

/**
 * Placed by option-based renderers next to each option's row. When no
 * provider is mounted (runtime), returns `null` — the renderer pays no cost.
 * When mounted (editor preview), the provider's render function paints the
 * inline overlay (value + actions).
 */
export const EditorOptionSlot = (props: EditorOptionSlotRenderProps) => {
  const render = useContext(EditorOptionSlotContext);
  if (!render) {
    return null;
  }
  return <>{render(props)}</>;
};
