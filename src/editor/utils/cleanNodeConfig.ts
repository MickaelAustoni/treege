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

/**
 * Returns a copy of `data` with config blocks that don't belong to `subType`
 * removed. Pure — returns the same reference when nothing is dropped.
 */
export const cleanConfigForSubType = <T extends Record<string, unknown>>(data: T, subType: string): T => {
  let next: T | undefined;

  for (const { key, keepFor } of CONFIG_BLOCKS) {
    if (data[key] !== undefined && !keepFor(subType)) {
      next ??= { ...data };
      delete next[key];
    }
  }

  return next ?? data;
};
