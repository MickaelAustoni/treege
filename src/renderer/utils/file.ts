import type { SerializableFile } from "@/shared/types/file";

export type { SerializableFile };

/**
 * Converts a File object to a serializable format with base64 data
 */
export const fileToSerializable = (file: File): Promise<SerializableFile> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const base64 = reader.result as string;
      resolve({
        data: base64,
        lastModified: file.lastModified,
        name: file.name,
        size: file.size,
        type: file.type,
      });
    };

    reader.onerror = () => {
      reject(new Error(`Failed to read file: ${file.name}`));
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Converts a SerializableFile back to a File object
 */
export const serializableToFile = (serializable: SerializableFile): File => {
  // Extract base64 data (remove data URL prefix like "data:image/png;base64,")
  const base64Data = serializable.data.split(",")[1];
  const byteString = atob(base64Data);
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const uint8Array = new Uint8Array(arrayBuffer);

  for (let i = 0; i < byteString.length; i++) {
    uint8Array[i] = byteString.charCodeAt(i);
  }

  const blob = new Blob([arrayBuffer], { type: serializable.type });

  return new File([blob], serializable.name, {
    lastModified: serializable.lastModified,
    type: serializable.type,
  });
};

/**
 * Converts multiple File objects to serializable format
 */
export const filesToSerializable = (files: File[]): Promise<SerializableFile[]> => {
  return Promise.all(files.map((file) => fileToSerializable(file)));
};

/**
 * Derive a readable file name from a URL's last path segment (query/hash stripped).
 */
export const fileNameFromUrl = (url: string): string => {
  try {
    const { pathname } = new URL(url, "http://_");
    const last = pathname.split("/").filter(Boolean).pop();
    return last ? decodeURIComponent(last) : url;
  } catch {
    return url;
  }
};

/**
 * Whether a file's `data` is a URL to fetch/link to (an http(s) or relative
 * path) rather than inline base64/blob content. Useful to decide whether to
 * render the file as a clickable link or resolve it against a base URL.
 */
export const isRemoteFileData = (data: string | null | undefined): boolean =>
  !!data && !data.startsWith("data:") && !data.startsWith("blob:");

/**
 * Normalizes a file field value into an array of `SerializableFile`.
 * Handles a single file, an array, and empty (`null`/`undefined`) values. A
 * stored document may also be referenced by a bare URL string (or an array
 * containing some) — those are coerced into a `SerializableFile` whose `data`
 * holds the URL and whose `name` is derived from it.
 */
export const normalizeSerializableFiles = (
  value: SerializableFile | string | Array<SerializableFile | string> | null | undefined,
): SerializableFile[] => {
  const entries = Array.isArray(value) ? value : value == null ? [] : [value];

  return entries.flatMap((entry) => {
    if (typeof entry === "string") {
      return entry.trim() === "" ? [] : [{ data: entry, lastModified: 0, name: fileNameFromUrl(entry), size: 0, type: "" }];
    }
    return [entry];
  });
};

/**
 * Formats a byte size into a human-readable string (B / KB / MB)
 */
export const formatFileSize = (size: number): string => {
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};
