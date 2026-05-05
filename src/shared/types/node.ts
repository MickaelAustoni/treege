import { Edge, Node } from "@xyflow/react";
import { INPUT_TYPE } from "@/shared/constants/inputType";
import { UI_TYPE } from "@/shared/constants/uiType";
import { Translatable } from "@/shared/types/translate";

export type UIType = (typeof UI_TYPE)[keyof typeof UI_TYPE];
export type InputType = (typeof INPUT_TYPE)[keyof typeof INPUT_TYPE];

export interface Flow {
  id: string;
  nodes: Node[];
  edges: Edge[];
}

export type InputOption = {
  /**
   * The value of the option, which will be submitted if selected
   */
  value: string;
  /**
   * The label of the option, which can be translated
   */
  label: Translatable;
  /**
   * Optional secondary description, shown under the label (translatable)
   */
  description?: Translatable;
  /**
   * Whether the option is disabled and cannot be selected
   */
  disabled?: boolean;
  /**
   * Optional image for the option, stored as base64 data URL or remote URL.
   * Currently displayed by radio inputs; uploads are automatically resized and compressed.
   */
  image?: string;
};

export type BaseNodeData = {
  /**
   * A label for the node, which can be translated
   */
  label?: Translatable;
};

export type FlowNodeData = BaseNodeData & {
  /**
   * The ID of the target node to connect to
   */
  targetId?: string;
};

export type GroupNodeData = BaseNodeData & {
  /**
   * A label for the group node, which can be translated
   */
  label: Translatable;
};

export type HttpHeader = {
  /**
   * The header key (e.g., "Authorization", "Content-Type")
   */
  key: string;
  /**
   * The header value
   */
  value: string;
};

export type HttpConfig = {
  /**
   * The HTTP method to use
   */
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  /**
   * The API URL to call (supports template variables like {{fieldId}})
   */
  url?: string;
  /**
   * Custom headers for the HTTP request
   */
  headers?: HttpHeader[];
  /**
   * Request body (for POST/PUT/PATCH methods)
   */
  body?: string;
  /**
   * If true, automatically sends all form data as JSON body (overrides custom body)
   */
  sendAllFormValues?: boolean;
  /**
   * JSONPath or key to extract from the response
   * Examples: "data.users", "results[0].name"
   */
  responsePath?: string;
  /**
   * Map response to options format (for select/combobox)
   */
  responseMapping?: {
    /**
     * Path to the value field in response items
     */
    valueField?: string;
    /**
     * Path to the label field in response items
     */
    labelField?: string;
  };
  /**
   * Query parameter name for search (enables combobox with search)
   * Example: "q", "search", "query"
   */
  searchParam?: string;
  /**
   * Whether to call the API on component mount
   */
  fetchOnMount?: boolean;
  /**
   * Whether to show a loading state while fetching
   */
  showLoading?: boolean;
};

export type SubmitConfig = {
  /**
   * The HTTP method to use for form submission
   */
  method?: "POST" | "PUT" | "PATCH" | "DELETE";
  /**
   * The API URL to call on submit (supports template variables like {{fieldId}})
   */
  url?: string;
  /**
   * Custom headers for the HTTP request
   */
  headers?: HttpHeader[];
  /**
   * Request body (for POST/PUT/PATCH methods, supports template variables like {{fieldId}})
   * Strings are automatically quoted, use: {"name": {{userName}}}
   */
  body?: string;
  /**
   * If true, automatically sends all form data as JSON body (overrides custom body)
   */
  sendAllFormValues?: boolean;
  /**
   * URL to redirect to after successful submission (supports template variables from response)
   */
  redirectUrl?: string;
  /**
   * Success message to display after successful submission (translatable)
   */
  successMessage?: Translatable;
  /**
   * Error message to display if submission fails (translatable)
   */
  errorMessage?: Translatable;
  /**
   * Whether to show a loading state while submitting
   */
  showLoading?: boolean;
};

export type InputNodeData = BaseNodeData & {
  /**
   * The name of the input field, used for identification and form submission
   */
  name?: string;
  /**
   * The type of input field (e.g., "text", "number", "select", "checkbox")
   */
  type?: InputType;
  /**
   * A sublabel for the input field, which can be translated
   */
  helperText?: Translatable;
  /**
   * Placeholder text for the input field, which can be translated
   */
  placeholder?: Translatable;
  /**
   * Whether the input field is required
   */
  required?: boolean;
  /**
   * A regex pattern that the input value must match
   */
  pattern?: string;
  /**
   * An error message to display if validation fails, which can be translated
   */
  errorMessage?: Translatable;
  /**
   * Options for select, radio, or checkbox input types
   */
  options?: InputOption[];
  /**
   * Whether multiple selections are allowed (for select and checkbox types)
   */
  multiple?: boolean;
  /**
   * Visual variant (currently used by radio inputs)
   */
  variant?: "default" | "card";
  /**
   * Whether past dates should be disabled (for date and daterange types)
   */
  disablePast?: boolean;
  /**
   * The default value config for the input field
   */
  defaultValue?: null | {
    type?: "static" | "reference";
    staticValue?: string | string[] | boolean;
    referenceField?: string;
    transformFunction?: null | "toString" | "toNumber" | "toBoolean" | "toArray" | "toObject";
    objectMapping?: Array<{
      sourceKey: string;
      targetKey: string;
    }>;
  };
  /**
   * HTTP configuration for the input field (used with type="http")
   */
  httpConfig?: HttpConfig;
  /**
   * Submit configuration for the input field (used with type="submit")
   */
  submitConfig?: SubmitConfig;
  /**
   * Optional illustrative image displayed above the input label.
   * Stored as a base64 data URL (uploads are resized/compressed) or a remote URL.
   */
  image?: string;
};

export type UINodeData = BaseNodeData & {
  /**
   * The type of UI component to render (e.g., "button", "text", "image")
   */
  type?: UIType;
};

/**
 * Union type representing all possible node data types in the Treege system
 */
export type TreegeNodeData = InputNodeData | UINodeData | FlowNodeData | GroupNodeData;

/**
 * A TreegeNode represents a node in the flowchart with specific data and properties
 */
export type TreegeNode = Node<TreegeNodeData>;
