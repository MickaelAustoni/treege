/**
 * A single editable key/value row. Editor forms work on lists of these while
 * the user types (they tolerate transient empty keys), then serialize back to
 * the persisted `Record<string, string>` form via `entriesToRecord`.
 */
export type KeyValueEntry = { key: string; value: string };

/**
 * Expand a `{ key: value }` record into editor rows, preserving insertion
 * order. Returns an empty list for `undefined`.
 */
export const recordToEntries = (record?: Record<string, string>): KeyValueEntry[] =>
  Object.entries(record ?? {}).map(([key, value]) => ({ key, value }));

/**
 * Collapse editor rows back into a `{ key: value }` record. Rows with an empty
 * key are dropped (they're transient editing artifacts), and on duplicate keys
 * the last occurrence wins.
 */
export const entriesToRecord = (entries?: KeyValueEntry[]): Record<string, string> => {
  const record: Record<string, string> = {};

  entries?.forEach(({ key, value }) => {
    if (key) {
      record[key] = value;
    }
  });

  return record;
};
