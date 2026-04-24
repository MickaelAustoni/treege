import { Edge, Node } from "@xyflow/react";
import { ReactNode } from "react";
import { AIConfig } from "@/editor/types/ai";
import { Flow } from "@/shared/types/node";

export interface ExtraMenuItem {
  /**
   * Label displayed in the menu item.
   */
  label: ReactNode;
  /**
   * Optional icon rendered before the label.
   */
  icon?: ReactNode;
  /**
   * Callback triggered when the menu item is clicked.
   */
  onClick?: () => void;
  /**
   * When true, styles the item as destructive.
   */
  destructive?: boolean;
}

export interface TreegeEditorProps {
  /**
   * Default flow structure containing combined nodes and edges.
   * Note: Individual defaultNodes/defaultEdges props take precedence over this.
   */
  flow?: Flow | null;
  /**
   * Callback function triggered when exporting JSON data.
   */
  onExportJson?: () => { nodes: Node[]; edges: Edge[] } | undefined;
  /**
   * Callback function triggered when saving the flow data.
   * @param data
   */
  onSave?: (data: Flow) => void;
  /**
   * Theme for the editor interface.
   */
  theme?: "dark" | "light";
  /**
   * Language for the editor interface.
   */
  language?: string;
  /**
   * AI configuration for tree generation
   */
  aiConfig?: AIConfig;
  /**
   * Additional CSS class names for custom styling.
   */
  className?: string;
  /**
   * Extra menu items to append to the "more" dropdown of the actions panel.
   */
  extraMenuItems?: ExtraMenuItem[];
}
