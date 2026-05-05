import { Handle, Position } from "@xyflow/react";
import { Plus } from "lucide-react";
import { MouseEvent, useState } from "react";
import useFlowConnections from "@/editor/hooks/useFlowConnections";
import useTranslate from "@/editor/hooks/useTranslate";
import { getInputTypeIcon } from "@/editor/utils/inputTypeIcon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { INPUT_TYPE } from "@/shared/constants/inputType";
import { NODE_TYPE } from "@/shared/constants/node";
import { UI_TYPE } from "@/shared/constants/uiType";

interface BottomHandleDropdownProps {
  nodeId: string;
  isConnectable?: boolean;
}

const BottomHandleDropdown = ({ nodeId, isConnectable }: BottomHandleDropdownProps) => {
  const { onAddFromHandle } = useFlowConnections();
  const t = useTranslate();
  const [open, setOpen] = useState(false);
  const FlowIcon = getInputTypeIcon(NODE_TYPE.flow);

  const handleClick = (event: MouseEvent) => {
    if (event.defaultPrevented) {
      return;
    }
    setOpen(true);
  };

  return (
    <>
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        onClick={handleClick}
        className="tg:flex tg:h-6! tg:w-6! tg:cursor-pointer tg:items-center tg:justify-center tg:rounded-sm tg:transition-colors tg:hover:bg-primary/80!"
      >
        <Plus className="tg:h-4 tg:w-4 tg:text-primary-foreground" />
      </Handle>

      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <span aria-hidden className="tg:pointer-events-none tg:absolute tg:bottom-0 tg:left-1/2 tg:h-0 tg:w-0 tg:-translate-x-1/2" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" side="bottom" className="treege-scrollbar tg:max-h-80">
          <DropdownMenuGroup>
            <DropdownMenuLabel>{t("editor.selectNodeType.options.input")}</DropdownMenuLabel>
            {Object.values(INPUT_TYPE).map((subType) => {
              const Icon = getInputTypeIcon(subType);

              return (
                <DropdownMenuItem
                  key={subType}
                  onClick={() => onAddFromHandle(nodeId, { data: { type: subType }, type: NODE_TYPE.input })}
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
                  onClick={() => onAddFromHandle(nodeId, { data: { type: subType }, type: NODE_TYPE.ui })}
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
            <DropdownMenuLabel>{t("common.other")}</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onAddFromHandle(nodeId, { data: {}, type: NODE_TYPE.flow })}>
              <FlowIcon />
              {t("editor.selectNodeType.options.flow")}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

export default BottomHandleDropdown;
