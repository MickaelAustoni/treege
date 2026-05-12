import { Node } from "@xyflow/react";
import { GroupNodeData, InputNodeData, TreegeNode, UINodeData } from "@/shared/types/node";

/**
 * Type guard to check if a node is an InputNode
 * @param node
 */
export const isInputNode = (node: TreegeNode | undefined): node is Node<InputNodeData, "input"> => node?.type === "input";

/**
 * Type guard to check if a node is a UINode
 * @param node
 */
export const isUINode = (node: TreegeNode | undefined): node is Node<UINodeData, "ui"> => node?.type === "ui";

/**
 * Type guard to check if a node is a GroupNode
 * @param node
 */
export const isGroupNode = (node: TreegeNode | undefined): node is Node<GroupNodeData, "group"> => node?.type === "group";
