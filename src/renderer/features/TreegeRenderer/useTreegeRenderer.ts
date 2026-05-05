import { Node } from "@xyflow/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTreegeConfig } from "@/renderer/context/TreegeConfigContext";
import { useSubmitHandler } from "@/renderer/hooks/useSubmitHandler";
import { useTranslate } from "@/renderer/hooks/useTranslate";
import { FormValues, TreegeRendererProps } from "@/renderer/types/renderer";
import { getFlowRenderState, mergeFlows } from "@/renderer/utils/flow";
import { calculateReferenceFieldUpdates, convertFormValuesToNamedFormat, isFieldEmpty } from "@/renderer/utils/form";
import { mergeHttpHeaders } from "@/renderer/utils/http";
import { getInputNodes } from "@/renderer/utils/node";
import { TreegeNodeData } from "@/shared/types/node";
import { isInputNode } from "@/shared/utils/nodeTypeGuards";

/**
 * Main TreegeRenderer hook
 *
 * Manages all form state, configuration, validation, and submission logic.
 * Can be used directly in custom components for headless mode.
 *
 * Responsibilities:
 * - Config merging (props + global provider)
 * - Form values state (keyed by nodeId)
 * - Errors state
 * - Node visibility calculation (progressive rendering)
 * - Form validation (built-in: required, pattern + custom validation)
 * - Submit handling (with HTTP integration support)
 * - Side effects (onChange callbacks, validation modes, reference field sync)
 *
 * @param props - Configuration props (flows, initialValues, callbacks, etc.)
 * @returns Complete form state and control methods
 */
