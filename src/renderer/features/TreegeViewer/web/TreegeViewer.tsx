import { File as FileIcon } from "lucide-react";
import { ReactNode, useMemo } from "react";
import { useTreegeRendererConfig } from "@/renderer/context/TreegeRendererProvider";
import RendererStyles from "@/renderer/features/TreegeRenderer/web/components/styles/RendererStyles";
import {
  FlowResponseEntry,
  getViewerFields,
  isImageFile,
  ViewerField,
  viewerFieldsFromResponse,
} from "@/renderer/features/TreegeViewer/utils/viewerFields";
import { FormValues } from "@/renderer/types/renderer";
import { Badge } from "@/shared/components/ui/badge";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { ThemeProvider } from "@/shared/context/ThemeContext";
import { cn } from "@/shared/lib/utils";
import { SerializableFile } from "@/shared/types/file";
import { Flow, InputType } from "@/shared/types/node";

/**
 * Read-only rendering of a single uploaded file: an inline thumbnail for images
 * (click to open full size), a labelled download link for anything else. Files
 * with no `data` (URL/base64) fall back to their name as plain text.
 */
const ViewerFile = ({ file }: { file: SerializableFile }): ReactNode => {
  if (!file.data) {
    return <span className="tg:wrap-break-word tg:text-foreground tg:text-sm">{file.name}</span>;
  }

  if (isImageFile(file)) {
    return (
      <a href={file.data} target="_blank" rel="noreferrer" title={file.name} className="tg:inline-flex">
        <img src={file.data} alt={file.name} className="tg:size-16 tg:rounded tg:border tg:object-cover" />
      </a>
    );
  }

  return (
    <a
      href={file.data}
      download={file.name}
      title={file.name}
      className="tg:inline-flex tg:items-center tg:gap-1.5 tg:rounded tg:border tg:px-2 tg:py-1 tg:text-foreground tg:text-sm tg:no-underline tg:hover:bg-accent"
    >
      <FileIcon className="tg:size-4 tg:shrink-0" />
      <span className="tg:break-all">{file.name}</span>
    </a>
  );
};

/** Per-type override map: `{ file: (field) => <Thumbnails /> }`. */
export type ViewerFieldRenderers = Partial<Record<InputType, (field: ViewerField) => ReactNode>>;

interface TreegeViewerBaseProps {
  /**
   * Language used to resolve translatable labels/options (defaults to the provider config, then `en`).
   */
  language?: string;
  /**
   * Light/dark theme. Falls back to the `TreegeRendererProvider` config, then `"dark"`.
   */
  theme?: "light" | "dark";
  /**
   * Base URL to resolve relative file paths into absolute URLs. `data:`/`blob:`/absolute URLs are left untouched.
   */
  baseUrl?: string;
  /**
   *  Field names (or ids) to hide from the view.
   */
  excludedFields?: string[];
  /**
   * Hide fields that have no submitted value (instead of showing `emptyText`).
   */
  excludeEmptyFields?: boolean;
  /**
   *  When `true`, only the first `collapsedVisibleCount` fields are rendered.
   */
  collapsed?: boolean;
  /**
   * Number of fields kept visible while `collapsed` (defaults to all).
   */
  collapsedVisibleCount?: number;
  /**
   * Text shown when a field has no submitted value (defaults to `"—"`).
   */
  emptyText?: string;
  /**
   * Extra class names on the root element.
   */
  className?: string;
  /**
   * Per-type rendering overrides for the value cell. Use this for app-specific
   * cases — typically `file` (e.g. render thumbnails from your own storage)
   * while every other type keeps its built-in rendering.
   */
  renderField?: ViewerFieldRenderers;
  /**
   * Wrap or replace a whole field row (label + value). Receives the resolved
   * field and the default row node; return your own layout or the default.
   */
  renderRow?: (field: ViewerField, defaultRow: ReactNode) => ReactNode;
}

/**
 * `flowResponse` is typed conditionally on `flow`:
 * - **with** a `flow` → the renderer's `FormValues` (`name`- or `id`-keyed), resolved against the flow;
 * - **without** a `flow` → a self-describing `FlowResponseEntry[]` (each carries its own
 *   `name`/`type`/`value`/`label`), rendered as-is.
 */
export type TreegeViewerProps = TreegeViewerBaseProps &
  (
    | {
        /**
         * The flow the values were submitted against.
         */
        flow: Flow;
        /** The submitted values as the renderer's `FormValues` (`name`- or `id`-keyed). */
        flowResponse: FormValues;
      }
    | {
        flow?: undefined;
        /**
         * Self-describing stored values rendered without a flow.
         */
        flowResponse: FlowResponseEntry[];
      }
  );

/**
 * Default rendering of a single field's value, by display kind.
 */
