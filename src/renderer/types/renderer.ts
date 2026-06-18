import { Node } from "@xyflow/react";
import { ComponentType, FormEvent, ReactNode } from "react";
import { SerializableFile } from "@/renderer/utils/file";
import { FlowStep } from "@/renderer/utils/step";
import {
  Flow,
  GroupNodeData,
  HttpHeaders,
  InputNodeData,
  InputOption,
  InputType,
  TreegeNodeData,
  UINodeData,
  UIType,
} from "@/shared/types/node";

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
 * A field the input's dynamic options depend on that is not yet filled.
 */
export type MissingDependency = {
  /**
   * The referenced node id.
   */
  id: string;
  /**
   * The referenced field's translated, end-user-facing label.
   */
  label: string;
};

/**
 * HTML-spreadable props for an input control — safe to spread directly onto a
 * DOM element: `<input {...field} />`. Intentionally excludes `label`,
 * `helperText`, and `error` (not valid DOM attributes); those live in
 * `InputExtraProps`.
 */
export type InputFieldProps<T extends InputType = InputType> = {
  /**
   * Unique field id (nodeId). Use for the element `id`.
   */
  id: string;
  /**
   * Field name (resolved using priority: name > label > nodeId).
   */
  name: string;
  /**
   * Current value of the input (typed by input type when T is specified).
   */
  value: InputValueTypeMap[T];
  /**
   * Translated placeholder (already processed with current language).
   */
  placeholder?: string;
  /**
   *  Whether the field is required.
   */
  required?: boolean;
  /**
   * Set when the field has a validation error.
   */
  "aria-invalid"?: boolean;
};

/**
 * Treege-specific props that are NOT DOM attributes: state setters, resolved
 * translations, validation and runtime metadata. Passed as the second argument
 * of an input renderer so the first one (`InputFieldProps`) stays spreadable.
 */
export type InputExtraProps<T extends InputType = InputType> = {
  /**
   * The node data for this input field.
   */
  node: Node<InputNodeData>;
  /**
   * Function to update the input value.
   * @param value - The new value (typed by input type when T is specified)
   */
  setValue: (value: InputValueTypeMap[T]) => void;
  /**
   * Validation error message for this field (if any).
   */
  error?: string;
  /** Translated label (already processed with current language). */
  label?: string;
  /**
   * Resolved input label component: the consumer's `components.inputLabel` when
   * provided, otherwise the platform `DefaultInputLabel`. Default inputs render
   * it as `<InputLabel label={label} required={node.data.required} htmlFor={id} />`;
   * it renders nothing when no label is configured. Exposed so custom input
   * renderers can reuse the same (overridable) label.
   */
  InputLabel: InputLabelRenderer;
  /**
   * Translated helper text (already processed with current language).
   */
  helperText?: string;
  /**
   * Fields this input's dynamic options depend on that are not yet filled
   * (its unresolved `{{nodeId}}` template variables). Empty when none — use it
   * to hint the user which fields to complete before this input can load.
   */
  missingDependencies: MissingDependency[];
  /**
   * Missing required fields on form submit (for submit inputs).
   */
  missingRequiredFields?: string[];
  /**
   * Whether the form is currently being submitted (for submit inputs).
   */
  isSubmitting?: boolean;
  /**
   * Editor-only extension slot: when provided, option-based renderers (radio,
   * checkbox) call this for each option to paint inline extras next to it
   * (e.g. value preview, edit / delete buttons). `variant` is a renderer-side
   * layout hint (e.g. `"card"` for radio cards). Returning `null` skips the
   * slot for that option. Left undefined in runtime so the renderers stay
   * runtime-pure.
   */
  renderOptionExtras?: (option: { option: InputOption; index: number; variant?: string }) => ReactNode;
  /**
   * Editor-only layout flag. When `true`, option-based renderers force their
   * option labels to a single truncated line (block + max-w-full + truncate)
   * and reserve room on the right for the `renderOptionExtras` overlay.
   * Defaults to `false` (multi-line, runtime-pure).
   */
  compactOptions?: boolean;
};