export const useTreegeRenderer = ({
  components,
  flows,
  googleApiKey,
  headers,
  initialValues = {},
  language,
  onChange,
  onSubmit,
  theme,
  validate,
  validationMode,
}: Pick<
  TreegeRendererProps,
  | "components"
  | "flows"
  | "googleApiKey"
  | "headers"
  | "initialValues"
  | "language"
  | "onChange"
  | "onSubmit"
  | "theme"
  | "validate"
  | "validationMode"
>) => {
  // ============================================
  // CONFIGURATION
  // ============================================

  // Get global config from provider (if any)
  const globalConfig = useTreegeConfig();

  // Merge props with global config (props take precedence)
  const config = useMemo(
    () => ({
      components: {
        form: components?.form ?? globalConfig?.components?.form,
        group: components?.group ?? globalConfig?.components?.group,
        inputs: { ...globalConfig?.components?.inputs, ...components?.inputs },
        submitButton: components?.submitButton ?? globalConfig?.components?.submitButton,
        submitButtonWrapper: components?.submitButtonWrapper ?? globalConfig?.components?.submitButtonWrapper,
        ui: { ...globalConfig?.components?.ui, ...components?.ui },
      },
      googleApiKey: googleApiKey ?? globalConfig?.googleApiKey,
      headers: mergeHttpHeaders(globalConfig?.headers, headers),
      language: language ?? globalConfig?.language ?? "en",
      theme: theme ?? globalConfig?.theme ?? "dark",
      validationMode: validationMode ?? globalConfig?.validationMode ?? "onSubmit",
    }),
    [components, globalConfig, googleApiKey, headers, language, theme, validationMode],
  );

  // ============================================
  // FLOW AND NODE STATE
  // ============================================

  const mergedFlow = useMemo(() => mergeFlows(flows), [flows]);
  const { nodes, edges } = mergedFlow;
  const inputNodes = useMemo(() => getInputNodes(nodes), [nodes]);
  const t = useTranslate(config.language);
  const prevFormValuesRef = useRef<FormValues>({});

  // ============================================
  // FORM STATE
  // ============================================

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formValues, setFormValues] = useState<FormValues>(() => {
    const defaultValues: FormValues = { ...initialValues };

    nodes.forEach((node) => {
      if (isInputNode(node)) {
        const fieldName = node.id;

        if (defaultValues[fieldName] !== undefined) {
          return;
        }

        const { defaultValue } = node.data;
        if (!defaultValue) {
          return;
        }

        // Handle static default value
        if (defaultValue.type === "static" && defaultValue.staticValue !== undefined) {
          defaultValues[fieldName] = defaultValue.staticValue;
        }

        // Handle reference default value
        if (defaultValue.type === "reference" && defaultValue.referenceField) {
          const { referenceField } = defaultValue;
          const refValue = defaultValues[referenceField];
          if (refValue !== undefined) {
            defaultValues[fieldName] = refValue;
          }
        }
      }
    });

    return defaultValues;
  });

  const { endOfPathReached, visibleNodes, visibleRootNodes } = useMemo(
    () => getFlowRenderState(nodes, edges, formValues),
    [nodes, edges, formValues],
  );

  // ============================================
  // SUBMIT HANDLER
  // ============================================

  // Submit handler for submit button with HTTP configuration
  const { clearSubmitMessage, handleSubmitWithConfig, hasSubmitConfig, isSubmitting, submitMessage } = useSubmitHandler(
    visibleNodes,
    formValues,
    config.language,
    inputNodes,
    config.headers,
  );

  // ============================================
  // REFS FOR CALLBACKS
  // ============================================

  const onChangeRef = useRef(onChange);
  const validateRef = useRef(validate);

  // Memoize exported values for callbacks
  const exportedValues = useMemo(() => convertFormValuesToNamedFormat(formValues, inputNodes), [formValues, inputNodes]);

  // ============================================
  // FORM CONTROL METHODS
  // ============================================

  /**
   * Set field value and clear error for that field
   */
  const setFieldValue = useCallback((fieldName: string, value: unknown) => {
    setFormValues((prev) => ({
      ...prev,
      [fieldName]: value,
    }));

    // Clear error when user types
    setFormErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  /**
   * Batch update multiple field values at once (for performance)
   * Use this when updating multiple fields to avoid multiple re-renders
   */
  const setMultipleFieldValues = useCallback((updates: FormValues) => {
    if (Object.keys(updates).length === 0) {
      return;
    }

    setFormValues((prev) => ({
      ...prev,
      ...updates,
    }));

    // Clear errors for updated fields
    setFormErrors((prev) => {
      const newErrors = { ...prev };
      Object.keys(updates).forEach((fieldName) => {
        delete newErrors[fieldName];
      });
      return newErrors;
    });
  }, []);

  /**
   * Validate form with both built-in and custom validation
   * Custom errors take precedence over built-in errors when both exist
   *
   * @param customValidate - Optional custom validation function
   * @returns Validation result with isValid flag and errors object
   */
  const validateForm = useCallback(
    (customValidate?: (values: FormValues, visibleNodesList: Node<TreegeNodeData>[]) => Record<string, string>) => {
      // Step 1: Run built-in validation (required, pattern)
      const builtInErrors: Record<string, string> = {};

      visibleNodes.forEach((node) => {
        if (isInputNode(node)) {
          const fieldName = node.id;
          const value = formValues[fieldName];

          // Required validation
          if (node.data.required && isFieldEmpty(value)) {
            builtInErrors[fieldName] = t(node.data.errorMessage) || t("validation.required");
            return;
          }

          // Pattern validation (only if value is not empty)
          if (!isFieldEmpty(value) && node.data.pattern) {
            try {
              const regex = new RegExp(node.data.pattern);
              if (!regex.test(String(value))) {
                builtInErrors[fieldName] = t(node.data.errorMessage) || t("validation.invalidFormat");
              }
            } catch (e) {
              console.error(`Invalid pattern for field ${fieldName}:`, e);
            }
          }
        }
      });

      // Step 2: Run custom validation if provided
      const customErrors = customValidate ? customValidate(formValues, visibleNodes) : {};

      // Step 3: Merge errors - custom errors take precedence
      const finalErrors = {
        ...builtInErrors,
        ...customErrors,
      };

      // Step 4: Update form errors state
      setFormErrors(finalErrors);

      // Step 5: Return validation result
      return {
        errors: finalErrors,
        hasCustomErrors: Object.keys(customErrors).length > 0,
        isValid: Object.keys(finalErrors).length === 0,
      };
    },
    [visibleNodes, formValues, t],
  );

  /**
   * Handle form submission
   * @returns {Promise<boolean>} Returns true if validation passed, false otherwise
   */
  const handleSubmit = useCallback(async (): Promise<boolean> => {
    // Validate the form
    const { isValid } = validateForm(validateRef.current);

    if (!isValid) {
      return false;
    }

    // If there's a submit button with configuration, use it
    if (hasSubmitConfig) {
      const result = await handleSubmitWithConfig((httpResponse) => {
        // Call onSubmit callback with form values and HTTP response as second parameter
        if (onSubmit) {
          onSubmit(exportedValues, { httpResponse });
        }
      });

      // If result is null, it means the submit config is incomplete (no URL)
      // Fall back to the default submit behavior
      if (result === null) {
        onSubmit?.(exportedValues);
        return true;
      }

      // If submission failed, return early
      if (!result.success) {
        return true; // Validation passed but submission failed
      }
    } else if (onSubmit) {
      // Default behavior: call onSubmit directly
      onSubmit(exportedValues);
    }

    return true;
  }, [validateForm, hasSubmitConfig, handleSubmitWithConfig, onSubmit, exportedValues]);

  // ============================================
  // COMPUTED VALUES
  // ============================================

  /**
   * Get list of missing required fields for tooltip
   * Returns array of field labels that are required but not filled
   */
  const missingRequiredFields = useMemo(() => {
    const missing: string[] = [];

    visibleNodes.forEach((node) => {
      if (!isInputNode(node)) {
        return;
      }

      const fieldName = node.id;
      const value = formValues[fieldName];

      // Check if required field is empty
      if (node.data.required && isFieldEmpty(value)) {
        const label = t(node.data.label) || fieldName;
        missing.push(label);
      }
    });

    return missing;
  }, [visibleNodes, formValues, t]);

  /**
   * Check if there's a submit input node in the visible nodes
   */
  const hasSubmitInput = useMemo(() => visibleNodes.some((node) => isInputNode(node) && node.data.type === "submit"), [visibleNodes]);

  /**
   * Get the first field with an error (for focus/scroll)
   * Returns the field ID or undefined if no errors
   */
  const firstErrorFieldId = useMemo(() => {
    const errorKeys = Object.keys(formErrors);
    return errorKeys.length > 0 ? errorKeys[0] : undefined;
  }, [formErrors]);

  // ============================================
  // SIDE EFFECTS
  // ============================================

  /**
   * Keep onChange ref updated
   */
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  /**
   * Keep validate ref updated
   */
  useEffect(() => {
    validateRef.current = validate;
  }, [validate]);

  /**
   * Trigger onChange callback when form values change
   */
  useEffect(() => {
    onChangeRef.current?.(exportedValues);
  }, [exportedValues]);

  /**
   * Run validation on form values change if validationMode is "onChange"
   */
  useEffect(() => {
    if (config.validationMode === "onChange") {
      validateForm(validateRef.current);
    }
  }, [config.validationMode, validateForm]);

  /**
   * Sync reference fields when their source changes (one-way binding)
   * Note: prevFormValuesRef is intentionally not in deps (refs don't trigger re-renders)
   */
  useEffect(() => {
    const updatedValues = calculateReferenceFieldUpdates(inputNodes, formValues, prevFormValuesRef.current);

    // Only update if there are changes to avoid unnecessary function calls
    if (Object.keys(updatedValues).length > 0) {
      setMultipleFieldValues(updatedValues);
    }

    // Update previous values ref
    prevFormValuesRef.current = formValues;
  }, [formValues, inputNodes, setMultipleFieldValues]);

  // ============================================
  // RETURN VALUES
  // ============================================

  return {
    canSubmit: !hasSubmitInput && endOfPathReached && nodes.length > 0,
    clearSubmitMessage,
    config,
    firstErrorFieldId,
    formErrors,
    formValues,
    handleSubmit,
    inputNodes,
    isSubmitting,
    mergedFlow,
    missingRequiredFields,
    prevFormValuesRef,
    setFieldErrors: setFormErrors,
    setFieldValue,
    setMultipleFieldValues,
    submitMessage,
    t,
    validateForm,
    visibleNodes,
    visibleRootNodes,
  };
};

/**
 * Type for the return value of useTreegeRenderer
 * Useful for TypeScript users building custom components
 */
export type UseTreegeRendererReturn = ReturnType<typeof useTreegeRenderer>;
