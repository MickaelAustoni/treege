import { Node } from "@xyflow/react";
import { FormEvent, ReactNode } from "react";
import { SerializableFile } from "@/renderer/utils/file";
import { FlowStep } from "@/renderer/utils/step";
import { Flow, GroupNodeData, HttpHeader, InputNodeData, InputType, TreegeNodeData, UINodeData, UIType } from "@/shared/types/node";

/**
 * Type mapping for input values based on input type
 */
export type InputValueTypeMap = {
  address: string;
  autocomplete: string;
  checkbox: boolean | string[];
  date: string;
  daterange: [string, string] | [string | undefined, string | undefined] | null; // [startDate, endDate]
  file: SerializableFile | SerializableFile[] | null;
  hidden: string;
  http: string | string[];
  number: number | null;
  password: string;
  radio: string;
  select: string | string[];
  submit: undefined;
  switch: boolean;
  text: string;
  textarea: string;
  time: string; // HH:mm format
  timerange: [string, string] | [string | undefined, string | undefined] | null; // [startTime, endTime]
};

/**
 * Form values stored during rendering
 */
export type FormValues = Record<string, any>;

export type Meta = {
  httpResponse?: unknown;
};

/**
 * Union of all possible input value types
 */
export type InputValue =
  | string
  | number
  | boolean
  | string[]
  | SerializableFile
  | SerializableFile[]
  | [string, string]
  | [string | undefined, string | undefined]
  | null
  | undefined;

/**
 * Props for input components with dynamic value typing
 * All form state is provided via props for easier custom component implementation
 */
export type InputRenderProps<T extends InputType = InputType> = {
  /**
   * The node data for this input field
   */
  node: Node<InputNodeData>;
  /**
   * Current value of the input field (typed based on input type when T is specified)
   */
  value: InputValueTypeMap[T];
  /**
   * Unique field ID (nodeId)
   */
  id: string;
  /**
   * Field name (resolved using priority: name > label > nodeId)
   * Use this for the name and id attributes of the input element
   */
  name: string;
  /**
   * Function to update the input value
   * @param value - The new value (typed based on input type when T is specified)
   */
  setValue: (value: InputValueTypeMap[T]) => void;
  /**
   * Validation error message for this field (if any)
   */
  error?: string;
  /**
   * Translated label (already processed with current language)
   */
  label?: string;
  /**
   * Translated placeholder (already processed with current language)
   */
  placeholder?: string;
  /**
   * Translated helper text (already processed with current language)
   */
  helperText?: string;
  /**
   * Missing required fields on form submit (for submit inputs)
   */
  missingRequiredFields?: string[];
  /**
   * Whether the form is currently being submitted (for submit inputs)
   */
  isSubmitting?: boolean;
};

export type UiRenderProps = {
  node: Node<UINodeData>;
};

/**
 * Props for UI/Group components (use useTreegeContext for state)
 */
export type NodeRenderProps = {
  node: Node<TreegeNodeData>;
};

/**
 * Type-safe input renderers mapping
 * Each input type gets its own properly typed InputRenderProps
 */
export type InputRenderers = {
  [K in InputType]?: (props: InputRenderProps<K>) => ReactNode;
};

/**
 * Props passed to a step renderer. Steps are derived at runtime from the flow's
 * groups: each contiguous slice of visible nodes sharing the same `parentId`
 * (or no parent — orphan steps) becomes one step.
 */
export type StepRenderProps = {
  /** The step being rendered (its group id and ordered child nodes). */
  step: FlowStep;
  /** Hidden group node carrying the step's metadata (label) — undefined for orphan steps. */
  groupNode?: Node<GroupNodeData>;
  /** Zero-based index of this step in the current step sequence. */
  stepIndex: number;
  /** Total number of steps currently visible. Recomputes when branching changes. */
  totalSteps: number;
  /** True when this is the first step (Back should be hidden/disabled). */
  isFirstStep: boolean;
  /**
   * True when this is the last visible step. The renderer turns Continue
   * into a submit action on the last step.
   */
  isLastStep: boolean;
  /** Whether all required visible inputs of the step are filled. */
  canContinue: boolean;
  /** Submission in progress (passed through from `useTreegeRenderer`). */
  isSubmitting?: boolean;
  /** Advance to the previous step. No-op on the first step. */
  onBack: () => void;
  /**
   * Advance to the next step (or trigger submit on the last step). The wrapper
   * passes `isLastStep` so the implementation can decide between an in-flow
   * advance and a form submit.
   */
  onContinue: () => void;
  /** Translated label of the group, or empty string for orphan steps. */
  label?: string;
  /** The rendered child nodes belonging to this step. */
  children: ReactNode;
};

