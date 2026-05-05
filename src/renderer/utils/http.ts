import { FormValues } from "@/renderer/types/renderer";
import { sanitize } from "@/renderer/utils/sanitize";
import { HttpHeader, InputOption, OptionsSourceMapping } from "@/shared/types/node";

/**
 * Merge multiple lists of HTTP headers. Later sources override earlier ones
 * when they specify the same key (case-insensitive comparison, since HTTP
 * header names are case-insensitive). The casing of the latest occurrence
 * is preserved in the output.
 */
export const mergeHttpHeaders = (...sources: (HttpHeader[] | undefined)[]): HttpHeader[] => {
  const byLowerKey = new Map<string, HttpHeader>();

  sources.forEach((source) => {
    source?.forEach((header) => {
      if (!header.key) {
        return;
      }
      byLowerKey.set(header.key.toLowerCase(), header);
    });
  });

  return Array.from(byLowerKey.values());
};

/**
 * Result of an HTTP request
 */
export interface HttpRequestResult {
  /**
   * Whether the request was successful (2xx status code)
   */
  success: boolean;
  /**
   * Response data (parsed JSON or raw text)
   */
  data?: unknown;
  /**
   * Error message if request failed
   */
  error?: string;
  /**
   * HTTP status code
   */
  status?: number;
  /**
   * HTTP status text
   */
  statusText?: string;
}

/**
 * Options for making an HTTP request
 */
export interface HttpRequestOptions {
  /**
   * The URL to call (should already have variables replaced)
   */
  url: string;
  /**
   * HTTP method
   */
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  /**
   * Request headers
   */
  headers?: HttpHeader[];
  /**
   * Request body (for POST/PUT/PATCH)
   */
  body?: string;
  /**
   * Optional abort signal to cancel the request
   */
  signal?: AbortSignal;
}

/**
 * Make an HTTP request with common error handling and response parsing
 *
 * This is a shared utility used by both HTTP inputs and submit buttons
 * to ensure consistent behavior across the library.
 *
 * @param options - Request options
 * @returns Promise with request result
 */
export const makeHttpRequest = async (options: HttpRequestOptions): Promise<HttpRequestResult> => {
  try {
    const { url, method = "GET", headers: customHeaders = [], body, signal } = options;

    // Validate URL
    if (!url || url.trim() === "") {
      return {
        error: "No URL provided",
        success: false,
      };
    }

    // Default Content-Type has the lowest priority — caller-provided headers
    // (global or field-level) win when they specify the same key.
    const merged = mergeHttpHeaders([{ key: "Content-Type", value: "application/json" }], customHeaders);
    const headers = Object.fromEntries(merged.filter((h) => h.key && h.value).map((h) => [h.key, h.value]));

    // Prepare request options
    const requestOptions: RequestInit = {
      headers,
      method,
      signal,
    };

    // Add body for methods that support it
    if (body && method && ["POST", "PUT", "PATCH"].includes(method)) {
      requestOptions.body = body;
    }

    // Make the HTTP request
    const response = await fetch(url, requestOptions);

    // Parse response
    let responseData: unknown;
    const contentType = response.headers.get("content-type");

    if (contentType?.includes("application/json")) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    // Check if request was successful
    if (!response.ok) {
      return {
        data: responseData,
        error: `HTTP ${response.status}: ${response.statusText}`,
        status: response.status,
        statusText: response.statusText,
        success: false,
      };
    }

    return {
      data: responseData,
      status: response.status,
      statusText: response.statusText,
      success: true,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "An unknown error occurred",
      success: false,
    };
  }
};

/**
 * Replace template variables in a string with actual values from form data
 *
 * Uses {{fieldId}} syntax for all replacements (URLs, JSON bodies, etc.)
 *
 * Smart JSON handling:
 * - Strings: automatically wrapped in quotes and escaped
 * - Numbers/Booleans: converted to JSON-safe format
 * - Arrays/Objects: JSON.stringify
 *
 * @param template - The template string containing variables
 * @param values - Form values to substitute
 * @param options - Replacement options
 * @param options.encode - Whether to URL-encode the replaced values (for URLs)
 * @param options.json - Whether to use smart JSON handling (for request bodies)
 * @returns The string with variables replaced
 *
 * @example
 * // For URLs (with encoding)
 * replaceTemplateVariables("https://api.com/users/{{userId}}", { userId: "john doe" }, { encode: true })
 * // => "https://api.com/users/john%20doe"
 *
 * // For JSON bodies (smart handling)
 * replaceTemplateVariables('{"name": {{userName}}}', { userName: "John" }, { json: true })
 * // => '{"name": "John"}'
 *
 * replaceTemplateVariables('{"age": {{userAge}}}', { userAge: 25 }, { json: true })
 * // => '{"age": 25}'
 */
