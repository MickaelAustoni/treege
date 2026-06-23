import { File as FileIcon, Upload, X } from "lucide-react";
import { ChangeEvent, useRef } from "react";
import useTranslate from "@/editor/hooks/useTranslate";
import { filesToSerializable, fileToSerializable, formatFileSize, normalizeSerializableFiles } from "@/renderer/utils/file";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { SerializableFile } from "@/shared/types/file";

type DefaultFileValueFieldProps = {
  id: string;
  multiple?: boolean;
  value: SerializableFile | SerializableFile[] | null | undefined;
  onChange: (value: SerializableFile | SerializableFile[] | null) => void;
};

/**
 * Editor control for configuring a static default value on a `file` input.
 * Lets a non-dev pick one or more files visually, see them listed, and remove
 * them — producing `SerializableFile` objects stored in `defaultValue.staticValue`.
 */
const DefaultFileValueField = ({ id, multiple, value, onChange }: DefaultFileValueFieldProps) => {
  const t = useTranslate();
  const inputRef = useRef<HTMLInputElement>(null);
  const files = normalizeSerializableFiles(value);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const { files: selected } = e.target;

    if (!selected || selected.length === 0) {
      return;
    }

    if (multiple) {
      const serializableFiles = await filesToSerializable(Array.from(selected));
      onChange([...files, ...serializableFiles]);
    } else {
      const serializableFile = await fileToSerializable(selected[0]);
      onChange(serializableFile);
    }

    e.target.value = "";
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    onChange(newFiles.length > 0 ? newFiles : null);
  };

  return (
    <div className="tg:flex tg:flex-col tg:gap-2">
      <Label htmlFor={id}>{t("editor.inputNodeForm.staticValue")}</Label>

      {files.length > 0 && (
        <ul className="tg:flex tg:flex-col tg:gap-2">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="tg:flex tg:items-center tg:gap-2 tg:rounded-md tg:border tg:bg-card tg:px-3 tg:py-2 tg:text-sm"
            >
              <FileIcon className="tg:size-4 tg:shrink-0 tg:text-muted-foreground" />
              <span className="tg:flex-1 tg:truncate" title={file.name}>
                {file.name}
              </span>
              {file.size > 0 && <span className="tg:shrink-0 tg:text-muted-foreground tg:text-xs">{formatFileSize(file.size)}</span>}
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => handleRemoveFile(index)}
                aria-label={t("renderer.defaultInputs.removeFile")}
              >
                <X className="tg:size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <input ref={inputRef} type="file" id={id} className="tg:hidden" onChange={handleFileChange} multiple={multiple} />

      <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
        <Upload className="tg:size-4" />
        {files.length === 0
          ? t(multiple ? "renderer.defaultInputs.selectFiles" : "renderer.defaultInputs.selectFile")
          : t(multiple ? "renderer.defaultInputs.addMoreFiles" : "renderer.defaultInputs.replaceFile")}
      </Button>
    </div>
  );
};

export default DefaultFileValueField;
