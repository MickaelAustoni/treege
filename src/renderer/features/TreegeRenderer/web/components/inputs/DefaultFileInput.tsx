import { ChangeEvent } from "react";
import { InputRenderProps } from "@/renderer/types/renderer";
import { filesToSerializable, fileToSerializable } from "@/renderer/utils/file";
import { FormDescription, FormError, FormItem } from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";

const DefaultFileInput = ({ field, extra }: InputRenderProps<"file">) => {
  const { id, name, placeholder } = field;
  const { InputLabel, node, setValue, error, label, helperText } = extra;

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target;

    if (!files || files.length === 0) {
      setValue(null);
      return;
    }

    // Convert File objects to serializable format
    if (node.data.multiple) {
      const serializableFiles = await filesToSerializable(Array.from(files));
      setValue(serializableFiles);
      return;
    }

    const serializableFile = await fileToSerializable(files[0]);
    setValue(serializableFile);
  };

  return (
    <FormItem className="tg:mb-4">
      <InputLabel htmlFor={id} label={label} required={node.data.required} />
      <Input
        type="file"
        name={name}
        id={id}
        aria-label={label || node.data.name}
        onChange={handleFileChange}
        multiple={node.data.multiple}
        placeholder={placeholder}
      />
      {error && <FormError>{error}</FormError>}
      {helperText && !error && <FormDescription>{helperText}</FormDescription>}
    </FormItem>
  );
};

export default DefaultFileInput;
