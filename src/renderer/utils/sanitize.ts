import DOMPurify from "dompurify";
import { sanitize as sanitizePlainText } from "@/renderer/utils/sanitize.native";

/**
 * Configuration for DOMPurify sanitization
 */
interface SanitizeOptions {
  /**
   * Allow only plain text (strip all HTML tags)
   * @default true
   */
  plainTextOnly?: boolean;
  /**
   * Custom allowed tags (when plainTextOnly is false)
   */
  allowedTags?: string[];
  /**
   * Custom allowed attributes (when plainTextOnly is false)
   */
  allowedAttributes?: string[];
}

/**
 * Default safe configuration for DOMPurify
 * - Allows basic formatting tags
 * - Removes all scripts, styles, and potentially dangerous content
 * - Removes all event handlers (onclick, onerror, etc.)
 */
const DEFAULT_ALLOWED_TAGS = ["b", "i", "em", "strong", "u", "br", "p", "span"];
const DEFAULT_ALLOWED_ATTR = ["class"];

/**
 * Sanitizes user input to prevent XSS attacks
 *
 * This utility wraps DOMPurify and provides secure defaults for the treege library.
 * It should be used on all user-provided content before rendering, especially:
 * - Labels from node data
 * - Helper text
 * - Placeholder text
 * - Any content from HTTP responses
 *
 * @param input - The string to sanitize
 * @param options - Sanitization options
 * @returns Sanitized string safe for rendering
 *
 * @example
 * // Plain text only (default behavior)
 * sanitize('<script>alert("xss")</script>Hello')
 * // => 'Hello'
 *
 * @example
 * // Allow safe HTML tags
 * sanitize('<b>Bold text</b><script>alert("xss")</script>', { plainTextOnly: false })
 * // => '<b>Bold text</b>'
 *
 * @example
 * // Custom allowed tags
 * sanitize('<a href="http://example.com">Link</a>', {
 *   plainTextOnly: false,
 *   allowedTags: ['a'],
 *   allowedAttributes: ['href']
 * })
 * // => '<a href="http://example.com">Link</a>'
 */
export const sanitize = (input: string | undefined | null, options: SanitizeOptions = {}): string => {
  // Handle undefined/null - return empty string for React compatibility
  if (input === undefined || input === null || input === "") {
    return "";
  }

  // Convert to string if needed
  const stringInput = String(input);

  // DOMPurify needs a browser DOM: without one (React Native, SSR) it exposes
  // `isSupported: false` and no `sanitize` function, so fall back to the
  // regex-based plain-text implementation shared with the native entry.
  if (!DOMPurify.isSupported || typeof DOMPurify.sanitize !== "function") {
    return sanitizePlainText(stringInput);
  }

  // Default to plain text only mode for maximum security
  const { plainTextOnly = true, allowedTags, allowedAttributes } = options;

  // Plain text only mode
  if (plainTextOnly) {
    return DOMPurify.sanitize(stringInput, {
      ALLOWED_ATTR: [],
      ALLOWED_TAGS: [],
    });
  }

  // Safe HTML mode with custom or default configuration
  const finalAllowedTags = allowedTags ?? DEFAULT_ALLOWED_TAGS;
  const finalAllowedAttributes = allowedAttributes ?? DEFAULT_ALLOWED_ATTR;

  return DOMPurify.sanitize(stringInput, {
    // Additional security options
    ALLOW_DATA_ATTR: false, // Prevent data-* attributes
    ALLOW_UNKNOWN_PROTOCOLS: false, // Only allow http, https, mailto, etc.
    ALLOWED_ATTR: finalAllowedAttributes,
    ALLOWED_TAGS: finalAllowedTags,
    FORBID_ATTR: ["style"], // Prevent inline styles
    FORBID_TAGS: ["style", "script"], // Explicitly forbid these
    KEEP_CONTENT: true, // Keep text content when removing tags
    RETURN_DOM: false, // Return string, not DOM
    RETURN_DOM_FRAGMENT: false, // Return string, not DOM fragment
  });
};

/**
 * Maximum depth for recursive sanitization to prevent DoS attacks
 */
const MAX_DEPTH = 100;

/**
 * Sanitizes data from HTTP responses
 *
 * This function recursively sanitizes all string values in an object or array.
 * Useful for cleaning data received from external APIs before displaying it.
 *
 * Protection against:
 * - Circular references: Uses WeakSet to detect and handle circular objects
 * - Deep nesting attacks: Limits recursion depth to prevent DoS
 * - XSS attacks: Sanitizes all string values
 *
 * @param data - The data to sanitize (can be any type)
 * @param options - Sanitization options
 * @param depth - Current recursion depth (internal use)
 * @param seen - WeakSet to track visited objects (internal use)
 * @returns Sanitized data with same structure
 *
 * @example
 * sanitizeHttpResponse({
 *   name: 'John <script>xss</script>',
 *   nested: { title: 'Hello <b>world</b>' }
 * })
 * // => { name: 'John ', nested: { title: 'Hello <b>world</b>' } }
 *
 * @example
 * // Handles circular references gracefully
 * const obj = { name: 'Test' };
 * obj.self = obj;
 * sanitizeHttpResponse(obj)
 * // => { name: 'Test', self: { name: 'Test' } } // circular ref broken
 */
export const sanitizeHttpResponse = (
  data: unknown,
  options: SanitizeOptions = {},
  depth = 0,
  seen: WeakSet<object> = new WeakSet(),
): unknown => {
  // Prevent DoS via deep nesting
  if (depth > MAX_DEPTH) {
    console.warn(`sanitizeHttpResponse: Maximum depth (${MAX_DEPTH}) exceeded.`);
    // Still sanitize strings to prevent XSS even at max depth
    if (typeof data === "string") {
      return sanitize(data, options);
    }
    return "[Max Depth Exceeded]";
  }

  if (data === null || data === undefined) {
    return data;
  }

  // Sanitize strings
  if (typeof data === "string") {
    return sanitize(data, options);
  }

  // Recursively sanitize arrays
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeHttpResponse(item, options, depth + 1, seen));
  }

  // Recursively sanitize objects
  if (typeof data === "object") {
    // Detect circular references
    if (seen.has(data as object)) {
      console.warn("sanitizeHttpResponse: Circular reference detected. Breaking cycle to prevent infinite recursion.");
      return "[Circular Reference]";
    }

    // Mark this object as seen
    seen.add(data as object);

    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      sanitized[key] = sanitizeHttpResponse(value, options, depth + 1, seen);
    }

    // Remove from seen set after processing (allows the same object in different branches)
    seen.delete(data as object);

    return sanitized;
  }

  // Return other types as-is (numbers, booleans, etc.)
  return data;
};
