/**
 * Least height of a single-line field, typed into or tapped to pick: 48 is the comfortable touch height of both
 * platforms' guidelines (iOS asks 44, Material 48)
 */
export const FIELD_MIN_HEIGHT = 48;

/**
 * The box every single-line field draws, a text input or a picker's trigger alike, so the fields of a form line up
 * as one column of equal controls whatever their type. The text sits in its middle.
 */
export const FIELD_BOX = {
  minHeight: FIELD_MIN_HEIGHT,
  paddingHorizontal: 12,
  paddingVertical: 12,
} as const;
