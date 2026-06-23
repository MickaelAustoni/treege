/**
 * Represents a serializable file object.
 *
 * `data` holds the file content as a base64 data-URL on web, or a file URI on
 * native. This shape is used both as a runtime file-input value and as an
 * editor-configurable default value for `file` inputs.
 */
export interface SerializableFile {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  data: string; // base64 data-URL (web) or file URI (native)
}
