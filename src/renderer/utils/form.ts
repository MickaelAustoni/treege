import { Node } from "@xyflow/react";
import { FormValues } from "@/renderer/types/renderer";
import { resolveNodeKey } from "@/renderer/utils/node";
import { InputNodeData } from "@/shared/types/node";

/**
 * Check if a form field value is considered empty for validation purposes
 * Used for required field validation
 * @param value - The field value to check
 * @returns True if the value is empty (undefined, null, empty string, or empty array)
 */
export const isFieldEmpty = (value: unknown): boolean => {
  if (value === undefined || value === null) {
    return true;
  }
  if (typeof value === "string" && value.trim() === "") {
    return true;
  }
  return Array.isArray(value) && value.length === 0;
};

/**
 * Check if a form field has been filled by the user (presence check)
 * Considers false, 0, and "" as valid filled values
 * Used for conditional edge evaluation in progressive rendering
 * @param fieldName - The name of the form field
 * @param formValues - The current form values
 * @returns True if the field has been filled (any value except undefined/null), false otherwise
 */
export const checkFormFieldHasValue = (fieldName: string | undefined, formValues: FormValues): boolean => {
  if (!fieldName) {
    return false;
  }
  const value = formValues[fieldName];
  return value !== undefined && value !== null;
};

/**
 * Build the initial (nodeId-keyed) form state from consumer-provided values.
 *
 * Consumers can pass `initialValues` keyed either by `node.id` OR by the same
 * key shape they receive back in `onChange`/`onSubmit` (resolved via
 * `resolveNodeKey`: name > label > node.id). This lets an edit screen feed the
 * previously-submitted object straight back in without any remapping.
 *
 * After normalizing provided values, node `defaultValue`s (static / reference)
 * are applied to any field still left unset — matching a fresh mount.
 *
 * @param initialValues - Values provided by the consumer (id- or name-keyed)
 * @param inputNodes - All input nodes of the flow
 * @returns Form values keyed strictly by node id
 */
export const buildInitialFormValues = (initialValues: FormValues, inputNodes: Node<InputNodeData>[]): FormValues => {
  const values: FormValues = {};

  // 1) Normalize provided values: accept both `node.id` and resolved-name keys.
  inputNodes.forEach((node) => {
    if (initialValues[node.id] !== undefined) {
      values[node.id] = initialValues[node.id];
      return;
    }
    const namedKey = resolveNodeKey(node);
    if (initialValues[namedKey] !== undefined) {
      values[node.id] = initialValues[namedKey];
    }
  });

  // 2) Apply node defaults for fields still unset (in node order, so a
  //    reference default can read an earlier field's resolved value).
  inputNodes.forEach((node) => {
    if (values[node.id] !== undefined) {
      return;
    }

    const { defaultValue } = node.data;
    if (!defaultValue) {
      return;
    }

    if (defaultValue.type === "static" && defaultValue.staticValue !== undefined) {
      values[node.id] = defaultValue.staticValue;
    }

    if (defaultValue.type === "reference" && defaultValue.referenceField) {
      const refValue = values[defaultValue.referenceField];
      if (refValue !== undefined) {
        values[node.id] = refValue;
      }
    }
  });

  return values;
};

/**
 * Convert internal form values (keyed by nodeId) to external format (keyed by name)
 * When multiple nodes share the same name, later values overwrite earlier ones
 * Priority for key naming: name > label (en) > nodeId
 * example: convertFormValuesToNamedFormat({ id1: 'Alice', id2: 'Bob' }, [ { id: 'id1', data: { name: 'firstName' } }, { id: 'id2', data: { label: { en: 'Last Name' } } } ])
 * returns { firstName: 'Alice', 'Last Name': 'Bob' }
 */
export const convertFormValuesToNamedFormat = (formValues: FormValues, nodes: Node<InputNodeData>[]): Record<string, unknown> => {
  const exported: Record<string, unknown> = {};

  nodes.forEach((node) => {
    const nodeId = node.id;
    const key = resolveNodeKey(node);

    if (formValues[nodeId] !== undefined) {
      exported[key] = formValues[nodeId];
    }
  });

  return exported;
};

