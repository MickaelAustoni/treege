import { describe, expect, it } from "vitest";
import {
  fileNameFromUrl,
  filesToSerializable,
  fileToSerializable,
  isRemoteFileData,
  normalizeSerializableFiles,
  serializableToFile,
} from "@/renderer/utils/file";

describe("File Utils", () => {
  describe("fileToSerializable", () => {
    it("should convert File to SerializableFile", async () => {
      const file = new File(["hello world"], "test.txt", { lastModified: 1234567890, type: "text/plain" });

      const result = await fileToSerializable(file);

      expect(result.name).toBe("test.txt");
      expect(result.type).toBe("text/plain");
      expect(result.lastModified).toBe(1234567890);
      expect(result.size).toBe(11);
      expect(result.data).toContain("data:text/plain;base64,");
    });

    it("should handle empty file", async () => {
      const file = new File([], "empty.txt", { type: "text/plain" });

      const result = await fileToSerializable(file);

      expect(result.name).toBe("empty.txt");
      expect(result.size).toBe(0);
      expect(result.data).toBeDefined();
    });

    it("should preserve file metadata", async () => {
      const lastModified = Date.now();
      const file = new File(["content"], "document.pdf", { lastModified, type: "application/pdf" });

      const result = await fileToSerializable(file);

      expect(result.name).toBe("document.pdf");
      expect(result.type).toBe("application/pdf");
      expect(result.lastModified).toBe(lastModified);
    });

    it("should handle different file types", async () => {
      const imageFile = new File([new Uint8Array([137, 80, 78, 71])], "image.png", { type: "image/png" });

      const result = await fileToSerializable(imageFile);

      expect(result.type).toBe("image/png");
      expect(result.data).toContain("data:image/png;base64,");
    });
  });

  describe("serializableToFile", () => {
    it("should convert SerializableFile back to File", async () => {
      const originalFile = new File(["test content"], "test.txt", { lastModified: 1234567890, type: "text/plain" });
      const serialized = await fileToSerializable(originalFile);

      const restoredFile = serializableToFile(serialized);

      expect(restoredFile.name).toBe("test.txt");
      expect(restoredFile.type).toBe("text/plain");
      expect(restoredFile.lastModified).toBe(1234567890);
      expect(restoredFile.size).toBeGreaterThan(0);
    });

    it("should preserve file content through serialization", async () => {
      const content = "Hello, World!";
      const originalFile = new File([content], "message.txt", { type: "text/plain" });
      const serialized = await fileToSerializable(originalFile);

      const restoredFile = serializableToFile(serialized);
      const restoredContent = await restoredFile.text();

      expect(restoredContent).toBe(content);
    });

    it("should handle binary data", async () => {
      const binaryData = new Uint8Array([0, 1, 2, 3, 255]);
      const originalFile = new File([binaryData], "binary.bin", { type: "application/octet-stream" });
      const serialized = await fileToSerializable(originalFile);

      const restoredFile = serializableToFile(serialized);
      const restoredBuffer = await restoredFile.arrayBuffer();
      const restoredArray = new Uint8Array(restoredBuffer);

      expect(restoredArray).toEqual(binaryData);
    });

    it("should handle special characters in filename", async () => {
      const originalFile = new File(["content"], "file-with-special_chars (1).txt", { type: "text/plain" });
      const serialized = await fileToSerializable(originalFile);

      const restoredFile = serializableToFile(serialized);

      expect(restoredFile.name).toBe("file-with-special_chars (1).txt");
    });
  });

  describe("filesToSerializable", () => {
    it("should convert multiple files to serializable format", async () => {
      const file1 = new File(["content 1"], "file1.txt", { type: "text/plain" });
      const file2 = new File(["content 2"], "file2.txt", { type: "text/plain" });
      const files = [file1, file2];

      const result = await filesToSerializable(files);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("file1.txt");
      expect(result[1].name).toBe("file2.txt");
    });

    it("should handle empty array", async () => {
      const result = await filesToSerializable([]);

      expect(result).toEqual([]);
    });

    it("should handle single file array", async () => {
      const file = new File(["content"], "single.txt", { type: "text/plain" });

      const result = await filesToSerializable([file]);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("single.txt");
    });

    it("should preserve order of files", async () => {
      const files = [
        new File(["a"], "a.txt", { type: "text/plain" }),
        new File(["b"], "b.txt", { type: "text/plain" }),
        new File(["c"], "c.txt", { type: "text/plain" }),
      ];

      const result = await filesToSerializable(files);

      expect(result[0].name).toBe("a.txt");
      expect(result[1].name).toBe("b.txt");
      expect(result[2].name).toBe("c.txt");
    });
  });

  describe("Round-trip Conversion", () => {
    it("should maintain data integrity through multiple conversions", async () => {
      const content = "Important data that must not be corrupted!";
      const originalFile = new File([content], "critical.txt", { lastModified: 9999999, type: "text/plain" });

      // First conversion
      const serialized1 = await fileToSerializable(originalFile);
      const restored1 = serializableToFile(serialized1);

      // Second conversion (to test stability)
      const serialized2 = await fileToSerializable(restored1);
      const restored2 = serializableToFile(serialized2);

      const finalContent = await restored2.text();

      expect(finalContent).toBe(content);
      expect(restored2.name).toBe("critical.txt");
      expect(restored2.type).toBe("text/plain");
    });
  });

  describe("Edge Cases", () => {
    it("should handle file with no extension", async () => {
      const file = new File(["content"], "README", { type: "text/plain" });

      const serialized = await fileToSerializable(file);
      const restored = serializableToFile(serialized);

      expect(restored.name).toBe("README");
    });

    it("should handle file with multiple dots in name", async () => {
      const file = new File(["content"], "archive.tar.gz", { type: "application/gzip" });

      const serialized = await fileToSerializable(file);
      const restored = serializableToFile(serialized);

      expect(restored.name).toBe("archive.tar.gz");
    });

    it("should handle very long filenames", async () => {
      const longName = `${"a".repeat(255)}.txt`;
      const file = new File(["content"], longName, { type: "text/plain" });

      const serialized = await fileToSerializable(file);
      const restored = serializableToFile(serialized);

      expect(restored.name).toBe(longName);
    });

    it("should handle files with no specified type", async () => {
      const file = new File(["content"], "unknown", { type: "" });

      const serialized = await fileToSerializable(file);

      expect(serialized.type).toBe("");
      expect(serialized.data).toBeDefined();
    });
  });

  describe("fileNameFromUrl", () => {
    it("derives the name from the last path segment", () => {
      expect(fileNameFromUrl("https://cdn.example.com/files/report.pdf")).toBe("report.pdf");
    });

    it("ignores query and hash", () => {
      expect(fileNameFromUrl("https://cdn.example.com/a/b/photo.png?token=x#frag")).toBe("photo.png");
    });

    it("handles relative paths and decodes the name", () => {
      expect(fileNameFromUrl("uploads/my%20doc.pdf")).toBe("my doc.pdf");
    });
  });

  describe("isRemoteFileData", () => {
    it("is true for http(s) and relative URLs", () => {
      expect(isRemoteFileData("https://x/y.png")).toBe(true);
      expect(isRemoteFileData("uploads/y.png")).toBe(true);
    });

    it("is false for data:/blob: and empty values", () => {
      expect(isRemoteFileData("data:image/png;base64,AA")).toBe(false);
      expect(isRemoteFileData("blob:https://x/abc")).toBe(false);
      expect(isRemoteFileData("")).toBe(false);
      expect(isRemoteFileData(undefined)).toBe(false);
    });
  });

  describe("normalizeSerializableFiles", () => {
    it("wraps a single file and passes arrays through", () => {
      const file = { data: "data:x", lastModified: 0, name: "a.txt", size: 1, type: "text/plain" };
      expect(normalizeSerializableFiles(file)).toEqual([file]);
      expect(normalizeSerializableFiles([file])).toEqual([file]);
    });

    it("returns an empty array for empty values", () => {
      expect(normalizeSerializableFiles(null)).toEqual([]);
      expect(normalizeSerializableFiles(undefined)).toEqual([]);
      expect(normalizeSerializableFiles("")).toEqual([]);
      expect(normalizeSerializableFiles([])).toEqual([]);
    });

    it("coerces a URL string into a SerializableFile with a derived name", () => {
      expect(normalizeSerializableFiles("https://cdn.example.com/files/report.pdf")).toEqual([
        { data: "https://cdn.example.com/files/report.pdf", lastModified: 0, name: "report.pdf", size: 0, type: "" },
      ]);
    });

    it("coerces a mix of URL strings and files", () => {
      const file = { data: "data:x", lastModified: 0, name: "a.txt", size: 1, type: "text/plain" };
      const result = normalizeSerializableFiles(["https://x/photo.png", file]);
      expect(result).toEqual([{ data: "https://x/photo.png", lastModified: 0, name: "photo.png", size: 0, type: "" }, file]);
    });
  });
});