/**
 * Custom renderer components
 */
export type TreegeRendererComponents = {
  /**
   * Custom input renderers by input type
   * Each renderer receives properly typed value and setValue based on the input type
   */
  inputs?: InputRenderers;
  /**
   * Custom UI node renderers by UI type
   */
  ui?: Partial<Record<UIType, (props: NodeRenderProps) => ReactNode>>;
  /**
   * Custom step renderer — wraps the current step's nodes and renders the
   * Back/Continue navigation. Defaults are provided by `DefaultStep` (web/native).
   */
  step?: (props: StepRenderProps) => ReactNode;
  /**
   * Custom form wrapper
   */
  form?: (props: { children: ReactNode; onSubmit: (e: FormEvent<HTMLFormElement>) => void }) => ReactNode;
  /**
   * Custom submit button (supports both web and native variants)
   * Web variant: { label?: string; disabled?: boolean; ...otherHTMLAttributes }
   * Native variant: { children?: ReactNode; disabled?: boolean; isSubmitting?: boolean; onPress?: () => void }
   */
  submitButton?: (
    props:
      | {
          // Web variant
          label?: string;
          disabled?: boolean;
          [key: string]: unknown;
        }
      | {
          // Native variant
          children?: ReactNode;
          disabled?: boolean;
          isSubmitting?: boolean;
          onPress?: () => void;
          [key: string]: unknown;
        },
  ) => ReactNode;
  /**
   * Custom submit button wrapper (e.g., for tooltip with missing fields)
   */
  submitButtonWrapper?: (props: { children: ReactNode; missingFields?: string[] }) => ReactNode;
};

/**
 * Configuration options that can be set globally via TreegeConfigProvider
 * or locally via TreegeRenderer config prop
 */
export type TreegeRendererConfig = {
  /**
   * Custom component renderers
   */
  components?: TreegeRendererComponents;
  /**
   * Global HTTP headers applied to every request issued by the renderer
   * (HTTP inputs, submit buttons). Field-level headers with the same key
   * (case-insensitive) take precedence over these.
   */
  headers?: HttpHeader[];
  /**
   * Google Maps API key for address autocomplete
   * If not provided, falls back to free Nominatim (OpenStreetMap)
   */
  googleApiKey?: string;
  /**
   * Current language for translations
   * @default "en"
   */
  language?: string;
  /**
   * Theme for the renderer
   * @default "dark"
   */
  theme?: "dark" | "light";
  /**
   * Validation mode
   * @default "onSubmit"
   */
  validationMode?: "onChange" | "onSubmit";
};

/**
 * Props for the TreegeRenderer component
 *
 * Inherits all configuration fields from TreegeRendererConfig (components,
 * headers, googleApiKey, language, theme, validationMode) and adds the
 * instance-specific ones (flows, callbacks, initial values, etc.).
 */
export interface TreegeRendererProps extends TreegeRendererConfig {
  /**
   * Additional class name for the renderer container
   */
  className?: string;
  /**
   * Flow or array of flows
   * - If a single Flow: renders that flow
   * - If an array: first flow is the main flow, others are sub-flows available for FlowNodes
   */
  flows?: Flow | Flow[] | null;
  /**
   * Initial form values
   */
  initialValues?: FormValues;
  /**
   * Callback when form values change
   */
  onChange?: (values: FormValues) => void;
  /**
   * Callback when form is submitted
   * @param values - Form values (keyed by field name or node ID)
   * @param meta - Optional metadata about the submission (e.g., HTTP response data)
   */
  onSubmit?: (values: FormValues, meta?: Meta) => void;
  /**
   * Custom validation function
   */
  validate?: (values: FormValues, nodes: Node<TreegeNodeData>[]) => Record<string, string>;
}
