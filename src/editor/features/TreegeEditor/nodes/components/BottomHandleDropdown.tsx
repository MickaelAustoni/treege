import { Handle, Position } from "@xyflow/react";
import { Plus } from "lucide-react";
import { MouseEvent, useState } from "react";
import useFlowConnections from "@/editor/hooks/useFlowConnections";
import useTranslate from "@/editor/hooks/useTranslate";
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
        className="flex h-6! w-6! cursor-pointer items-center justify-center rounded-sm transition-colors hover:bg-primary/80!"
      >
        <Plus className="h-4 w-4 text-primary-foreground" />
      </Handle>

      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <span aria-hidden className="-translate-x-1/2 pointer-events-none absolute bottom-0 left-1/2 h-0 w-0" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" side="bottom" className="treege-scrollbar max-h-80">
          <DropdownMenuGroup>
            <DropdownMenuLabel>{t("editor.selectNodeType.options.input")}</DropdownMenuLabel>
            {Object.values(INPUT_TYPE).map((subType) => (
              <DropdownMenuItem
                key={subType}
                onClick={() => onAddFromHandle(nodeId, { data: { type: subType }, type: NODE_TYPE.input })}
                className="capitalize"
              >
                {subType}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuLabel>{t("editor.selectNodeType.options.ui")}</DropdownMenuLabel>
            {Object.values(UI_TYPE).map((subType) => (
              <DropdownMenuItem
                key={subType}
                onClick={() => onAddFromHandle(nodeId, { data: { type: subType }, type: NODE_TYPE.ui })}
                className="capitalize"
              >
                {subType}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuLabel>{t("common.other")}</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onAddFromHandle(nodeId, { data: {}, type: NODE_TYPE.flow })}>
              {t("editor.selectNodeType.options.flow")}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

export default BottomHandleDropdown;
