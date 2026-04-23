import { ChangeEvent, MouseEvent, PointerEvent, useEffect, useRef } from "react";
import { useTreegeEditorContext } from "@/editor/context/TreegeEditorContext";
import useFlowActions from "@/editor/hooks/useFlowActions";
import useTranslate from "@/editor/hooks/useTranslate";
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
  const t = useTranslate();
  const inputRef = useRef<HTMLInputElement>(null);
  const value = label?.[language] ?? "";
  const resolvedPlaceholder = placeholder || t("editor.treegeNode.labelPlaceholder");

  const stopPropagation = (event: MouseEvent | PointerEvent) => event.stopPropagation();

  /**
   * Autofocus input
   */
  useEffect(() => {
    const timeout = setTimeout(() => {
      inputRef.current?.focus();
    }, 300);
    return () => clearTimeout(timeout);
  }, []);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    updateNodeData(nodeId, {
      label: { ...label, [language]: event.target.value },
    });
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      placeholder={resolvedPlaceholder}
      onChange={handleChange}
      onClick={stopPropagation}
      onMouseDown={stopPropagation}
      onPointerDown={stopPropagation}
      className={cn("nodrag nopan w-full truncate bg-transparent outline-none placeholder:text-muted-foreground/40", className)}
    />
  );
};

export default NodeLabelInput;