const DefaultValue = ({ field, emptyText }: { field: ViewerField; emptyText: string }): ReactNode => {
  const { display } = field;

  switch (display.kind) {
    case "empty":
      return <span className="tg:text-muted-foreground tg:text-sm">{emptyText}</span>;

    case "boolean":
      return <Checkbox checked={display.checked} disabled aria-readonly className="tg:cursor-default" />;

    case "tags":
      return (
        <div className="tg:flex tg:flex-wrap tg:gap-1">
          {display.tags.map((tag, index) => (
            <Badge key={`${tag}-${index}`} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      );

    case "files":
      return (
        <div className="tg:flex tg:flex-wrap tg:gap-2">
          {display.files.map((file, index) => (
            <ViewerFile key={`${file.name}-${index}`} file={file} />
          ))}
        </div>
      );

    default:
      return <p className="tg:wrap-break-word tg:whitespace-pre-wrap tg:text-foreground tg:text-sm">{display.text}</p>;
  }
};

/**
 * Read-only viewer for a submitted Treege form. Given the `flow` and the
 * submitted `values`, it renders every reachable field as a label/value pair —
 * resolving option labels, formatting dates/ranges and i18n labels the same way
 * the renderer does, scoped to the active branch.
 *
 * Styling matches the renderer (shadcn/Tailwind, `tg:` prefix). For values that
 * need app-specific rendering (chiefly uploaded `file`s) pass `renderField`; to
 * change the whole row layout pass `renderRow`.
 *
 * @example
 * // With a flow — `flowResponse` is the renderer's FormValues:
 * <TreegeViewer flow={flow} flowResponse={submitted} language="fr" excludeEmptyFields />
 *
 * // Without a flow — `flowResponse` is a self-describing list:
 * <TreegeViewer flowResponse={[{ name: "city", type: "text", value: "Paris", label: { en: "City" } }]} />
 */
const TreegeViewer = ({
  flow,
  flowResponse,
  baseUrl,
  theme,
  excludedFields,
  excludeEmptyFields,
  collapsed,
  collapsedVisibleCount,
  className,
  renderField,
  renderRow,
  language,
  emptyText = "—",
}: TreegeViewerProps) => {
  // Theme, baseUrl and language fall back to the (optional) provider config, so a
  // `TreegeViewerProvider` can supply them once for every viewer underneath.
  const globalConfig = useTreegeRendererConfig();
  const resolvedTheme = theme ?? globalConfig?.theme ?? "dark";
  const resolvedBaseUrl = baseUrl ?? globalConfig?.baseUrl;
  const resolvedLanguage = language ?? globalConfig?.language ?? "en";

  // With a flow, resolve against it; without, render the self-describing response as-is.
  const fields = useMemo(
    () =>
      flow
        ? getViewerFields(flow, flowResponse as FormValues, { baseUrl: resolvedBaseUrl, language: resolvedLanguage })
        : viewerFieldsFromResponse(flowResponse as FlowResponseEntry[], { baseUrl: resolvedBaseUrl, language: resolvedLanguage }),
    [flow, flowResponse, resolvedLanguage, resolvedBaseUrl],
  );

  const visibleFields = useMemo(
    () =>
      fields.filter(
        (field) =>
          !(
            excludedFields?.includes(field.name) ||
            excludedFields?.includes(field.id) ||
            (excludeEmptyFields && field.display.kind === "empty")
          ),
      ),
    [fields, excludedFields, excludeEmptyFields],
  );

  const renderFieldRow = (field: ViewerField) => {
    const override = renderField?.[field.type];
    const value = override ? override(field) : <DefaultValue field={field} emptyText={emptyText} />;

    const row = (
      <div className="tg:flex tg:flex-col tg:gap-1">
        <dt className="tg:font-medium tg:text-muted-foreground tg:text-sm">{field.label}</dt>
        <dd className="tg:m-0">{value}</dd>
      </div>
    );

    return <div key={field.id}>{renderRow ? renderRow(field, row) : row}</div>;
  };

  // Fields past `collapsedVisibleCount` stay mounted but their wrapper animates its
  // height (grid-rows 0fr → 1fr) so collapsing/expanding transitions smoothly.
  const visibleCount = collapsedVisibleCount ?? visibleFields.length;
  const headFields = visibleFields.slice(0, visibleCount);
  const collapsibleFields = visibleFields.slice(visibleCount);
  const isCollapsed = Boolean(collapsed) && collapsibleFields.length > 0;

  return (
    <ThemeProvider theme={resolvedTheme} storageKey="treege-renderer-theme">
      <RendererStyles />
      <dl className={cn("tg:flex tg:flex-col tg:gap-4", className)}>
        {headFields.map(renderFieldRow)}

        {collapsibleFields.length > 0 && (
          <div
            className={cn(
              "tg:grid tg:transition-[grid-template-rows] tg:duration-300 tg:ease-in-out",
              isCollapsed ? "tg:grid-rows-[0fr]" : "tg:grid-rows-[1fr]",
            )}
          >
            <div className="tg:overflow-hidden">
              <div className="tg:flex tg:flex-col tg:gap-4">{collapsibleFields.map(renderFieldRow)}</div>
            </div>
          </div>
        )}
      </dl>
    </ThemeProvider>
  );
};

export default TreegeViewer;
