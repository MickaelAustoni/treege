import { File as FileIcon } from "lucide-react";
import { ReactNode, useMemo } from "react";
import { getViewerFields, isImageFile, ViewerField } from "@/renderer/features/TreegeViewer/utils/viewerFields";
import { FormValues } from "@/renderer/types/renderer";
import { Badge } from "@/shared/components/ui/badge";
import { Checkbox } from "@/shared/components/ui/checkbox";
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

export interface TreegeViewerProps {
  /**
   * The flow the values were submitted against
   */
  flow: Flow;
  /**
   * The submitted values (`name`- or `id`-keyed, e.g. the `onSubmit` payload).
   */
  values: FormValues;
  /**
   *  Language used to resolve translatable labels/options (defaults to `en`).
   */
  language?: string;
  /**
   * Base URL used to resolve relative file paths into absolute URLs — same role
   * as on `TreegeRenderer`/`TreegeEditor`. `data:`/`blob:`/absolute URLs are
   * left untouched.
   */
  baseUrl?: string;
  /**
   * Field names (or ids) to hide from the view.
   */
  excludedFields?: string[];
  /**
   * Hide fields that have no submitted value (instead of showing `emptyText`).
   * Useful to render a compact recap of only the filled-in fields.
   */
  excludeEmptyFields?: boolean;
  /**
   * Text shown when a field has no submitted value (defaults to `"—"`).
   */
  emptyText?: string;
  /**
   * Extra class names on the root element. *
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
 * <TreegeViewer
 *   flow={flow}
 *   values={submitted}
 *   language="fr"
 *   excludedFields={["internalNote"]}
 *   renderField={{ file: ({ rawValue }) => <Thumbnails files={rawValue} /> }}
 * />
 */
const TreegeViewer = ({
  flow,
  values,
  baseUrl,
  excludedFields,
  excludeEmptyFields,
  className,
  renderField,
  renderRow,
  emptyText = "—",
  language = "en",
}: TreegeViewerProps) => {
  const fields = useMemo(() => getViewerFields(flow, values, { baseUrl, language }), [flow, values, language, baseUrl]);

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

  return (
    <dl className={cn("tg:flex tg:flex-col tg:gap-4", className)}>
      {visibleFields.map((field) => {
        const override = renderField?.[field.type];
        const value = override ? override(field) : <DefaultValue field={field} emptyText={emptyText} />;

        const row = (
          <div className="tg:flex tg:flex-col tg:gap-1">
            <dt className="tg:font-medium tg:text-muted-foreground tg:text-sm">{field.label}</dt>
            <dd className="tg:m-0">{value}</dd>
          </div>
        );

        return <div key={field.id}>{renderRow ? renderRow(field, row) : row}</div>;
      })}
    </dl>
  );
};

export default TreegeViewer;
