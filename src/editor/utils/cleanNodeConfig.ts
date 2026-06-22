import { INPUT_TYPE, OPTIONS_INPUT_TYPES } from "@/shared/constants/inputType";

/**
 * Config blocks on an input node that only make sense for a specific subtype.
 * Each block is kept only when its predicate matches the new subtype; otherwise
 * it is dropped. Without this, switching an input's subtype (e.g. `select` →
 * `http`) leaves the previous block behind — no form surfaces it anymore, so it
 * lingers as invisible data and any secret it holds (e.g. an `Authorization`
 * header inside `optionsSource`) keeps getting persisted and exported.
 */
const CONFIG_BLOCKS: readonly { key: "httpConfig" | "optionsSource" | "submitConfig"; keepFor: (subType: string) => boolean }[] = [
  { keepFor: (subType) => subType === INPUT_TYPE.http, key: "httpConfig" },
  { keepFor: (subType) => OPTIONS_INPUT_TYPES.includes(subType), key: "optionsSource" },
  { keepFor: (subType) => subType === INPUT_TYPE.submit, key: "submitConfig" },
];

/** True when `key` is a config block that no longer belongs to `subType`. */
const isStaleConfigBlock = (key: string, subType: string): boolean =>
  CONFIG_BLOCKS.some(({ key: blockKey, keepFor }) => blockKey === key && !keepFor(subType));

/**
 * Returns a copy of `data` keeping only the config blocks that belong to
 * `subType` (non-config keys are always kept).
 */
export const cleanConfigForSubType = (data: Record<string, unknown>, subType: string): Record<string, unknown> => {
  const entries = Object.entries(data);
  const relevantEntries = entries.filter(([key]) => !isStaleConfigBlock(key, subType));

  return Object.fromEntries(relevantEntries);
};
