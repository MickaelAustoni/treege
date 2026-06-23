import { Node } from "@xyflow/react";
import { FormValues } from "@/renderer/types/renderer";
import { normalizeSerializableFiles } from "@/renderer/utils/file";
import { getFlowRenderState } from "@/renderer/utils/flow";
import { buildInitialFormValues } from "@/renderer/utils/form";
import { resolveUrl } from "@/renderer/utils/http";
import { getInputNodes, resolveNodeKey } from "@/renderer/utils/node";
import { INPUT_TYPE } from "@/shared/constants/inputType";
import { SerializableFile } from "@/shared/types/file";
import { Flow, InputNodeData, InputOption, InputType } from "@/shared/types/node";
import { getTranslatedText } from "@/shared/utils/translations";

/**
 * Display-ready representation of a submitted field value, normalized per input
 * type so a viewer can render it without re-deriving formatting rules:
 * - `text`    free-form string (text, number, date, ranges, resolved option label…)
 * - `boolean` a yes/no value (switch) — render as a read-only toggle/checkbox
 * - `tags`    a list of labels (multi-select checkbox) — render as chips
 * - `files`   uploaded documents — render names or thumbnails (often overridden)
 * - `empty`   no value was submitted for this field
 */
export type ViewerFieldDisplay =
  | { kind: "text"; text: string }
  | { kind: "boolean"; checked: boolean }
  | { kind: "tags"; tags: string[] }
  | { kind: "files"; files: SerializableFile[] }
  | { kind: "empty" };

/** A single resolved field of a submitted form, ready for read-only rendering. */
export interface ViewerField {
  /** The flow node id. */
  id: string;
  /** The submission key (name > translated label > id), as used in `onSubmit`. */
  name: string;
  /** The input type (`text`, `select`, `daterange`, `file`, …). */
  type: InputType;
  /** The translated field label (falls back to `name`, then node id). */
  label: string;
  /** The raw submitted value, untouched. */
  rawValue: unknown;
  /** Normalized, render-ready representation of the value. */
  display: ViewerFieldDisplay;
  /** The originating flow node (escape hatch for custom rendering). */
  node: Node<InputNodeData>;
}

export interface GetViewerFieldsOptions {
  /** Language used to resolve translatable labels/options (defaults to `en`). */
  language?: string;
  /**
   * Base URL used to resolve relative file paths (e.g. `uploads/x.png`) into
   * absolute URLs — same role as on `TreegeRenderer`/`TreegeEditor`. Absolute,
   * `data:` and `blob:` URLs are left untouched.
   */
  baseUrl?: string;
}

/** Field types that never carry a user-facing value in a read-only view. */
const NON_DISPLAYABLE_TYPES = new Set<string>([INPUT_TYPE.hidden, INPUT_TYPE.submit]);

const isEmptyValue = (value: unknown): boolean =>
  value === undefined ||
  value === null ||
  (typeof value === "string" && value.trim() === "") ||
  (Array.isArray(value) && value.length === 0);

/**
 * Range fields (`daterange`/`timerange`) may arrive either as a `[from, to]`
 * array (native renderer output) or a `"from,to"` comma-string (some backends
 * persist them flattened). Normalize both to an array of parts.
 */
const toRangeParts = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((part) => (part == null ? "" : String(part)));
  }
  if (typeof value === "string") {
    return value.split(",");
  }
  return [];
};

const formatDate = (value: unknown, language: string): string => {
  if (value === undefined || value === null || value === "") {
    return "";
  }
  const date = new Date(value as string);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString(language);
};

/** Resolve an option's translated label by its submitted value, falling back to the raw value. */
const resolveOptionLabel = (options: InputOption[] | undefined, value: unknown, language: string): string => {
  const option = options?.find((candidate) => candidate.value === value);
  return option ? getTranslatedText(option.label, language) || option.value : String(value ?? "");
};

