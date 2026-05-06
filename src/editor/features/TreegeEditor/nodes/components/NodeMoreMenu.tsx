import { MoreVertical, Settings, Trash2 } from "lucide-react";
import { MouseEvent } from "react";
import { useTreegeEditorContext } from "@/editor/context/TreegeEditorContext";
import useFlowActions from "@/editor/hooks/useFlowActions";
import useTranslate from "@/editor/hooks/useTranslate";
import { Button } from "@/shared/components/ui/button";
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
        <Button
          type="button"
          variant="icon"
          size="icon-sm"
          aria-label={t("editor.nodeActionsSheet.editNode")}
          className={cn("nodrag nopan tg:size-6 tg:hover:text-[--treege-color-primary]", className)}
        >
          <MoreVertical />
        </Button>
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
