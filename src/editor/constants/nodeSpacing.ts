/**
 * Constants for node spacing and positioning in the flow editor
 */

/**
 * Vertical spacing between nodes (in pixels)
 * Used when creating nodes via handle click or AI generation
 */
export const VERTICAL_NODE_SPACING = 100;

/**
 * Horizontal offset when placing sibling nodes (in pixels)
 */
export const HORIZONTAL_NODE_OFFSET = 50;

/**
 * Horizontal spacing for AI-generated flows (in pixels)
 */
export const AI_HORIZONTAL_SPACING = 350;

/**
 * Position tolerance for detecting nodes at the same Y position (in pixels)
 */
export const POSITION_TOLERANCE = 20;

/**
 * Default direction for the auto-layout algorithm.
 * "TB" = top to bottom, "LR" = left to right.
 */
export const LAYOUT_DIRECTION = "TB";

/**
 * Vertical gap between ranks (parent → child) used by the auto-layout (in pixels).
 */
export const LAYOUT_VERTICAL_SPACING = 80;

/**
 * Horizontal gap between siblings used by the auto-layout (in pixels).
 */
export const LAYOUT_HORIZONTAL_SPACING = 60;
