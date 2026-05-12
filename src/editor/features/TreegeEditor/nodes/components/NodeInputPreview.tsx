import { Node } from "@xyflow/react";
import { ReactNode } from "react";
import { useTreegeEditorContext } from "@/editor/context/TreegeEditorContext";
import { getInputTypeIcon } from "@/editor/utils/inputTypeIcon";
import { TreegeRendererProvider } from "@/renderer/context/TreegeRendererContext";
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
  const { language, headers } = useTreegeEditorContext();
  const inputType = data?.type;

  if (!inputType) {
    return null;
  }

  // Resolve the form name BEFORE stripping the data so the runtime renderer
  // still receives a meaningful `name` prop (used for input `name=` attribute).
  const name = resolveNodeKey({
    data,
    id: nodeId,
    position: { x: 0, y: 0 },
    type: "input",
  });

  // For the preview we strip:
  // - `required` so the renderer doesn't paint its red asterisk (already shown
  //   by `NodeRequiredButton` in the top-right actions),
  // - `name` so the renderer's `label || node.data.name` fallback yields an
  //   empty <label/>. Combined with the `[&_label:empty]:hidden` wrapper, this
  //   removes the duplicate label rendered above the preview's input.
  const node: Node<InputNodeData> = {
    data: { ...data, name: undefined, required: undefined },
    id: nodeId,
    position: { x: 0, y: 0 },
    type: "input",
  };

  // Hidden inputs render nothing at runtime — show a readable summary instead
  // (with the type icon since there's no rendered field to identify it visually).
  if (inputType === "hidden") {
    const SubTypeIcon = getInputTypeIcon(inputType);
    const staticValue = data.defaultValue?.type === "static" ? data.defaultValue.staticValue : undefined;
    const referenceField = data.defaultValue?.type === "reference" ? data.defaultValue.referenceField : undefined;
    const displayValue = Array.isArray(staticValue)
      ? staticValue.join(", ")
      : typeof staticValue === "boolean"
        ? String(staticValue)
        : (staticValue ?? (referenceField ? `→ ${referenceField}` : ""));

    return (
      <div className="tg:pointer-events-none tg:flex tg:select-none tg:flex-col tg:gap-1 tg:text-sm">
        <div className="tg:flex tg:items-center tg:gap-1 tg:text-[10px] tg:text-muted-foreground tg:capitalize tg:[&>svg]:size-3">
          <SubTypeIcon />
          {inputType}
        </div>
        <span className="tg:truncate tg:text-muted-foreground tg:text-xs">{displayValue || "—"}</span>
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
    <div
      className={cn(
        "tg:pointer-events-none tg:flex tg:select-none tg:flex-col tg:gap-1 tg:[&_label:empty]:hidden",
        inputType === "submit" && "tg:items-center",
      )}
    >
      {/*
        Wrap the runtime renderer in a minimal `TreegeRendererProvider` so it
        picks up the editor's `headers` (e.g. for `useInputOptions`'s fetch).
        The provider merges with sensible defaults — other fields stay no-op
        since the preview is non-interactive. `label` is intentionally omitted
        so the editor's `NodeLabelInput` is the single source of truth visually
        and avoids rendering the same text twice.
      */}
      <TreegeRendererProvider value={{ headers, language, optionsDisplayLimit: 10 }}>
        <Renderer
          node={node}
          value={defaultValueForType(inputType) as never}
          setValue={() => {}}
          id={nodeId}
          name={name}
          placeholder={placeholder || undefined}
          helperText={helperText || undefined}
        />
      </TreegeRendererProvider>
    </div>
  );
};

export default NodeInputPreview;
