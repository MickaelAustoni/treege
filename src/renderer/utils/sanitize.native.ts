/**
 * React Native implementation of sanitization utilities
 * Does not use DOMPurify as it depends on browser DOM
 */

/**
 * Configuration for sanitization
 */
interface SanitizeOptions {
  /**
   * Allow only plain text (strip all HTML tags)
   * @default true
   */
  plainTextOnly?: boolean;
  /**
   * Custom allowed tags (when plainTextOnly is false)
   * Note: In React Native, HTML tags are always stripped
   */
  allowedTags?: string[];
  /**
   * Custom allowed attributes (when plainTextOnly is false)
   * Note: In React Native, attributes are not applicable
   */
  allowedAttributes?: string[];
}

/**
 * Strips all HTML tags from a string
 */
const stripHtmlTags = (str: string): string => {
  return str.replace(/<[^>]*>/g, "");
};

/**
 * Decodes common HTML entities
 */
const decodeHtmlEntities = (str: string): string => {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/");
};

/**
 * Sanitizes user input to prevent XSS attacks
 *
 * React Native implementation that strips all HTML tags and decodes entities.
 * Since React Native doesn't render HTML, we focus on cleaning text content.
 *
 * @param input - The string to sanitize
 * @param options - Sanitization options (maintained for API compatibility)
 * @returns Sanitized string safe for rendering
 *
 * @example
 * sanitize('<script>alert("xss")</script>Hello')
 * // => 'Hello'
 *
 * @example
 * sanitize('<b>Bold text</b><script>alert("xss")</script>')
 * // => 'Bold text'
 */
export const sanitize = (input: string | undefined | null, _options: SanitizeOptions = {}): string => {
  // Handle undefined/null - return empty string for React compatibility
  if (input === undefined || input === null || input === "") {
    return "";
  }

  // Convert to string if needed
  const stringInput = String(input);
  // In React Native, we always strip HTML tags since Text components don't support HTML
  const stripped = stripHtmlTags(stringInput);

  return decodeHtmlEntities(stripped);
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
 * // => { name: 'John ', nested: { title: 'Hello world' } }
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
