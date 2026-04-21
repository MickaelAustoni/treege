import { LogicalOperator, Operator } from "@/shared/types/operator";

export type EdgeCondition = {
  /**
   * The field to evaluate in the condition
   */
  field?: string;
  /**
   * The operator to use for comparison (e.g., "===", "!==", ">", "<", ">=", "<=")
   */
  operator?: Operator;
  /**
   * The value to compare against the field
   */
  value?: string;
  /**
   * The logical operator to combine this condition with the next one (e.g., "AND", "OR")
   */
  logicalOperator?: LogicalOperator;
};

export type ConditionalEdgeData = {
  /**
   *  A label for the edge, useful for displaying in the UI
   */
  label?: string;
  /**
   * Conditions that must be met for this edge to be followed
   */
  conditions?: EdgeCondition[];
  /**
   * Whether this edge is a fallback/default path
   * Fallback edges are followed when no other conditional edges match
   */
  isFallback?: boolean;
  /**
   * Set to `true` the first time the user commits a change through the
   * condition editor. Used only by the editor for visual state — the
   * renderer ignores it.
   */
  configured?: boolean;
};
