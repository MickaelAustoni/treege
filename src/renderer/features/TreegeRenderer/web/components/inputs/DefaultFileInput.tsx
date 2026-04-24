import { ChangeEvent } from "react";
import { InputRenderProps } from "@/renderer/types/renderer";
import { filesToSerializable, fileToSerializable } from "@/renderer/utils/file";
import { FormDescription, FormError, FormItem } from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

const DefaultFileInput = ({ node, setValue, error, label, placeholder, helperText, name, id }: InputRenderProps<"file">) => {
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
      <Label htmlFor={id}>
        {label || node.data.name}
        {node.data.required && <span className="tg:text-red-500">*</span>}
      </Label>
      <Input type="file" name={name} id={id} onChange={handleFileChange} multiple={node.data.multiple} placeholder={placeholder} />
      {error && <FormError>{error}</FormError>}
      {helperText && !error && <FormDescription>{helperText}</FormDescription>}
    </FormItem>
  );
};

export default DefaultFileInput;
