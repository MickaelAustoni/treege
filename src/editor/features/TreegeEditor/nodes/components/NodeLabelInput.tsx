import { ChangeEvent, KeyboardEvent, useEffect, useRef } from "react";
import { useTreegeEditorRuntime } from "@/editor/context/TreegeEditorRuntimeProvider";
import useFlowActions from "@/editor/hooks/useFlowActions";
import useTranslate from "@/editor/hooks/useTranslate";
import { cn } from "@/shared/lib/utils";
import { Translatable } from "@/shared/types/translate";

interface NodeLabelInputProps {
  nodeId: string;
  label?: Translatable;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

const NodeLabelInput = ({ nodeId, label, placeholder, className, autoFocus }: NodeLabelInputProps) => {
  const { language } = useTreegeEditorRuntime();
  const { updateNodeData, clearSelection } = useFlowActions();
  const t = useTranslate();
  const inputRef = useRef<HTMLInputElement>(null);
  const value = label?.[language] ?? "";
  const resolvedPlaceholder = placeholder || t("editor.treegeNode.labelPlaceholder");

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    updateNodeData(nodeId, {
      label: { ...label, [language]: event.target.value },
    });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      inputRef.current?.blur();
      clearSelection();
    }
  };

  /**
   * Autofocus input
   */
  useEffect(() => {
    if (!autoFocus) {
      return;
    }
    const timeout = setTimeout(() => {
      inputRef.current?.focus();
    }, 300);
    return () => clearTimeout(timeout);
  }, [autoFocus]);

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      placeholder={resolvedPlaceholder}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      className={cn(
        "nodrag nopan tg:w-full tg:truncate tg:bg-transparent tg:outline-none tg:placeholder:text-muted-foreground/40",
        className,
      )}
    />
  );
};

export default NodeLabelInput;
