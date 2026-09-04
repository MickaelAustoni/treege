import { useCallback, useState } from "react";
import { useTreegeEditorRuntime } from "@/editor/context/TreegeEditorRuntimeProvider";

/**
 * `useState` whose value outlives its component. Large flows only render the
 * cards inside the viewport, so a card scrolling out and back in is remounted
 * — with plain `useState` it would come back with its popover closed and its
 * drafts wiped. The value is kept in the editor runtime under `key` and is
 * forgotten again once set back to `initial` (compared by identity: pass a
 * module-level constant as `initial` for object states).
 */
export const useTransientState = <T>(key: string, initial: T): [T, (next: T) => void] => {
  const { transientState } = useTreegeEditorRuntime();
  const [value, setValue] = useState<T>(() => (transientState.has(key) ? (transientState.get(key) as T) : initial));

  const update = useCallback(
    (next: T) => {
      if (Object.is(next, initial)) {
        transientState.delete(key);
      } else {
        transientState.set(key, next);
      }
      setValue(next);
    },
    [key, initial, transientState],
  );

  return [value, update];
};

export default useTransientState;