export const replaceTemplateVariables = (
  template: string | undefined,
  values: FormValues,
  options: { encode?: boolean; json?: boolean } = {},
): string => {
  if (!template) {
    return "";
  }

  const { encode = false, json = false } = options;

  return template.replace(/\{\{([\w-]+)}}/g, (_, fieldId) => {
    const value = values[fieldId.trim()];

    // Handle undefined/null
    if (value === undefined || value === null) {
      return json ? "null" : "";
    }

    // Sanitize string values to prevent injection attacks (plainTextOnly: true by default)
    const sanitizedValue = typeof value === "string" ? sanitize(value) : value;

    // URL encoding mode
    if (encode) {
      return encodeURIComponent(String(sanitizedValue));
    }

    // JSON smart mode
    if (json) {
      // String: wrap in quotes and escape
      if (typeof sanitizedValue === "string") {
        return `"${sanitizedValue.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
      }
      // Number or boolean: direct conversion
      if (typeof sanitizedValue === "number" || typeof sanitizedValue === "boolean") {
        return String(sanitizedValue);
      }
      // Array or object: JSON.stringify
      if (typeof sanitizedValue === "object") {
        return JSON.stringify(sanitizedValue);
      }
    }

    // Default: simple string conversion
    return String(sanitizedValue);
  });
};

/**
 * Replace template variables in response data (for redirect URLs)
 *
 * Supports {{response.field}} format to access response data
 *
 * @param template - The template string containing variables
 * @param responseData - Response data object
 * @returns The string with variables replaced
 */
export const replaceResponseVariables = (template: string | undefined, responseData: unknown): string => {
  if (!template) {
    return "";
  }

  // Replace {{response.field}} format
  return template.replace(/\{\{response\.([\w.-]+)}}/g, (_, path) => {
    const value = getNestedValue(responseData, path.trim());
    return value !== undefined && value !== null ? String(value) : "";
  });
};

/**
 * Get nested value from an object using dot notation
 *
 * @param obj - The object to extract value from
 * @param path - The path in dot notation (e.g., "user.profile.name")
 * @returns The value at the path, or undefined if not found
 */
const getNestedValue = (obj: unknown, path: string): unknown => {
  if (!obj || typeof obj !== "object") {
    return undefined;
  }

  return path.split(".").reduce<unknown>((current, part) => {
    if (current === null || current === undefined || typeof current !== "object") {
      return undefined;
    }
    return (current as Record<string, unknown>)[part];
  }, obj);
};

/**
 * Extract a value from an object using a path that supports dot notation
 * and array indexing. Examples:
 * - "data.users" → obj.data.users
 * - "results[0].name" → obj.results[0].name
 *
 * @param obj - The object to extract value from
 * @param path - The path expression (empty string returns the object as-is)
 * @returns The value at the path, or undefined if not found
 */
export const getValueByPath = (obj: unknown, path: string): unknown => {
  if (!path) {
    return obj;
  }

  return path.split(".").reduce<unknown>((current, part) => {
    if (current === null || current === undefined) {
      return undefined;
    }

    const arrayMatch = part.match(/^(\w+)\[(\d+)]$/);
    if (arrayMatch) {
      const [, key, index] = arrayMatch;
      const intermediate = (current as Record<string, unknown>)[key];
      if (Array.isArray(intermediate)) {
        return intermediate[Number.parseInt(index, 10)];
      }
      return intermediate;
    }

    return (current as Record<string, unknown>)[part];
  }, obj);
};

/**
 * Project a list-shaped HTTP response into InputOption objects, applying
 * a field-to-property mapping. Returns an empty array when the data is not
 * iterable or required fields are missing.
 */
export const extractOptionsFromResponse = (
  response: unknown,
  responsePath: string | undefined,
  mapping: OptionsSourceMapping,
): InputOption[] => {
  const data = getValueByPath(response, responsePath ?? "");
  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map((item): InputOption | null => {
      const rawValue = getValueByPath(item, mapping.valueField);
      const rawLabel = getValueByPath(item, mapping.labelField);
      if (rawValue === undefined || rawValue === null) {
        return null;
      }

      const labelText = rawLabel === undefined || rawLabel === null ? String(rawValue) : String(rawLabel);
      const option: InputOption = {
        label: { en: labelText },
        value: String(rawValue),
      };

      if (mapping.descriptionField) {
        const description = getValueByPath(item, mapping.descriptionField);
        if (description !== undefined && description !== null && description !== "") {
          option.description = { en: String(description) };
        }
      }

      if (mapping.imageField) {
        const image = getValueByPath(item, mapping.imageField);
        if (typeof image === "string" && image !== "") {
          option.image = image;
        }
      }

      return option;
    })
    .filter((option): option is InputOption => option !== null);
};