const IMAGE_URL_EXTENSION = /\.(png|jpe?g|gif|webp|svg|avif|bmp|ico)(\?|#|$)/i;

/**
 * Whether a file should be previewed inline as an image — detected by MIME type
 * (`image/*`), a `data:image/` data-URL, or a recognized image URL extension.
 */
export const isImageFile = (file: SerializableFile): boolean =>
  Boolean(file.type?.startsWith("image/")) || Boolean(file.data?.startsWith("data:image/")) || IMAGE_URL_EXTENSION.test(file.data ?? "");

/** Resolve a file's `data` against `baseUrl`, leaving `data:`/`blob:` URLs untouched. */
const resolveFileData = (data: string, baseUrl?: string): string =>
  !data || data.startsWith("data:") || data.startsWith("blob:") ? data : resolveUrl(data, baseUrl);

/**
 * Normalize a `file` field value into a uniform list (accepting `SerializableFile`s,
 * bare URL strings, or a mix — see {@link normalizeSerializableFiles}), then
 * resolve any relative `data` path against `baseUrl`.
 */
const toViewerFiles = (value: unknown, baseUrl?: string): SerializableFile[] =>
  normalizeSerializableFiles(value as Parameters<typeof normalizeSerializableFiles>[0]).map((file) => ({
    ...file,
    data: resolveFileData(file.data, baseUrl),
  }));

const computeDisplay = (node: Node<InputNodeData>, value: unknown, language: string, baseUrl?: string): ViewerFieldDisplay => {
  if (isEmptyValue(value)) {
    return { kind: "empty" };
  }

  const { type, options } = node.data;

  switch (type) {
    case INPUT_TYPE.switch:
      return { checked: value === true || value === "true", kind: "boolean" };

    case INPUT_TYPE.checkbox: {
      const values = Array.isArray(value) ? value : [value];
      return { kind: "tags", tags: values.map((entry) => resolveOptionLabel(options, entry, language)) };
    }

    // Single-choice inputs submit the option `value`; display its label instead.
    case INPUT_TYPE.radio:
    case INPUT_TYPE.select:
    case INPUT_TYPE.autocomplete:
    case INPUT_TYPE.http:
      return { kind: "text", text: resolveOptionLabel(options, value, language) };

    case INPUT_TYPE.date:
      return { kind: "text", text: formatDate(value, language) };

    case INPUT_TYPE.daterange: {
      const parts = toRangeParts(value)
        .map((part) => formatDate(part, language))
        .filter(Boolean);
      return parts.length ? { kind: "text", text: parts.join(" → ") } : { kind: "empty" };
    }

    case INPUT_TYPE.timerange: {
      const parts = toRangeParts(value)
        .map((part) => part.trim())
        .filter(Boolean);
      return parts.length ? { kind: "text", text: parts.join(" → ") } : { kind: "empty" };
    }

    case INPUT_TYPE.file: {
      const files = toViewerFiles(value, baseUrl);
      return files.length ? { files, kind: "files" } : { kind: "empty" };
    }

    // address, text, textarea, number, password, time and any future scalar type.
    default:
      return { kind: "text", text: String(value) };
  }
};

/**
 * Resolve a submitted form into a flat, render-ready list of fields.
 *
 * Mirrors what the renderer would show for the same values: the submission is
 * normalized to node-id keys (accepting both `name`- and `id`-keyed input, like
 * `initialValues`), then run through the same branch-visibility logic so only
 * the fields that were actually reachable for these values are returned —
 * inactive branches and `hidden`/`submit` nodes are excluded.
 *
 * This is the headless core behind {@link TreegeViewer}: consumers wanting a
 * custom layout can render straight from this list.
 *
 * @param flow - The flow definition the values were submitted against
 * @param values - The submitted values (`name`- or `id`-keyed)
 * @param options - Resolution options (language, baseUrl)
 * @returns The ordered, visible, display-ready fields
 */
export const getViewerFields = (
  flow: Flow | null | undefined,
  values: FormValues | null | undefined,
  options: GetViewerFieldsOptions = {},
): ViewerField[] => {
  const { language = "en", baseUrl } = options;
  const nodes = flow?.nodes ?? [];
  const edges = flow?.edges ?? [];
  const inputNodes = getInputNodes(nodes);
  // Normalize to node-id keys (accepts name- or id-keyed input) so visibility
  // and value lookups share one keying, exactly like the renderer at mount.
  const idValues = buildInitialFormValues(values ?? {}, inputNodes);
  const { visibleNodes } = getFlowRenderState(nodes, edges, idValues);

  return getInputNodes(visibleNodes)
    .filter((node) => !NON_DISPLAYABLE_TYPES.has(node.data.type ?? ""))
    .map((node) => {
      const rawValue = idValues[node.id];

      return {
        display: computeDisplay(node, rawValue, language, baseUrl),
        id: node.id,
        label: getTranslatedText(node.data.label, language) || node.data.name || node.id,
        name: resolveNodeKey(node),
        node,
        rawValue,
        type: (node.data.type ?? INPUT_TYPE.text) as InputType,
      };
    });
};
