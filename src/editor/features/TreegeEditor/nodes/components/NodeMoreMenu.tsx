import { MoreVertical, Settings, Trash2 } from "lucide-react";
import { MouseEvent } from "react";
import { useTreegeEditorContext } from "@/editor/context/TreegeEditorContext";
import useFlowActions from "@/editor/hooks/useFlowActions";
import useTranslate from "@/editor/hooks/useTranslate";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { cn } from "@/shared/lib/utils";

interface NodeMoreMenuProps {
  nodeId: string;
  className?: string;
}

const NodeMoreMenu = ({ nodeId, className }: NodeMoreMenuProps) => {
  const { selectNode } = useFlowActions();
  const { setIsNodeSheetOpen, openDeleteNodeConfirmation } = useTreegeEditorContext();
  const t = useTranslate();

  const stopPropagation = (event: MouseEvent) => event.stopPropagation();

  const handleOpenSheet = () => {
    selectNode(nodeId);
    setIsNodeSheetOpen(true);
  };

  const handleDelete = (event: Event) => {
    event.preventDefault();
    openDeleteNodeConfirmation(nodeId);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={stopPropagation}>
        <button
          type="button"
          aria-label={t("editor.nodeActionsSheet.editNode")}
          className={cn(
            "nodrag nopan absolute top-2 right-2 flex h-6 w-6 cursor-pointer items-center justify-center rounded-md opacity-60 transition-all hover:text-[--treege-color-primary] hover:opacity-100",
            className,
          )}
        >
          <MoreVertical className="h-3.5 w-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={stopPropagation}>
        <DropdownMenuItem onClick={handleOpenSheet}>
          <Settings />
          {t("common.settings")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={handleDelete}>
          <Trash2 />
          {t("common.delete")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NodeMoreMenu;
