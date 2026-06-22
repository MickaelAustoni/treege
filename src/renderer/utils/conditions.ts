import { Node } from "@xyflow/react";
import { FormValues } from "@/renderer/types/renderer";
import { LOGICAL_OPERATOR } from "@/shared/constants/operator";
import { EdgeCondition } from "@/shared/types/edge";
import { TreegeNodeData } from "@/shared/types/node";
import { LogicalOperator, Operator } from "@/shared/types/operator";
import { isInputNode } from "@/shared/utils/nodeTypeGuards";

/**
 * Normalize values for comparison
 * Handles string/number conversion and edge cases
 */
const normalizeValue = (value: unknown): string | number | boolean | null => {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    // Treat empty strings as null to prevent incorrect numeric comparisons
    // (Number("") returns 0, which would incorrectly pass numeric conditions)
    if (value === "") {
      return null;
    }
    return value;
  }

  // Convert arrays and objects to JSON strings for comparison
  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
};

/**
 * Compare two values using the specified operator
 */
const compareValues = (fieldVal: unknown, condVal: unknown, operator: Operator): boolean => {
  const normalizedFieldVal = normalizeValue(fieldVal);
  const normalizedCondVal = normalizeValue(condVal);

  // Handle null/undefined cases
  if (normalizedFieldVal === null || normalizedCondVal === null) {
    switch (operator) {
      case "===":
        return normalizedFieldVal === normalizedCondVal;
      case "!==":
        return normalizedFieldVal !== normalizedCondVal;
      default:
        return false; // Numeric comparisons with null are false
    }
  }

  // Try numeric comparison first for numeric operators
  if ([">", "<", ">=", "<="].includes(operator)) {
    const numFieldVal = Number(normalizedFieldVal);
    const numCondVal = Number(normalizedCondVal);

    // If both can be converted to valid numbers, use numeric comparison
    if (!(Number.isNaN(numFieldVal) || Number.isNaN(numCondVal))) {
      switch (operator) {
        case ">":
          return numFieldVal > numCondVal;
        case "<":
          return numFieldVal < numCondVal;
        case ">=":
          return numFieldVal >= numCondVal;
        case "<=":
          return numFieldVal <= numCondVal;
        default:
          return false;
      }
    }

    // If numeric comparison is not possible, return false
    return false;
  }

  // Equality operators
  switch (operator) {
    case "===": {
      // Try numeric comparison first
      const numFieldVal = Number(normalizedFieldVal);
      const numCondVal = Number(normalizedCondVal);

      if (!(Number.isNaN(numFieldVal) || Number.isNaN(numCondVal))) {
        return numFieldVal === numCondVal;
      }

      // Fall back to string comparison
      return String(normalizedFieldVal) === String(normalizedCondVal);
    }

    case "!==": {
      // Try numeric comparison first
      const numFieldVal = Number(normalizedFieldVal);
      const numCondVal = Number(normalizedCondVal);

      if (!(Number.isNaN(numFieldVal) || Number.isNaN(numCondVal))) {
        return numFieldVal !== numCondVal;
      }

      // Fall back to string comparison
      return String(normalizedFieldVal) !== String(normalizedCondVal);
    }

    default:
      return false;
  }
};

/**
 * Evaluates a single condition against form values
 * Note: The field parameter can be either a field name OR a node ID
 */
export const evaluateCondition = (
  condition: EdgeCondition,
  formValues: FormValues,
  nodeMap?: Map<string, Node<TreegeNodeData>>,
): boolean => {
  const { field, operator, value } = condition;

  // If condition is incomplete, consider it as always true
  // This allows edges without conditions to always be followed
  if (!(field && operator) || value === undefined) {
    return true;
  }

  // Try to get the field value directly from formValues; if not found and we
  // have a nodeMap, resolve `field` as a node ID and read that node's value.
  const directValue = formValues[field];
  const fallbackNode = directValue === undefined && nodeMap ? nodeMap.get(field) : undefined;
  const fieldValue = fallbackNode && isInputNode(fallbackNode) ? formValues[fallbackNode.id] : directValue;

  // Multi-value fields (checkbox group, multi-select autocomplete) store
  // their value as an array. Match element-wise so a single condition like
  // `field === "Value 1"` succeeds when the user checked that option. The
  // whole-array compare is also kept as a fallback for callers that pass
  // a JSON-stringified expected array.
  if (Array.isArray(fieldValue)) {
    if (operator === "===") {
      return fieldValue.some((item) => compareValues(item, value, "===")) || compareValues(fieldValue, value, "===");
    }
    if (operator === "!==") {
      return fieldValue.every((item) => compareValues(item, value, "!==")) && compareValues(fieldValue, value, "!==");
    }
    return fieldValue.some((item) => compareValues(item, value, operator));
  }

  return compareValues(fieldValue, value, operator);
};

/**
 * Evaluates multiple conditions with logical operators (AND/OR)
 * Returns true if all conditions are met according to their logical operators
 */
export const evaluateConditions = (
  conditions: EdgeCondition[] | undefined,
  formValues: FormValues,
  nodeMap?: Map<string, Node<TreegeNodeData>>,
): boolean => {
  // No conditions means the edge should always be followed
  if (!conditions || conditions.length === 0) {
    return true;
  }

  // Single condition - just evaluate it
  if (conditions.length === 1) {
    return evaluateCondition(conditions[0], formValues, nodeMap);
  }

  // Multiple conditions - evaluate with logical operators
  let result = evaluateCondition(conditions[0], formValues, nodeMap);

  for (let i = 1; i < conditions.length; i += 1) {
    const condition = conditions[i];
    const conditionResult = evaluateCondition(condition, formValues, nodeMap);
    const logicalOperator: LogicalOperator = conditions[i - 1].logicalOperator || LOGICAL_OPERATOR.AND; // The logical operator is stored on the PREVIOUS condition

    if (logicalOperator === LOGICAL_OPERATOR.AND) {
      result = result && conditionResult;
      // Short-circuit: if result is false with AND, no need to continue
      if (!result) {
        return false;
      }
    } else if (logicalOperator === LOGICAL_OPERATOR.OR) {
      result = result || conditionResult;
      // Short-circuit: if result is true with OR, no need to continue
      if (result) {
        return true;
      }
    }
  }

  return result;
};
