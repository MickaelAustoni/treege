import { act, render, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TreegeEditorRuntimeProvider } from "@/editor/context/TreegeEditorRuntimeProvider";
import { useTransientState } from "@/editor/hooks/useTransientState";

interface OptionEditor {
  draft: string;
  open: boolean;
}

const CLOSED: OptionEditor = { draft: "", open: false };

type Handle = { value: OptionEditor; setValue: (next: OptionEditor) => void };

/** Reports the hook's current value and setter through `handles`, under `handleKey`. */
const Probe = ({ storeKey, handleKey, handles }: { storeKey: string; handleKey: string; handles: Map<string, Handle> }) => {
  const [value, setValue] = useTransientState(storeKey, CLOSED);
  handles.set(handleKey, { setValue, value });
  return null;
};

/**
 * One editor runtime whose probes can be unmounted and mounted again — what a
 * card scrolling out of and back into the viewport of a large flow does.
 */
const Editor = ({ probes, handles }: { probes: Array<{ storeKey: string; handleKey: string }>; handles: Map<string, Handle> }) => (
  <TreegeEditorRuntimeProvider value={{ language: "en", setLanguage: () => {} }}>
    {probes.map((probe) => (
      <Probe key={probe.handleKey} storeKey={probe.storeKey} handleKey={probe.handleKey} handles={handles} />
    ))}
  </TreegeEditorRuntimeProvider>
);

describe("useTransientState", () => {
  it("starts from `initial` and updates like useState", () => {
    const { result } = renderHook(() => useTransientState("popover:a:open", false));

    expect(result.current[0]).toBe(false);
    act(() => result.current[1](true));
    expect(result.current[0]).toBe(true);
    act(() => result.current[1](false));
  });

  it("restores the last value when the component is mounted again under the same key", () => {
    const handles = new Map<string, Handle>();
    const probe = { handleKey: "first", storeKey: "option-editor:a" };
    const { rerender } = render(<Editor probes={[probe]} handles={handles} />);

    act(() => handles.get("first")?.setValue({ draft: "Hello", open: true }));
    rerender(<Editor probes={[]} handles={handles} />);
    rerender(<Editor probes={[{ ...probe, handleKey: "second" }]} handles={handles} />);

    expect(handles.get("second")?.value).toEqual({ draft: "Hello", open: true });
  });

  it("forgets a value set back to `initial`, and keeps keys apart", () => {
    const handles = new Map<string, Handle>();
    const a = { handleKey: "a", storeKey: "option-editor:a" };
    const b = { handleKey: "b", storeKey: "option-editor:b" };
    const { rerender } = render(<Editor probes={[a, b]} handles={handles} />);

    act(() => handles.get("a")?.setValue({ draft: "A", open: true }));
    act(() => handles.get("b")?.setValue({ draft: "B", open: true }));
    act(() => handles.get("a")?.setValue(CLOSED));
    rerender(<Editor probes={[]} handles={handles} />);
    rerender(
      <Editor
        probes={[
          { ...a, handleKey: "a2" },
          { ...b, handleKey: "b2" },
        ]}
        handles={handles}
      />,
    );

    expect(handles.get("a2")?.value).toBe(CLOSED);
    expect(handles.get("b2")?.value).toEqual({ draft: "B", open: true });
  });

  it("does not leak values between two editors", () => {
    const handles = new Map<string, Handle>();
    const probe = { handleKey: "first", storeKey: "option-editor:a" };
    const first = render(<Editor probes={[probe]} handles={handles} />);
    act(() => handles.get("first")?.setValue({ draft: "Hello", open: true }));
    first.unmount();

    render(<Editor probes={[{ ...probe, handleKey: "other-editor" }]} handles={handles} />);

    expect(handles.get("other-editor")?.value).toBe(CLOSED);
  });
});
