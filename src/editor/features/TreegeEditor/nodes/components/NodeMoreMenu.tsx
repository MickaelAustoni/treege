import { MoreVertical, Settings, Trash2 } from "lucide-react";
import { MouseEvent, useState } from "react";
import { useTreegeEditorContext } from "@/editor/context/TreegeEditorContext";
import useFlowActions from "@/editor/hooks/useFlowActions";
import useTranslate from "@/editor/hooks/useTranslate";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
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
  const { deleteNode, selectNode } = useFlowActions();
  const { setIsNodeSheetOpen } = useTreegeEditorContext();
  const t = useTranslate();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const stopPropagation = (event: MouseEvent) => event.stopPropagation();

  const handleOpenSheet = () => {
    selectNode(nodeId);
    setIsNodeSheetOpen(true);
  };

  const handleDelete = () => {
    deleteNode(nodeId);
    setConfirmOpen(false);
  };

  return (
    <>
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
          <DropdownMenuItem variant="destructive" onClick={() => setConfirmOpen(true)}>
            <Trash2 />
            {t("common.delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent onClick={stopPropagation}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("editor.nodeActionsSheet.deleteNode")}</AlertDialogTitle>
            <AlertDialogDescription>{t("editor.nodeActionsSheet.deleteNodeConfirm")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>{t("common.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default NodeMoreMenu;
