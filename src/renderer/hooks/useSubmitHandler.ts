import { Node } from "@xyflow/react";
import { useCallback, useMemo, useState } from "react";
import { FormValues } from "@/renderer/types/renderer";
import { redirect, SubmitResult, submitFormData } from "@/renderer/utils/submit";
import { HttpHeader, InputNodeData, TreegeNodeData } from "@/shared/types/node";
import { isInputNode } from "@/shared/utils/nodeTypeGuards";
import { getTranslatedText } from "@/shared/utils/translations";

/**
 * Hook for handling form submission with submit button configuration
 *
 * This hook provides:
 * - Submit button node detection
 * - HTTP submission handling
 * - Loading state management
 * - Success/error message handling
 * - Redirect handling
 *
 * @param visibleNodes - Currently visible nodes in the form
 * @param formValues - Current form values
 * @param language - Current language for translations
 * @param inputNodes - All input nodes for form data conversion
 * @param headers
 * @returns Submit handler state and functions
 */
export const useSubmitHandler = (
  visibleNodes: Node<TreegeNodeData>[],
  formValues: FormValues,
  language: string,
  inputNodes: Node<InputNodeData>[],
  headers?: HttpHeader[],
) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: "success" | "error"; message: string } | null>(null);

  /**
   * Find the submit button node and its configuration
   */
  const submitButtonNode = useMemo(() => {
    const node = visibleNodes.find((n) => isInputNode(n) && n.data?.type === "submit");
    if (!(node && isInputNode(node))) {
      return null;
    }
    return node as { id: string; data: InputNodeData };
  }, [visibleNodes]);

  /**
   * Handle form submission with submit button configuration
   */
  const handleSubmitWithConfig = useCallback(
    async (onSuccess?: (data: unknown) => void): Promise<SubmitResult | null> => {
      // If no submit button with config, return null (use default submit behavior)
      if (!submitButtonNode?.data?.submitConfig) {
        return null;
      }

      const config = submitButtonNode.data.submitConfig;

      // If no URL is configured or URL is empty/whitespace, return null (use default behavior)
      if (!config.url || config.url.trim() === "") {
        return null;
      }

      // Clear any previous messages
      setSubmitMessage(null);

      // Show loading state if configured
      if (config.showLoading !== false) {
        setIsSubmitting(true);
      }

      try {
        // Perform the HTTP submission
        const result = await submitFormData(config, formValues, inputNodes, headers);

        if (result.success) {
          // Show success message if configured
          const successMsg = getTranslatedText(config.successMessage, language);
          if (successMsg) {
            setSubmitMessage({ message: successMsg, type: "success" });
          }

          // Call onSuccess callback if provided
          if (onSuccess) {
            onSuccess(result.data);
          }

          // Redirect if configured
          if (result.redirectUrl) {
            const redirectUrl = result.redirectUrl;
            setTimeout(() => redirect(redirectUrl), 1000);
          }
        } else {
          // Show error message
          const errorMsg = getTranslatedText(config.errorMessage, language) || result.error || "An error occurred during submission";
          setSubmitMessage({ message: errorMsg, type: "error" });
        }

        return result;
      } catch (error) {
        // Handle unexpected errors
        const errorMsg =
          getTranslatedText(config.errorMessage, language) || (error instanceof Error ? error.message : "An unexpected error occurred");
        setSubmitMessage({ message: errorMsg, type: "error" });

        return {
          error: errorMsg,
          success: false,
        };
      } finally {
        setIsSubmitting(false);
      }
    },
    [submitButtonNode, formValues, language, inputNodes, headers],
  );

  /**
   * Clear submit message
   */
  const clearSubmitMessage = useCallback(() => {
    setSubmitMessage(null);
  }, []);

  return {
    clearSubmitMessage,
    handleSubmitWithConfig,
    hasSubmitConfig: Boolean(submitButtonNode?.data?.submitConfig),
    isSubmitting,
    submitButtonNode,
    submitMessage,
  };
};
