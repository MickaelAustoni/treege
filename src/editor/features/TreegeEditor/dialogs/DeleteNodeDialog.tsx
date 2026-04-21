import { useTreegeEditorContext } from "@/editor/context/TreegeEditorContext";
import useFlowActions from "@/editor/hooks/useFlowActions";
import useTranslate from "@/editor/hooks/useTranslate";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";

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
    <Dialog open={pendingDeleteNodeId !== null} onOpenChange={handleOpenChange} modal={false}>
      <DialogContent
        showCloseButton={false}
        onInteractOutside={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{t("editor.nodeActionsSheet.deleteNode")}</DialogTitle>
          <DialogDescription>{t("editor.nodeActionsSheet.deleteNodeConfirm")}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={closeDeleteNodeConfirmation}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleConfirm}>{t("common.delete")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteNodeDialog;
