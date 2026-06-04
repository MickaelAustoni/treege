import type { NodeInit } from "@/editor/hooks/useFlowConnections";
import useTranslate from "@/editor/hooks/useTranslate";
import { getInputTypeIcon } from "@/editor/utils/inputTypeIcon";
import {
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/shared/components/ui/dropdown-menu";
import { INPUT_TYPE } from "@/shared/constants/inputType";
import { NODE_TYPE } from "@/shared/constants/node";
import { UI_TYPE } from "@/shared/constants/uiType";

interface NodeTypePickerMenuContentProps {
  /** Called with the picked node type. */
  onSelect: (nodeInit: NodeInit) => void;
}

/**
 * Shared dropdown body listing every creatable node type (inputs + UI). Used by
 * the bottom handle (add child / branch) and the junction insert button so the
 * picker stays identical across affordances.
 */
const NodeTypePickerMenuContent = ({ onSelect }: NodeTypePickerMenuContentProps) => {
  const t = useTranslate();

  return (
    <DropdownMenuContent align="center" side="bottom" className="treege-scrollbar tg:max-h-80">
      <DropdownMenuGroup>
        <DropdownMenuLabel>{t("editor.selectNodeType.options.input")}</DropdownMenuLabel>
        {Object.values(INPUT_TYPE).map((subType) => {
          const Icon = getInputTypeIcon(subType);

          return (
            <DropdownMenuItem
              key={subType}
              onClick={() => onSelect({ data: { type: subType }, type: NODE_TYPE.input })}
              className="tg:capitalize"
            >
              <Icon />
              {subType}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuLabel>{t("editor.selectNodeType.options.ui")}</DropdownMenuLabel>
        {Object.values(UI_TYPE).map((subType) => {
          const Icon = getInputTypeIcon(subType);

          return (
            <DropdownMenuItem
              key={subType}
              onClick={() => onSelect({ data: { type: subType }, type: NODE_TYPE.ui })}
              className="tg:capitalize"
            >
              <Icon />
              {subType}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuGroup>
    </DropdownMenuContent>
  );
};

export default NodeTypePickerMenuContent;
