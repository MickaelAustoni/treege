import { Node } from "@xyflow/react";
import { ReactNode } from "react";
import { useTreegeEditorContext } from "@/editor/context/TreegeEditorContext";
import { getInputTypeIcon } from "@/editor/utils/inputTypeIcon";
import { defaultInputRenderers } from "@/renderer/features/TreegeRenderer/web/components/DefaultInputs";
import type { InputRenderProps } from "@/renderer/types/renderer";
import { resolveInputPlaceholder, resolveNodeKey } from "@/renderer/utils/node";
import { cn } from "@/shared/lib/utils";
import { InputNodeData, InputType } from "@/shared/types/node";
import { getTranslatedText } from "@/shared/utils/translations";

interface NodeInputPreviewProps {
  nodeId: string;
  data: InputNodeData;
}

const defaultValueForType = (type: InputType): unknown => {
  switch (type) {
    case "number":
    case "daterange":
    case "timerange":
    case "file":
      return null;
    case "switch":
      return false;
    case "checkbox":
      return [];
    default:
      return "";
  }
};

const NodeInputPreview = ({ nodeId, data }: NodeInputPreviewProps) => {
  const { language } = useTreegeEditorContext();
  const inputType = data?.type;

  if (!inputType) {
    return null;
  }

  const node: Node<InputNodeData> = {
    data,
    id: nodeId,
    position: { x: 0, y: 0 },
    type: "input",
  };

  const label = getTranslatedText(data.label, language);
  const name = resolveNodeKey(node);
  const SubTypeIcon = getInputTypeIcon(inputType);
  const subTypeHint = (
    <div className="flex items-center gap-1 text-[10px] text-muted-foreground capitalize [&>svg]:size-3">
      <SubTypeIcon />
      {inputType}
    </div>
  );

  // Hidden inputs render nothing at runtime — show a readable summary instead so the node is not blank in the editor
  if (inputType === "hidden") {
    const staticValue = data.defaultValue?.type === "static" ? data.defaultValue.staticValue : undefined;
    const referenceField = data.defaultValue?.type === "reference" ? data.defaultValue.referenceField : undefined;
    const displayValue = Array.isArray(staticValue)
      ? staticValue.join(", ")
      : typeof staticValue === "boolean"
        ? String(staticValue)
        : (staticValue ?? (referenceField ? `→ ${referenceField}` : ""));
    const displayKey = label || name;

    return (
      <div className="pointer-events-none flex select-none flex-col gap-1 text-sm">
        {subTypeHint}
        <span className="truncate font-medium">{displayKey}</span>
        <span className="truncate text-muted-foreground text-xs">{displayValue || "—"}</span>
      </div>
    );
  }

  const Renderer = defaultInputRenderers[inputType] as ((props: InputRenderProps) => ReactNode) | undefined;

  if (!Renderer) {
    return null;
  }

  const helperText = getTranslatedText(data.helperText, language);
  const placeholder = resolveInputPlaceholder(data, language);

  return (
    <div className={cn("pointer-events-none flex select-none flex-col gap-1", inputType === "submit" && "items-center")}>
      {subTypeHint}
      <Renderer
        node={node}
        value={defaultValueForType(inputType) as never}
        setValue={() => {}}
        id={nodeId}
        name={name}
        label={label || undefined}
        placeholder={placeholder || undefined}
        helperText={helperText || undefined}
      />
    </div>
  );
};

export default NodeInputPreview;
