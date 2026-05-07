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
import { computeSteps } from "@/renderer/utils/step";
import { GroupNodeData, TreegeNodeData } from "@/shared/types/node";
import { isGroupNode, isInputNode } from "@/shared/utils/nodeTypeGuards";

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
        inputs: { ...globalConfig?.components?.inputs, ...components?.inputs },
        step: components?.step ?? globalConfig?.components?.step,
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
  // STEP STATE (group → step navigation)
  // ============================================

  const steps = useMemo(() => computeSteps(visibleNodes), [visibleNodes]);

  /** Resolve the (possibly hidden) group node corresponding to a step's groupId. */
  const groupNodeMap = useMemo(() => {
    const map = new Map<string, Node<GroupNodeData>>();
    nodes.forEach((node) => {
      if (isGroupNode(node)) {
        map.set(node.id, node);
      }
    });
    return map;
  }, [nodes]);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const safeStepIndex = steps.length === 0 ? 0 : Math.min(currentStepIndex, steps.length - 1);
  const currentStep = steps[safeStepIndex];
  const currentStepGroupNode = currentStep?.groupId ? groupNodeMap.get(currentStep.groupId) : undefined;
  const isFirstStep = safeStepIndex === 0;
  const isLastStep = steps.length === 0 || safeStepIndex >= steps.length - 1;

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
   * Move forward in the step machine: advance the index, or trigger submit if
   * we're already on the last step. Triggering Continue when `canContinueStep`
   * is false is a no-op (the button should be disabled in the UI).
   */
  const goToNextStep = useCallback(() => {
    setCurrentStepIndex((prev) => {
      if (prev >= steps.length - 1) {
        return prev;
      }
      return prev + 1;
    });
  }, [steps.length]);

  const goToPreviousStep = useCallback(() => {
    setCurrentStepIndex((prev) => Math.max(0, prev - 1));
  }, []);

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
   * Whether the user can advance past the current step:
   * every required input that is *currently visible inside the step* must be filled.
   * Conditional edges that reveal new required fields inside the same step
   * naturally flip this back to false, gating the Continue button.
   */
  const canContinueStep = useMemo(() => {
    if (!currentStep) {
      return false;
    }
    return currentStep.nodes.every((node) => {
      if (!isInputNode(node)) {
        return true;
      }
      if (!node.data.required) {
        return true;
      }
      // Submit-type inputs handle their own action; don't gate Continue on them.
      if (node.data.type === "submit") {
        return true;
      }
      return !isFieldEmpty(formValues[node.id]);
    });
  }, [currentStep, formValues]);

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
   * Clamp the current step index against the (potentially shrinking) `steps`
   * array — branching can collapse later steps when the user goes back and
   * changes a value.
   */
  useEffect(() => {
    if (steps.length === 0) {
      if (currentStepIndex !== 0) {
        setCurrentStepIndex(0);
      }
      return;
    }
    if (currentStepIndex > steps.length - 1) {
      setCurrentStepIndex(steps.length - 1);
    }
  }, [steps.length, currentStepIndex]);

  /**
   * Mirror the latest `onChange` callback into a ref so the value-change
   * effect below can fire it without resubscribing on every render when the
   * caller passes a fresh function reference each render.
   */
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  /**
   * Mirror the latest `validate` callback into a ref for the same reason as
   * the `onChange` ref above — keeps the validation effect stable.
   */
  useEffect(() => {
    validateRef.current = validate;
  }, [validate]);

  /**
   * Notify the consumer (`props.onChange`) whenever the externally-shaped
   * form values change. `exportedValues` is memoized, so this only fires on
   * actual value changes.
   */
  useEffect(() => {
    onChangeRef.current?.(exportedValues);
  }, [exportedValues]);

  /**
   * In `onChange` validation mode, re-run validation whenever form values
   * change so errors update live as the user types. Skipped in `onSubmit`
   * mode where validation only runs on submit.
   */
  useEffect(() => {
    if (config.validationMode === "onChange") {
      validateForm(validateRef.current);
    }
  }, [config.validationMode, validateForm]);

  /**
   * One-way reference-field binding: when an input is configured to mirror
   * another field, propagate the source value into the dependent field
   * whenever the source changes. Uses `prevFormValuesRef` (intentionally
   * not in deps — refs don't trigger renders) to detect which sources
   * actually changed since the last render.
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
    canContinueStep,
    canSubmit: !hasSubmitInput && endOfPathReached && nodes.length > 0,
    clearSubmitMessage,
    config,
    currentStep,
    currentStepGroupNode,
    currentStepIndex: safeStepIndex,
    firstErrorFieldId,
    formErrors,
    formValues,
    goToNextStep,
    goToPreviousStep,
    handleSubmit,
    hasSubmitInput,
    inputNodes,
    isFirstStep,
    isLastStep,
    isSubmitting,
    mergedFlow,
    missingRequiredFields,
    prevFormValuesRef,
    setFieldErrors: setFormErrors,
    setFieldValue,
    setMultipleFieldValues,
    steps,
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
