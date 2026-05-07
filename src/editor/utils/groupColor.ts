/**
 * djb2-ish 32-bit hash. Used only to derive a stable hue from a groupId —
 * not for security, so any cheap deterministic hash is fine.
 */
const hashString = (input: string): number => {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
};

/**
 * Deterministic color for a group, derived from its id.
 *
 * Why HSL + inline style (rather than a Tailwind class):
 * Tailwind purges classes at build time and can't synthesize `bg-{color}`
 * from a runtime hash. Picking from a fixed palette would cap the number of
 * distinguishable groups; HSL with a hashed hue gives effectively unlimited
 * distinct, stable colors with no Tailwind-side configuration.
 *
 * Saturation/lightness are fixed (65% / 45%) so every group lands in the
 * same readable, mid-contrast band on both light and dark themes — only the
 * hue varies between groups.
 */
export const getGroupColor = (groupId?: string): string => {
  if (!groupId) {
    return "";
  }

  const hue = hashString(groupId) % 360;
  return `hsl(${hue} 65% 45%)`;
};
