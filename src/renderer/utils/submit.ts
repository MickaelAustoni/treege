import { Node } from "@xyflow/react";
import { FormValues } from "@/renderer/types/renderer";
import { convertFormValuesToNamedFormat } from "@/renderer/utils/form";
import { makeHttpRequest, mergeHttpHeaders, replaceResponseVariables, replaceTemplateVariables } from "@/renderer/utils/http";
import { HttpHeader, InputNodeData, SubmitConfig } from "@/shared/types/node";

/**
 * Result of a form submission
 */
export interface SubmitResult {
  /**
   * Whether the submission was successful
   */
  success: boolean;
  /**
   * Response data from the server
   */
  data?: unknown;
  /**
   * Error message if submission failed
   */
  error?: string;
  /**
   * URL to redirect to (if configured)
   */
  redirectUrl?: string;
}

/**
 * Submit form data using the provided submit configuration
 *
 * This function handles:
 * - Template variable replacement in URL, body, and headers
 * - HTTP request to the configured endpoint
 * - Response parsing
 * - Redirect URL generation with response data
 *
 * @param config - Submit configuration from the submit button node
 * @param formValues - Current form values
 * @param inputNodes - All input nodes (required when sendAllFormValues is true)
 * @param headers
 * @returns Promise with submission result
 */
export const submitFormData = async (
  config: SubmitConfig,
  formValues: FormValues,
  inputNodes: Node<InputNodeData>[],
  headers?: HttpHeader[],
): Promise<SubmitResult> => {
  // Validate configuration
  if (!config.url || config.url.trim() === "") {
    return {
      error: "No URL configured for submission",
      success: false,
    };
  }

  // Replace template variables in URL (with encoding)
  const url = replaceTemplateVariables(config.url, formValues, { encode: true });

  if (!url || url.trim() === "") {
    return {
      error: "Invalid URL after template replacement",
      success: false,
    };
  }

  // Replace template variables in both global and field-level headers,
  // then merge with field-level winning over globals on key collision.
  const replaceVars = (header: HttpHeader): HttpHeader => ({
    key: header.key,
    value: replaceTemplateVariables(header.value, formValues),
  });

  // Prepare body: use all form data if sendAllFormValues is true, otherwise use custom body
  const body = config.sendAllFormValues
    ? JSON.stringify(convertFormValuesToNamedFormat(formValues, inputNodes))
    : config.body
      ? replaceTemplateVariables(config.body, formValues, { json: true })
      : undefined;

  // Make the HTTP request using shared utility
  const result = await makeHttpRequest({
    body,
    headers: mergeHttpHeaders(headers?.map(replaceVars), config.headers?.map(replaceVars)),
    method: config.method || "POST",
    url,
  });

  // If request failed, return early
  if (!result.success) {
    return {
      data: result.data,
      error: result.error,
      success: false,
    };
  }

  // Generate redirect URL if configured
  const redirectUrl = config.redirectUrl
    ? (() => {
        const replaced = replaceResponseVariables(config.redirectUrl, result.data);
        return replaced && replaced.trim() !== "" ? replaced : undefined;
      })()
    : undefined;

  return {
    data: result.data,
    redirectUrl,
    success: true,
  };
};

/**
 * Perform redirect to the specified URL
 *
 * Handles both relative and absolute URLs
 *
 * @param url - The URL to redirect to
 */
export const redirect = (url: string): void => {
  if (!url) {
    return;
  }

  // Check if it's an external URL
  const isExternal = url.startsWith("http://") || url.startsWith("https://");

  if (isExternal) {
    // External redirect
    window.location.href = url;
  } else if (window.history?.pushState) {
    // Internal redirect (SPA-friendly) with router support
    window.history.pushState({}, "", url);
    // Dispatch a popstate event to notify the router
    window.dispatchEvent(new PopStateEvent("popstate"));
  } else {
    // Fallback for older browsers
    window.location.href = url;
  }
};
