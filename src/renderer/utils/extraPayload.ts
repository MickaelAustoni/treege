import { ExtraPayload, FormValues } from "@/renderer/types/renderer";

/**
 * Merge the consumer-provided `extraPayload` onto a base submission payload.
 * This is the single chokepoint behind the `extraPayload` prop, used both for
 * the `onSubmit` callback payload and the built-in HTTP submit body.
 *
 * `extraPayload` may be a static object or a function of the current
 * (name-keyed) values — the function form lets the extra data be read at submit
 * time (e.g. a freshly-read auth token). The extra fields are spread **last**,
 * so a consumer-injected key (e.g. `userId`) intentionally wins over a
 * same-named form field.
 *
 * Edge cases:
 * - No `extraPayload`, or it resolves to a non-object (array / primitive) →
 *   the base is returned untouched (nothing to merge).
 * - Base is `undefined`/`null` (e.g. a submit config that would otherwise send
 *   no body) → the extra is sent on its own, so the injected data still goes out.
 * - Base is a non-object → returned untouched, since there is no top level to
 *   merge into.
 */
export const mergeExtraPayload = <T>(base: T, extraPayload: ExtraPayload | undefined, values: FormValues): T | Record<string, unknown> => {
  if (!extraPayload) {
    return base;
  }

  const extra = typeof extraPayload === "function" ? extraPayload(values) : extraPayload;

  if (!extra || typeof extra !== "object" || Array.isArray(extra)) {
    return base;
  }

  // No base body (e.g. a submit config that sends nothing) → emit the extra alone.
  if (base === undefined || base === null) {
    return extra;
  }

  // A non-object base (an array/primitive payload template) has no top level to
  // merge into → leave it untouched rather than clobber the template shape.
  if (typeof base !== "object" || Array.isArray(base)) {
    return base;
  }

  return { ...(base as Record<string, unknown>), ...extra };
};