/**
 * Apply transformation to a reference field value
 * @param value - The source value to transform
 * @param transformFunction - The transformation function to apply
 * @param objectMapping - Optional mapping for toObject transformation
 * @returns The transformed value
 */
export const applyReferenceTransformation = (
  value: unknown,
  transformFunction: "toString" | "toNumber" | "toBoolean" | "toArray" | "toObject" | null | undefined,
  objectMapping?: Array<{ sourceKey: string; targetKey: string }>,
): unknown => {
  if (!transformFunction) {
    return value;
  }

  switch (transformFunction) {
    case "toString":
      return String(value);
    case "toNumber":
      return Number(value);
    case "toBoolean":
      if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (["true", "1", "yes", "on"].includes(normalized)) {
          return true;
        }
        if (["false", "0", "no", "off", ""].includes(normalized)) {
          return false;
        }
      }
      if (typeof value === "number") {
        return value !== 0;
      }
      if (typeof value === "boolean") {
        return value;
      }
      return Boolean(value);
    case "toArray":
      return Array.isArray(value) ? value : [value];
    case "toObject":
      if (objectMapping && Array.isArray(objectMapping)) {
        // Return original value if it's not an object
        if (typeof value !== "object" || value === null) {
          return value;
        }
        const result: Record<string, unknown> = {};
        objectMapping.forEach((mapping) => {
          if (mapping.sourceKey && mapping.targetKey) {
            result[mapping.targetKey] = (value as Record<string, unknown>)[mapping.sourceKey];
          }
        });
        return result;
      }
      return value;
    default:
      return value;
  }
};

/**
 * Compare two values for equality, handling objects and arrays by deep comparison
 * @param a - First value to compare
 * @param b - Second value to compare
 * @returns True if values are equal (including deep equality for objects/arrays)
 */
const areValuesEqual = (a: unknown, b: unknown): boolean => {
  if (Object.is(a, b)) {
    return true;
  }
  if (!(a && b) || typeof a !== "object" || typeof b !== "object") {
    return false;
  }
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
};

/**
 * Calculate updated values for fields with reference defaults
 * @param inputNodes - Array of input nodes
 * @param formValues - Current form values
 * @param prevFormValues - Previous form values (for change detection)
 * @returns Object containing fields that need to be updated
 */
export const calculateReferenceFieldUpdates = (
  inputNodes: Node<InputNodeData>[],
  formValues: FormValues,
  prevFormValues: FormValues,
): FormValues => {
  const updatedValues: FormValues = {};

  inputNodes.forEach((node) => {
    const { defaultValue } = node.data;

    if (!defaultValue || defaultValue.type !== "reference" || !defaultValue.referenceField) {
      return;
    }

    const fieldName = node.id;
    const { referenceField, transformFunction, objectMapping } = defaultValue;
    const refValue = formValues[referenceField];
    const prevRefValue = prevFormValues[referenceField];

    // Skip if reference value hasn't changed or is undefined/null
    if (refValue === prevRefValue || refValue === undefined || refValue === null) {
      return;
    }

    // Calculate what the transformed value should be
    const transformedValue = applyReferenceTransformation(refValue, transformFunction, objectMapping);

    // Calculate what the previous transformed value was
    const prevTransformedValue = applyReferenceTransformation(prevRefValue, transformFunction, objectMapping);

    // Check if user has manually edited this field:
    // If the current field value doesn't match the previous transformed value,
    // it means the user has manually changed it, so we should NOT update it
    const currentFieldValue = formValues[fieldName];
    const matchesPrevious = areValuesEqual(currentFieldValue, prevTransformedValue);
    const matchesTransformed = areValuesEqual(currentFieldValue, transformedValue);
    const wasManuallyEdited = !matchesPrevious;

    // Only update if:
    // 1. The field was not manually edited
    // 2. The new transformed value is different from the current value
    if (!(wasManuallyEdited || matchesTransformed)) {
      updatedValues[fieldName] = transformedValue;
    }
  });

  return updatedValues;
};
