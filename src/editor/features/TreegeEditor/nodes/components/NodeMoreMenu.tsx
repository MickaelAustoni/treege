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

  const handleDelete = () => {
    openDeleteNodeConfirmation(nodeId);
  };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild onClick={stopPropagation}>
        <button
          type="button"
          aria-label={t("editor.nodeActionsSheet.editNode")}
          className={cn(
            "nodrag nopan tg:absolute tg:top-2 tg:right-2 tg:flex tg:h-6 tg:w-6 tg:cursor-pointer tg:items-center tg:justify-center tg:rounded-md tg:opacity-60 tg:transition-all tg:hover:text-[--treege-color-primary] tg:hover:opacity-100",
            className,
          )}
        >
          <MoreVertical className="tg:h-3.5 tg:w-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={stopPropagation}>
        <DropdownMenuItem onSelect={handleOpenSheet}>
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