/**
 * Props passed to an input renderer: the spreadable `field` props (DOM-safe, so
 * `field` can be spread onto a control — `<input {...field} />`) and the Treege
 * `extra` props (state setters, translations, metadata).
 */
export type InputRenderProps<T extends InputType = InputType> = {
  field: InputFieldProps<T>;
  extra: InputExtraProps<T>;
};

/**
 * An input renderer — a React component, so it can use hooks and is rendered
 * directly (`<Renderer field={field} extra={extra} />`) without a wrapper.
 */
export type InputRenderer<T extends InputType = InputType> = ComponentType<InputRenderProps<T>>;

export type UiRenderProps = {
  node: Node<UINodeData>;
};

/**
 * Props for the input label component shared by all default input renderers.
 * `label` + `required` are platform-agnostic; the remaining fields are
 * passthrough hints for the platform (web: `htmlFor`/`id`/`className`,
 * native: `style`). Implementations should render nothing when `label` is empty
 * so the technical node key never leaks into the form.
 */
export type InputLabelRenderProps = {
  /** End-user-facing label. Render nothing when empty. */
  label?: string;
  /** Whether to render the required marker. */
  required?: boolean;
  /** Web: associates the label with the control. */
  htmlFor?: string;
  /** Web: id used for `aria-labelledby` on option groups. */
  id?: string;
  /** Web: extra class names. */
  className?: string;
  /** Native: extra style (typed loosely to avoid a react-native dependency here). */
  style?: unknown;
};

