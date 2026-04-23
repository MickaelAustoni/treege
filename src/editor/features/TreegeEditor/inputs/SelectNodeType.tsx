import { useReactFlow } from "@xyflow/react";
import { useId } from "react";
import { useTreegeEditorContext } from "@/editor/context/TreegeEditorContext";
import useFlowActions from "@/editor/hooks/useFlowActions";
import useNodesSelection from "@/editor/hooks/useNodesSelection";
import useTranslate from "@/editor/hooks/useTranslate";
import { getInputTypeIcon } from "@/editor/utils/inputTypeIcon";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { INPUT_TYPE } from "@/shared/constants/inputType";
import { NODE_TYPE } from "@/shared/constants/node";
import { UI_TYPE } from "@/shared/constants/uiType";
import { isGroupNode, isInputNode, isUINode } from "@/shared/utils/nodeTypeGuards";

const INPUT_TYPES = Object.values(INPUT_TYPE) as string[];
const UI_TYPES = Object.values(UI_TYPE) as string[];

const SelectNodeType = () => {
  const { selectedNode } = useNodesSelection();
  const { updateSelectedNodeType } = useFlowActions();
  const { getEdges } = useReactFlow();
  const { openNodeTypeChangeConfirmation } = useTreegeEditorContext();
  const isGroup = isGroupNode(selectedNode);
  const t = useTranslate();
  const id = useId();
  const FlowIcon = getInputTypeIcon(NODE_TYPE.flow);

  const getValue = () => {
    if (!selectedNode) {
      return "";
    }

    if (isInputNode(selectedNode) || isUINode(selectedNode)) {
      return selectedNode.data?.type || "";
    }

    return selectedNode.type || "";
  };

  const applyTypeChange = (type: string, subType?: string) => {
    if (!selectedNode) {
      return;
    }

    const outgoingCount = getEdges().filter((edge) => edge.source === selectedNode.id).length;
    const needsConfirmation = (type === NODE_TYPE.ui || type === NODE_TYPE.flow) && outgoingCount > 1;

    if (needsConfirmation) {
      openNodeTypeChangeConfirmation({ nodeId: selectedNode.id, subType, type });
      return;
    }

    updateSelectedNodeType(type, subType);
  };

  const handleChange = (newValue: string) => {
    if (INPUT_TYPES.includes(newValue)) {
      applyTypeChange(NODE_TYPE.input, newValue);
      return;
    }

    if (UI_TYPES.includes(newValue)) {
      applyTypeChange(NODE_TYPE.ui, newValue);
      return;
    }

    applyTypeChange(newValue);
  };

  return (
    <SelectGroup>
      <SelectLabel htmlFor={id}>{t("editor.selectNodeType.nodeType")}</SelectLabel>
      <Select value={getValue()} onValueChange={handleChange} disabled={isGroup}>
        <SelectTrigger className="w-full capitalize" id={id}>
          <SelectValue placeholder={t("editor.selectNodeType.nodeType")} />
        </SelectTrigger>
        <SelectContent className="treege-scrollbar max-h-80">
          {isGroup ? (
            <SelectGroup>
              <SelectItem value={NODE_TYPE.group}>{t("editor.selectNodeType.options.group")}</SelectItem>
            </SelectGroup>
          ) : (
            <>
              <SelectGroup>
                <SelectLabel>{t("editor.selectNodeType.options.input")}</SelectLabel>
                {INPUT_TYPES.map((type) => {
                  const Icon = getInputTypeIcon(type);

                  return (
                    <SelectItem key={type} value={type} className="capitalize">
                      <Icon />
                      {type}
                    </SelectItem>
                  );
                })}
              </SelectGroup>
              <SelectSeparator />
              <SelectGroup>
                <SelectLabel>{t("editor.selectNodeType.options.ui")}</SelectLabel>
                {UI_TYPES.map((type) => {
                  const Icon = getInputTypeIcon(type);

                  return (
                    <SelectItem key={type} value={type} className="capitalize">
                      <Icon />
                      {type}
                    </SelectItem>
                  );
                })}
              </SelectGroup>
              <SelectSeparator />
              <SelectGroup>
                <SelectLabel>{t("common.other")}</SelectLabel>
                <SelectItem value={NODE_TYPE.flow}>
                  <FlowIcon />
                  {t("editor.selectNodeType.options.flow")}
                </SelectItem>
              </SelectGroup>
            </>
          )}
        </SelectContent>
      </Select>
    </SelectGroup>
  );
};

export default SelectNodeType;
