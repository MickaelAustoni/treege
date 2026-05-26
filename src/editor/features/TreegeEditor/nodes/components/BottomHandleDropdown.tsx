import { Handle, Position } from "@xyflow/react";
import { GitBranch, Plus } from "lucide-react";
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
import { cn } from "@/shared/lib/utils";

interface BottomHandleDropdownProps {
  nodeId: string;
  isConnectable?: boolean;
  hidden?: boolean;
  /** Whether branching (forking into two nodes) is allowed — only for input nodes. */
  canBranch?: boolean;
}

const BottomHandleDropdown = ({ nodeId, isConnectable, hidden, canBranch }: BottomHandleDropdownProps) => {
  const [nodeTypeOpen, setNodeTypeOpen] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);
  const { onAddFromHandle, onCreateBranch } = useFlowConnections();
  const t = useTranslate();

  const handleClick = (event: MouseEvent) => {
    if (event.defaultPrevented || hidden) {
      return;
    }
    setNodeTypeOpen(true);
  };

  const handleContextMenu = (event: MouseEvent) => {
    if (hidden) {
      return;
    }
    event.preventDefault();
    setContextOpen(true);
  };

  return (
    <>
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable && !hidden}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        className={cn(
          "tg:flex tg:h-6! tg:w-6! tg:cursor-pointer tg:items-center tg:justify-center tg:rounded-sm tg:transition tg:hover:bg-primary/80!",
          hidden && "tg:pointer-events-none tg:opacity-0",
        )}
      >
        {!hidden && <Plus className="tg:h-4 tg:w-4 tg:text-primary-foreground" />}
      </Handle>

      {/* Right-click context menu: pick between adding a single node or forking into a branch. */}
      <DropdownMenu open={contextOpen} onOpenChange={setContextOpen}>
        <DropdownMenuTrigger asChild>
          <span aria-hidden className="tg:pointer-events-none tg:absolute tg:bottom-0 tg:left-1/2 tg:h-0 tg:w-0 tg:-translate-x-1/2" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" side="bottom">
          <DropdownMenuItem
            onClick={() => {
              setContextOpen(false);
              setNodeTypeOpen(true);
            }}
          >
            <Plus />
            {t("editor.stackedEdge.addNode")}
          </DropdownMenuItem>
          {canBranch && (
            <DropdownMenuItem onClick={() => onCreateBranch(nodeId)}>
              <GitBranch />
              {t("editor.stackedEdge.createBranch")}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Node-type picker: opened by left click on the handle or via "Add a node" above. */}
      <DropdownMenu open={nodeTypeOpen} onOpenChange={setNodeTypeOpen}>
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
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

export default BottomHandleDropdown;
