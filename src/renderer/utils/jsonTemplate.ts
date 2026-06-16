import { Node } from "@xyflow/react";
import { FormValues } from "@/renderer/types/renderer";
import { InputNodeData } from "@/shared/types/node";

/** Matches a field token used in the template (word chars + dash). */
const TOKEN_SAFE = /^[\w-]+$/;
/** A string that is *only* a single token, e.g. `"{{age}}"`. */
const WHOLE_TOKEN = /^\{\{([\w-]+)}}$/;
/** Any token occurrence, for in-string interpolation. */
const TOKEN_GLOBAL = /\{\{([\w-]+)}}/g;

/**
 * Build the token → value lookup. Each value is exposed under both its node id
 * and (when token-safe) its field name, so authors can reference either.
 */
const buildLookup = (formValues: FormValues, inputNodes: Node<InputNodeData>[]): FormValues => {
  const values: FormValues = { ...formValues };

  for (const node of inputNodes) {
    const name = node.data?.name?.trim();
    if (name && TOKEN_SAFE.test(name) && formValues[node.id] !== undefined && values[name] === undefined) {
      values[name] = formValues[node.id];
    }
  }

  return values;
};

/** Replace tokens inside a string with their stringified values (interpolation). */
const interpolate = (str: string, lookup: FormValues): string =>
  str.replace(TOKEN_GLOBAL, (_, token: string) => {
    const value = lookup[token];
    if (value === undefined || value === null) {
      return "";
    }
    return typeof value === "object" ? JSON.stringify(value) : String(value);
  });

/**
 * Recursively substitute tokens in an already-parsed JSON value.
 * - A string that is exactly `{{token}}` becomes the field's value with its
 *   original type preserved (number stays a number, object stays an object…).
 * - Other strings (and object keys) have their tokens interpolated as text.
 */
const substitute = (value: unknown, lookup: FormValues): unknown => {
  if (typeof value === "string") {
    const whole = value.match(WHOLE_TOKEN);
    if (whole) {
      const resolved = lookup[whole[1]];
      return resolved === undefined ? null : resolved;
    }
    return interpolate(value, lookup);
  }

  if (Array.isArray(value)) {
    return value.map((item) => substitute(item, lookup));
  }

  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      result[interpolate(key, lookup)] = substitute(val, lookup);
    }
    return result;
  }

  return value;
};

/** Parse JSON, returning `undefined` instead of throwing on invalid input. */
const tryParseJson = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
};

/**
 * Resolve a free-form JSON template into the actual payload.
 *
 * The template is valid JSON where field tokens sit inside string positions,
 * e.g. `{ "data": { "name": "{{firstName}}", "age": "{{age}}" } }`. The template
 * is parsed first, then each `"{{token}}"` is replaced by the matching field
 * value (`token` = a field's node id, or its token-safe `name`), preserving the
 * value's JSON type. Tokens may also be used inside object keys.
 *
 * @param template - The JSON template string
 * @param formValues - Current form values, keyed by node id
 * @param inputNodes - Input nodes, used to also expose values by field name
 * @returns The resolved payload, or `undefined` when the template is empty or
 *          not valid JSON (e.g. while the user is still typing)
 */
export const resolveJsonTemplate = (template: string | undefined, formValues: FormValues, inputNodes: Node<InputNodeData>[]): unknown => {
  if (!template || template.trim() === "") {
    return undefined;
  }

  const parsed = tryParseJson(template);

  // Valid JSON never parses to `undefined`, so this only triggers on a parse error.
  if (parsed === undefined) {
    return undefined;
  }

  return substitute(parsed, buildLookup(formValues, inputNodes));
};

/**
 * Resolve a JSON template and serialize it to a string, ready to be used as an
 * HTTP request body. Returns `undefined` when the template is empty or invalid
 * JSON (so the caller can omit the body).
 */
export const resolveTemplateToJson = (
  template: string | undefined,
  formValues: FormValues,
  inputNodes: Node<InputNodeData>[],
): string | undefined => {
  const resolved = resolveJsonTemplate(template, formValues, inputNodes);
  return resolved === undefined ? undefined : JSON.stringify(resolved);
};

/**
 * Whether a non-empty JSON template is syntactically valid JSON. Used by the
 * editor to surface a clear error instead of silently falling back at runtime.
 */
export const isJsonTemplateValid = (template: string | undefined): boolean => {
  if (!template || template.trim() === "") {
    return true;
  }

  // Valid JSON never parses to `undefined`, so a defined result means it parsed.
  return tryParseJson(template) !== undefined;
};