/** Input label component (custom `components.inputLabel` or the platform default). */
export type InputLabelRenderer = ComponentType<InputLabelRenderProps>;

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
  [K in InputType]?: InputRenderer<K>;
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
   * Whether a Back button should be shown. True on any step past the first, and
   * also on the first step when the consumer passes an `onBack` prop (to bridge
   * back-navigation to an outer flow, e.g. a parent modal's steps). Prefer this
   * over `isFirstStep` to decide whether to render the Back control.
   */
  canGoBack: boolean;
  /**
   * True when this is the last visible step. The renderer turns Continue
   * into a submit action on the last step.
   */
  isLastStep: boolean;
  /** Whether all required visible inputs of the step are filled. */
  canContinue: boolean;
  /**
   * True when the step contains an explicit `submit` input node. Such a node is
   * declarative — it renders no button itself; the step renders the single
   * submit button (reusing the node's label). Exposed for custom step
   * implementations that need to know a submit node is present.
   */
  hasSubmitInput?: boolean;
  /**
   * Translated labels of the current step's required fields still empty. Lines
   * up with `canContinue`, so the action button can show a tooltip explaining
   * why Continue/Submit is disabled — on every step, not just the last.
   */
  missingFields?: string[];
  /** Submission in progress (passed through from `useTreegeRenderer`). */
  isSubmitting?: boolean;
  /**
   * Go back: advances to the previous step, or — on the first step, when the
   * consumer passed an `onBack` prop — invokes that callback instead. No-op on
   * the first step when no `onBack` prop was provided.
   */
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
   * Custom input label, shared by every default input renderer. Receives
   * `{ label, required, ...platformProps }` and should render nothing when
   * `label` is empty. Defaults to `DefaultInputLabel` (web/native).
   */
  inputLabel?: InputLabelRenderer;
  /**
   * Custom step renderer — wraps the current step's nodes and renders the
   * Back/Continue navigation. Defaults are provided by `DefaultStep` (web/native).
   */
  step?: (props: StepRenderProps) => ReactNode;
  /**
   * Custom form wrapper. `id` (when provided via the `formId` prop) should be
   * forwarded to the underlying `<form>` element to keep external submit
   * buttons working.
   */
  form?: (props: { children: ReactNode; id?: string; onSubmit: (e: FormEvent<HTMLFormElement>) => void }) => ReactNode;
  /**
   * Custom submit button (supports both web and native variants)
   * Web variant: { label?: string; disabled?: boolean; isSubmitting?: boolean; ...otherHTMLAttributes }
   * Native variant: { children?: ReactNode; disabled?: boolean; isSubmitting?: boolean; onPress?: () => void }
   */
  submitButton?: (
    props:
      | {
          // Web variant
          label?: string;
          disabled?: boolean;
          isSubmitting?: boolean;
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
  /**
   * Custom loading skeleton, rendered in place of the form while the
   * `isLoading` prop is true. Defaults to `DefaultLoadingSkeleton` (web).
   */
  loadingSkeleton?: () => ReactNode;
};

/**
 * Configuration options that can be set globally via TreegeRendererProvider
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
   *
   * @example
   * headers={{ Authorization: `Bearer ${accessToken}` }}
   */
  headers?: HttpHeaders;
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
  /**
   * Whether to display the "Powered by Treege" credit at the bottom of the form.
   * @default true
   */
  showPoweredBy?: boolean;
  /**
   * Base URL prepended to every **relative** HTTP url issued by the renderer
   * (HTTP inputs, dynamic options, and submit). Use this to keep the tree
   * JSON environment-agnostic — store relative paths in the tree and supply
   * the host here per environment:
   *
   * @example
   * // In the tree: "url": "/v2/entities/{{nodeId}}/sub-entities"
   * <TreegeRenderer flow={tree} baseUrl={import.meta.env.VITE_API_URL} />
   *
   * Absolute urls (starting with `http://` or `https://`) are left untouched,
   * so a field can still point at an external API. Template variables are
   * resolved first, then the base URL is applied to the result.
   */
  baseUrl?: string;
};

/**
 * Props for the TreegeRenderer component
 *
 * Inherits all configuration fields from TreegeRendererConfig (components,
 * headers, googleApiKey, language, theme, validationMode) and adds the
 * instance-specific ones (flow, callbacks, initial values, etc.).
 */
export interface TreegeRendererProps extends TreegeRendererConfig {
  /**
   * Additional class name for the renderer container
   */
  className?: string;
  /**
   * Flow to render. `null` / `undefined` renders nothing.
   */
  flow?: Flow | null;
  /**
   * Sets the `id` attribute on the underlying `<form>` element, so a submit
   * button rendered outside the renderer can target it via the native HTML
   * `form` attribute: `<button type="submit" form={formId}>`. Web only.
   */
  formId?: string;
  /**
   * Initial form values — use this to pre-fill the form when editing a record
   * that was already submitted.
   *
   * Keys can be either `node.id` OR the same name-based keys you receive back in
   * `onChange` / `onSubmit`, so the previously-submitted object can be fed
   * straight back in without any remapping.
   *
   * Reactive: if this changes after mount (e.g. an async-fetched record resolves
   * later), the form is re-seeded automatically. A new object literal of
   * identical content does NOT reset the form, so in-progress user edits are
   * preserved.
   */
  initialValues?: FormValues;
  /**
   * When true, renders a loading skeleton instead of the form. Useful while
   * the flow is being fetched. Customizable via `components.loadingSkeleton`.
   */
  isLoading?: boolean;
  /**
   * When true, forces the submit/continue button into its loading state
   * (spinner + disabled). Use this to keep the button busy while an async
   * `onSubmit` is still resolving on the consumer side. It is OR-ed with the
   * renderer's own internal submitting state, so it only ever adds to it.
   */
  isSubmitting?: boolean;
  /**
   * Called when the user clicks Back on the FIRST step. Provide this to bridge
   * back-navigation to an outer flow (e.g. a parent modal's steps): when set, a
   * Back button is shown on the first step and triggers this callback instead
   * of being a no-op. Has no effect on later steps, which always navigate back
   * internally.
   */
  onBack?: () => void;
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
