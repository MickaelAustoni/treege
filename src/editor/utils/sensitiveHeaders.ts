import { Flow, HttpHeader } from "@/shared/types/node";

/**
 * Header names that typically carry credentials or secrets, matched
 * case-insensitively. Field-level headers (httpConfig/optionsSource/submitConfig)
 * are persisted in the exported/saved tree, so anything matching this must never
 * be stored there — authentication belongs in the editor's non-persisted global
 * headers (see AuthorizeDialog).
 */
const SENSITIVE_HEADER_PATTERN = /^(authorization|proxy-authorization|cookie|x-api-key|api-?key|x-auth-token|x-access-token|x-secret)$/i;

/** Node data keys whose value is an HTTP config carrying a `headers` array. */
const HEADER_CONFIG_KEYS = ["httpConfig", "optionsSource", "submitConfig"] as const;

/** True when a header key is known to carry credentials/secrets. */
export const isSensitiveHeaderKey = (key: string): boolean => SENSITIVE_HEADER_PATTERN.test(key.trim());

/** True when the list contains a sensitive header with a non-empty value. */
export const hasSensitiveHeader = (headers?: HttpHeader[]): boolean =>
  Boolean(headers?.some((header) => isSensitiveHeaderKey(header.key) && header.value.trim() !== ""));

/**
 * Returns a copy of the flow with all credential-bearing field-level headers
 * removed from every node's httpConfig/optionsSource/submitConfig, plus the
 * number of headers stripped. The input flow is never mutated, so the live
 * editor canvas keeps its values — only the exported/saved artifact is cleaned.
 */
export const stripSensitiveHeadersFromFlow = (flow: Flow): { flow: Flow; strippedCount: number } => {
  let strippedCount = 0;

  const nodes = flow.nodes.map((node) => {
    const data = node.data as Record<string, unknown> | undefined;
    if (!data) {
      return node;
    }

    let nodeChanged = false;
    const nextData: Record<string, unknown> = { ...data };

    for (const key of HEADER_CONFIG_KEYS) {
      const config = data[key] as { headers?: HttpHeader[] } | undefined;
      if (!config?.headers?.length) {
        continue;
      }

      const kept = config.headers.filter((header) => !isSensitiveHeaderKey(header.key));
      if (kept.length !== config.headers.length) {
        strippedCount += config.headers.length - kept.length;
        nextData[key] = { ...config, headers: kept };
        nodeChanged = true;
      }
    }

    return nodeChanged ? { ...node, data: nextData } : node;
  });

  return { flow: { ...flow, nodes }, strippedCount };
};
