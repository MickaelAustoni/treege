import { File as FileIcon, FileUp, X } from "lucide-react";
import { ChangeEvent, useRef } from "react";
import { useTranslate } from "@/renderer/hooks/useTranslate";
import { InputRenderProps } from "@/renderer/types/renderer";
import {
  filesToSerializable,
  fileToSerializable,
  formatFileSize,
  isRemoteFileData,
  normalizeSerializableFiles,
} from "@/renderer/utils/file";
import { Button } from "@/shared/components/ui/button";
import { FormDescription, FormError, FormItem } from "@/shared/components/ui/form";

const DefaultFileInput = ({ field, extra }: InputRenderProps<"file">) => {
  const { id, name, value } = field;
  const { InputLabel, node, setValue, error, label, helperText } = extra;
  const t = useTranslate();
  const inputRef = useRef<HTMLInputElement>(null);
  const files = normalizeSerializableFiles(value);
  const isMultiple = node.data.multiple;

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const { files: selected } = e.target;

    if (!selected || selected.length === 0) {
      return;
    }

    if (isMultiple) {
      const serializableFiles = await filesToSerializable(Array.from(selected));
      setValue([...files, ...serializableFiles]);
    } else {
      const serializableFile = await fileToSerializable(selected[0]);
      setValue(serializableFile);
    }

    // Reset the native input so selecting the same file again still fires `change`
    e.target.value = "";
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setValue(newFiles.length > 0 ? newFiles : null);
  };

  return (
    <FormItem className="tg:mb-4">
      <InputLabel htmlFor={id} label={label} required={node.data.required} />

      {files.length > 0 && (
        <ul className="tg:flex tg:flex-col tg:gap-2">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="tg:flex tg:items-center tg:gap-2 tg:rounded-md tg:border tg:bg-card tg:px-3 tg:py-2 tg:text-sm"
            >
              <FileIcon className="tg:size-4 tg:shrink-0 tg:text-muted-foreground" />
              {isRemoteFileData(file.data) ? (
                <a
                  href={file.data}
                  target="_blank"
                  rel="noreferrer"
                  className="tg:flex-1 tg:truncate tg:text-primary tg:underline tg:underline-offset-2"
                  title={file.name}
                >
                  {file.name}
                </a>
              ) : (
                <span className="tg:flex-1 tg:truncate" title={file.name}>
                  {file.name}
                </span>
              )}
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

      <input ref={inputRef} type="file" name={name} id={id} className="tg:hidden" onChange={handleFileChange} multiple={isMultiple} />

      <Button type="button" variant="outline" onClick={() => inputRef.current?.click()} aria-label={label || node.data.name}>
        <FileUp className="tg:size-4" />
        {files.length === 0
          ? t(isMultiple ? "renderer.defaultInputs.selectFiles" : "renderer.defaultInputs.selectFile")
          : t(isMultiple ? "renderer.defaultInputs.addMoreFiles" : "renderer.defaultInputs.replaceFile")}
      </Button>

      {error && <FormError>{error}</FormError>}
      {helperText && !error && <FormDescription>{helperText}</FormDescription>}
    </FormItem>
  );
};

export default DefaultFileInput;
