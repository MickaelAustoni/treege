import { useCallback, useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTranslate } from "@/renderer/hooks/useTranslate";
import { InputRenderProps } from "@/renderer/types/renderer";
import { SerializableFile } from "@/renderer/utils/file";
import { useTheme } from "@/shared/context/ThemeContext";

type PickResult = {
  uri: string;
  name: string;
  size: number;
  type: string;
};

type PickFunction = (options?: { allowMultiSelection?: boolean; type?: string[] }) => Promise<PickResult[]>;

const DefaultFileInput = ({ node, value, setValue, error, label, helperText }: InputRenderProps<"file">) => {
  const [pick, setPick] = useState<PickFunction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const t = useTranslate();
  const { colors } = useTheme();
  const files: SerializableFile[] = Array.isArray(value) ? value : value ? [value] : [];
  const isMultiple = node.data.multiple;

  const handlePickFile = useCallback(async () => {
    if (!pick) {
      return;
    }

    try {
      const results = await pick({
        allowMultiSelection: isMultiple,
      });

      const newFiles: SerializableFile[] = results.map((result: PickResult) => ({
        data: result.uri,
        lastModified: Date.now(),
        name: result.name,
        size: result.size,
        type: result.type || "application/octet-stream",
      }));

      if (isMultiple) {
        setValue([...files, ...newFiles]);
      } else {
        setValue(newFiles[0] || null);
      }
    } catch (err) {
      if ((err as { code?: string }).code !== "DOCUMENT_PICKER_CANCELED") {
        Alert.alert("Error", t("renderer.defaultInputs.filePickerError"));
      }
    }
  }, [pick, files, isMultiple, setValue, t]);

  const handleRemoveFile = useCallback(
    (index: number) => {
      const newFiles = files.filter((_, i) => i !== index);
      setValue(newFiles.length > 0 ? newFiles : null);
    },
    [files, setValue],
  );

  const formatFileSize = (size: number) => {
    if (size < 1024) {
      return `${size} B`;
    }
    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  /**
   * Lazy-load `react-native-document-picker` once on mount. The package is an
   * optional peer dependency: we resolve it dynamically so consumers who don't
   * use file inputs aren't forced to install it. If the import fails, fall
   * back to the "unavailable" UI rendered below.
   */
  useEffect(() => {
    const loadDocumentPicker = async () => {
      try {
        // @ts-expect-error - Optional peer dependency, may not be installed
        const { pick: pickFunction } = await import("react-native-document-picker");
        setPick(() => pickFunction);
      } catch {
        setPick(null);
      } finally {
        setIsLoading(false);
      }
    };

    void loadDocumentPicker();
  }, []);

  if (isLoading) {
    return null;
  }

  if (!pick) {
    return (
      <View style={styles.container}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {label || node.data.name}
          {node.data.required && <Text style={{ color: colors.error }}>*</Text>}
        </Text>
        <View style={[styles.unavailableContainer, { backgroundColor: colors.errorLight, borderColor: colors.error }]}>
          <Text style={[styles.unavailableText, { color: colors.error }]}>{t("renderer.defaultInputs.filePickerUnavailable")}</Text>
        </View>
        {helperText && <Text style={[styles.helperText, { color: colors.textMuted }]}>{helperText}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        {label || node.data.name}
        {node.data.required && <Text style={{ color: colors.error }}>*</Text>}
      </Text>

      {files.length > 0 && (
        <View style={styles.filesList}>
          {files.map((file, index) => (
            <View key={`${file.name}-${index}`} style={[styles.fileItem, { backgroundColor: colors.card, borderColor: colors.separator }]}>
              <View style={[styles.fileIcon, { backgroundColor: colors.muted }]}>
                <Text style={styles.fileIconText}>📄</Text>
              </View>
              <View style={styles.fileInfo}>
                <Text style={[styles.fileName, { color: colors.text }]} numberOfLines={1}>
                  {file.name}
                </Text>
                {file.size > 0 && <Text style={[styles.fileSize, { color: colors.textMuted }]}>{formatFileSize(file.size)}</Text>}
              </View>
              <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveFile(index)} activeOpacity={0.7}>
                <Text style={[styles.removeButtonText, { color: colors.textMuted }]}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={[styles.pickButton, { backgroundColor: colors.input, borderColor: colors.border }]}
        onPress={handlePickFile}
        activeOpacity={0.7}
      >
        <Text style={[styles.pickButtonText, { color: colors.textMuted }]}>
          {files.length === 0
            ? t(isMultiple ? "renderer.defaultInputs.selectFiles" : "renderer.defaultInputs.selectFile")
            : t(isMultiple ? "renderer.defaultInputs.addMoreFiles" : "renderer.defaultInputs.replaceFile")}
        </Text>
      </TouchableOpacity>

      {error && <Text style={[styles.error, { color: colors.error }]}>{error}</Text>}
      {helperText && !error && <Text style={[styles.helperText, { color: colors.textMuted }]}>{helperText}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  error: {
    fontSize: 12,
    marginTop: 4,
  },
  fileIcon: {
    alignItems: "center",
    borderRadius: 6,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  fileIconText: {
    fontSize: 20,
  },
  fileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  fileItem: {
    alignItems: "center",
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 8,
    padding: 12,
  },
  fileName: {
    fontSize: 14,
    fontWeight: "500",
  },
  fileSize: {
    fontSize: 12,
    marginTop: 2,
  },
  filesList: {
    marginBottom: 12,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  pickButton: {
    alignItems: "center",
    borderRadius: 6,
    borderStyle: "dashed",
    borderWidth: 2,
    justifyContent: "center",
    paddingVertical: 16,
  },
  pickButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  removeButton: {
    padding: 4,
  },
  removeButtonText: {
    fontSize: 18,
  },
  unavailableContainer: {
    alignItems: "center",
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: "center",
    paddingVertical: 16,
  },
  unavailableText: {
    fontSize: 12,
    textAlign: "center",
  },
});

export default DefaultFileInput;
