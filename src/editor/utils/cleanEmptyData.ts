import { Flow } from "@/shared/types/node";

/**
 * Field defaults that carry no information: when a value equals its default it
 * is dropped, since the renderer falls back to the same value when the field is
 * absent (e.g. a radio with no `variant` renders as a card — see
 * `DefaultRadioInput`, `variant !== "default"`). Keeping them only bloats the
 * exported JSON.
 */
const DEFAULT_DATA_VALUES: Record<string, unknown> = {
  variant: "card",
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Returns true for values that hold no information and shouldn't be persisted:
 * `undefined`/`null`, empty strings, empty arrays, and objects that are empty or
 * whose every entry is itself empty (e.g. an all-empty translatable label like
 * `{ en: "" }`).
 */
const isEmptyValue = (value: unknown): boolean => {
  if (value === undefined || value === null || value === "") {
    return true;
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  if (isPlainObject(value)) {
    const values = Object.values(value);
    return values.length === 0 || values.every(isEmptyValue);
  }

  return false;
};

/** True when `value` is the documented default for `key`, so storing it is redundant. */
const isRedundantDefault = (key: string, value: unknown): boolean =>
  Object.hasOwn(DEFAULT_DATA_VALUES, key) && value === DEFAULT_DATA_VALUES[key];

/** True when an entry carries no information worth persisting (empty, or a redundant default). */
const carriesNoInformation = (key: string, value: unknown): boolean => isEmptyValue(value) || isRedundantDefault(key, value);

/**
 * Returns a copy of `data` keeping only the entries that carry information:
 * everything that is neither empty (see `isEmptyValue`) nor a redundant field
 * default (see `DEFAULT_DATA_VALUES`). Meaningful falsy values like `false` and
 * `0` are kept. Used before persisting an input node's form so toggling a single
 * field doesn't flood the node — and the exported JSON — with empty defaults.
 */
export const cleanEmptyData = (data: Record<string, unknown>): Record<string, unknown> => {
  const entries = Object.entries(data);
  const informativeEntries = entries.filter(([key, value]) => !carriesNoInformation(key, value));

  return Object.fromEntries(informativeEntries);
};

/**
 * Returns a copy of the flow trimmed for export: every node's `data` is cleaned
 * of empty values and field defaults (see `cleanEmptyData`), and transient
 * editor UI state (`selected`/`dragging`/`measured`) is dropped — xyflow
 * recomputes these on mount. The input flow is never mutated, so the live editor
 * canvas keeps its values — only the exported/saved artifact is trimmed,
 * mirroring `stripSensitiveHeadersFromFlow`.
 */
export const cleanFlowData = (flow: Flow): Flow => ({
  ...flow,
  nodes: flow.nodes.map(({ selected, dragging, measured, ...node }) => (node.data ? { ...node, data: cleanEmptyData(node.data) } : node)),
});
