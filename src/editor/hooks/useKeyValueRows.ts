import { useState } from "react";
import { entriesToRecord, KeyValueEntry, recordToEntries } from "@/shared/utils/httpRecord";

/**
 * Bridges an editable list of key/value rows with a persisted
 * `Record<string, string>` (headers, query params…).
 *
 * Records can't hold a half-typed row (an empty key, or two rows mid-edit), so
 * the rows are the local source of truth while editing. Every mutation is
 * serialized back to a record — empty keys dropped, last wins on duplicates —
 * and pushed up via `onChange`. The rows reseed from `record` only when it
 * changes from the outside (a different node, a static↔api toggle), never in
 * response to our own emit, so adding a blank row doesn't immediately vanish.
 * The reseed happens during render (React's recommended pattern) rather than in
 * an effect, so there's no extra commit/flash.
 */
export const useKeyValueRows = (
  record: Record<string, string> | undefined,
  onChange: (record: Record<string, string>) => void,
): readonly [KeyValueEntry[], (rows: KeyValueEntry[]) => void] => {
  const [rows, setRows] = useState<KeyValueEntry[]>(() => recordToEntries(record));
  // Track the last record we synced with; when an *external* one arrives, adopt it.
  const [syncedRecord, setSyncedRecord] = useState(record);

  if (record !== syncedRecord) {
    setSyncedRecord(record);
    setRows(recordToEntries(record));
  }

  const setRowsAndEmit = (next: KeyValueEntry[]) => {
    setRows(next);
    const nextRecord = entriesToRecord(next);
    setSyncedRecord(nextRecord);
    onChange(nextRecord);
  };

  return [rows, setRowsAndEmit] as const;
};
