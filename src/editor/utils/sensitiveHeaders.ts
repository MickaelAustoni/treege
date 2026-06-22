import { Flow } from "@/shared/types/node";
import { KeyValueEntry } from "@/shared/utils/httpRecord";

/** Narrows an unknown value to a plain record without an assertion. */
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Header names that typically carry credentials or secrets, matched
 * case-insensitively. Field-level headers (httpConfig/optionsSource/submitConfig)
 * are persisted in the exported/saved tree, so anything matching this must never
 * be stored there — authentication belongs in the editor's non-persisted global
 * headers (see AuthorizeDialog).
 */
const SENSITIVE_HEADER_PATTERN = /^(authorization|proxy-authorization|cookie|x-api-key|api-?key|x-auth-token|x-access-token|x-secret)$/i;

/** Node data keys whose value is an HTTP config carrying a `headers` record. */
const HEADER_CONFIG_KEYS = ["httpConfig", "optionsSource", "submitConfig"] as const;

/** True when a header key is known to carry credentials/secrets. */
export const isSensitiveHeaderKey = (key: string): boolean => SENSITIVE_HEADER_PATTERN.test(key.trim());

/**
 * True when the editor rows contain a sensitive header with a non-empty value.
 * Operates on the form's working rows (which may still hold empty keys) rather
 * than the serialized record, so the warning shows as soon as the user types.
 */
export const hasSensitiveHeader = (headers?: KeyValueEntry[]): boolean =>
  Boolean(headers?.some((header) => isSensitiveHeaderKey(header.key) && header.value.trim() !== ""));

/**
 * Strips sensitive headers from a single config block, reporting how many were
 * removed. Returns the config untouched when it holds no header to strip.
 */
const stripConfigHeaders = (config: unknown): { config: unknown; removed: number } => {
  if (!(isRecord(config) && isRecord(config.headers))) {
    return { config, removed: 0 };
  }

  const keptHeaders = Object.entries(config.headers).filter(([key]) => !isSensitiveHeaderKey(key));
  const removed = Object.keys(config.headers).length - keptHeaders.length;

  return { config: { ...config, headers: Object.fromEntries(keptHeaders) }, removed };
};

/**
 * Returns a copy of the flow with all credential-bearing field-level headers
 * removed from every node's httpConfig/optionsSource/submitConfig, plus the
 * number of headers stripped. The input flow is never mutated, so the live
 * editor canvas keeps its values — only the exported/saved artifact is cleaned.
 */
export const stripSensitiveHeadersFromFlow = (flow: Flow): { flow: Flow; strippedCount: number } => {
  const results = flow.nodes.map((node) => {
    if (!isRecord(node.data)) {
      return { node, removed: 0 };
    }

    const strippedBlocks = HEADER_CONFIG_KEYS.map((key) => ({ key, ...stripConfigHeaders(node.data[key]) })).filter(
      (block) => block.removed > 0,
    );

    if (strippedBlocks.length === 0) {
      return { node, removed: 0 };
    }

    const data = { ...node.data, ...Object.fromEntries(strippedBlocks.map((block) => [block.key, block.config])) };
    const removed = strippedBlocks.reduce((sum, block) => sum + block.removed, 0);

    return { node: { ...node, data }, removed };
  });

  return {
    flow: { ...flow, nodes: results.map((result) => result.node) },
    strippedCount: results.reduce((sum, result) => sum + result.removed, 0),
  };
};
