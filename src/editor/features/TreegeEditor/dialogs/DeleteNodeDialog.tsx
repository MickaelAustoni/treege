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

const DeleteNodeDialog = () => {
  const { pendingDeleteNodeId, closeDeleteNodeConfirmation } = useTreegeEditorContext();
  const { deleteNode } = useFlowActions();
  const t = useTranslate();

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      closeDeleteNodeConfirmation();
    }
  };

  const handleConfirm = () => {
    if (pendingDeleteNodeId) {
      deleteNode(pendingDeleteNodeId);
    }
    closeDeleteNodeConfirmation();
  };

  return (
    <AlertDialog open={pendingDeleteNodeId !== null} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("editor.nodeActionsSheet.deleteNode")}</AlertDialogTitle>
          <AlertDialogDescription>{t("editor.nodeActionsSheet.deleteNodeConfirm")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>{t("common.delete")}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteNodeDialog;
