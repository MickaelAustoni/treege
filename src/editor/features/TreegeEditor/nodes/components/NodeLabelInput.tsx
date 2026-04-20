import { ChangeEvent, MouseEvent, PointerEvent } from "react";
import { useTreegeEditorContext } from "@/editor/context/TreegeEditorContext";
import useFlowActions from "@/editor/hooks/useFlowActions";
import { cn } from "@/shared/lib/utils";
import { Translatable } from "@/shared/types/translate";

interface NodeLabelInputProps {
  nodeId: string;
  label?: Translatable;
  placeholder?: string;
  className?: string;
}

const NodeLabelInput = ({ nodeId, label, placeholder, className }: NodeLabelInputProps) => {
  const { language } = useTreegeEditorContext();
  const { updateNodeData } = useFlowActions();
  const value = label?.[language] ?? "";

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    updateNodeData(nodeId, {
      label: { ...label, [language]: event.target.value },
    });
  };

  const stopPropagation = (event: MouseEvent | PointerEvent) => event.stopPropagation();

  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={handleChange}
      onClick={stopPropagation}
      onMouseDown={stopPropagation}
      onPointerDown={stopPropagation}
      className={cn("nodrag nopan w-full truncate bg-transparent outline-none placeholder:text-muted-foreground/40", className)}
    />
  );
};

export default NodeLabelInput;
