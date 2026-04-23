import { Node } from "@xyflow/react";
import { InputNodeData, InputType, TreegeNodeData } from "@/shared/types/node";
import { isInputNode } from "@/shared/utils/nodeTypeGuards";
import { getStaticTranslations, getTranslatedText } from "@/shared/utils/translations";

/**
 * Input types that fall back to the "newAnswer" static translation
 * when no placeholder is defined for the current language.
 */
const TEXTFIELD_INPUT_TYPES: ReadonlySet<InputType> = new Set(["text", "number", "password", "textarea", "time"]);

/**
 * Filter nodes to get only input nodes
 * @param nodes - Array of nodes to filter
 * @returns Array of input nodes only
 */
export const getInputNodes = (nodes: Node<TreegeNodeData>[]): Node<InputNodeData>[] => nodes.filter(isInputNode) as Node<InputNodeData>[];

/**
 * Resolve the key name for an input node using priority: name > label (en) > nodeId
 * This is the single source of truth for key resolution across the application
 * @param node - The input node
 * @returns The resolved key (name, label, or node ID)
 */
export const resolveNodeKey = (node: Node<InputNodeData>): string => {
  // Priority: name > label (en) > first available label > nodeId
  if (node.data.name) {
    return node.data.name;
  }

  if (node.data.label) {
    // Try English first
    if (node.data.label.en) {
      return node.data.label.en;
    }

    // Fallback to first available language
    const firstAvailableLabel = Object.values(node.data.label).find(Boolean);
    if (firstAvailableLabel) {
      return firstAvailableLabel;
    }
  }

  // Final fallback to node ID
  return node.id;
};

/**
 * Resolve the placeholder text for an input, falling back to the static
 * "newAnswer" translation for textfield-like types when the user has not
 * defined a placeholder for the current language.
 * @param data - The input node data
 * @param language - The current language code
 * @returns The resolved placeholder string (empty string if none available)
 */
export const resolveInputPlaceholder = (data: InputNodeData, language: string): string => {
  const inputType = data.type ?? "text";
  const hasPlaceholderForLanguage = !!data.placeholder?.[language];

  if (!hasPlaceholderForLanguage && TEXTFIELD_INPUT_TYPES.has(inputType)) {
    return getStaticTranslations(language)["renderer.defaultInputs.newAnswer"] ?? "";
  }

  return getTranslatedText(data.placeholder, language);
};

/**
 * Get the field name (DOM name attribute) for a given node ID
 * Priority: name > label (en) > nodeId
 * This must match the logic in convertFormValuesToNamedFormat for consistency
 * @param nodeId - The ID of the input node
 * @param nodes - Array of input nodes
 * @returns The field name to use in the DOM, or undefined if node not found
 */
export const getFieldNameFromNodeId = (nodeId: string, nodes: Node<InputNodeData>[]): string | undefined => {
  const node = nodes.find((n) => n.id === nodeId);
  return node ? resolveNodeKey(node) : undefined;
};
