import { Trash2 } from "lucide-react";
import { useTreegeEditorContext } from "@/editor/context/TreegeEditorContext";
import FlowNodeForm from "@/editor/features/TreegeEditor/forms/FlowNodeForm";
import GroupNodeForm from "@/editor/features/TreegeEditor/forms/GroupNodeForm";
import InputNodeForm from "@/editor/features/TreegeEditor/forms/InputNodeForm";
import UINodeForm from "@/editor/features/TreegeEditor/forms/UINodeForm";
import SelectNodeGroup from "@/editor/features/TreegeEditor/inputs/SelectNodeGroup";
import SelectNodeType from "@/editor/features/TreegeEditor/inputs/SelectNodeType";
import useFlowActions from "@/editor/hooks/useFlowActions";
import useNodesSelection from "@/editor/hooks/useNodesSelection";
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
  AlertDialogTrigger,
} from "@/shared/components/ui/alert-dialog";
import { Button } from "@/shared/components/ui/button";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Separator } from "@/shared/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/shared/components/ui/sheet";
import { TreegeNodeData } from "@/shared/types/node";
import { isFlowNode, isGroupNode, isInputNode, isUINode } from "@/shared/utils/nodeTypeGuards";

const NodeActionsSheet = () => {
  const { selectedNode } = useNodesSelection<TreegeNodeData>();
  const { clearSelection, deleteSelectedNode } = useFlowActions();
  const { isNodeSheetOpen, setIsNodeSheetOpen } = useTreegeEditorContext();
  const translate = useTranslate();
  const label = translate(selectedNode?.data?.label);

  const handleClose = () => {
    setIsNodeSheetOpen(false);
    clearSelection();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      handleClose();
    }
  };

  const handleDelete = () => {
    deleteSelectedNode();
    handleClose();
  };

  return (
    <Sheet open={isNodeSheetOpen && !!selectedNode} onOpenChange={handleOpenChange}>
      <SheetContent className="flex flex-col gap-0">
        <SheetHeader>
          <SheetTitle>
            {translate("editor.nodeActionsSheet.editNode")}{" "}
            <span className="font-light text-muted-foreground text-xs">{selectedNode?.id}</span>
          </SheetTitle>
          <SheetDescription>{label || "\u00A0"}</SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex min-h-0 flex-1 flex-col px-4">
          <div className="space-y-6 py-4">
            <SelectNodeType />
            <SelectNodeGroup />

            <Separator />

            {isInputNode(selectedNode) && <InputNodeForm />}
            {isUINode(selectedNode) && <UINodeForm />}
            {isFlowNode(selectedNode) && <FlowNodeForm />}
            {isGroupNode(selectedNode) && <GroupNodeForm />}
          </div>
        </ScrollArea>

        <SheetFooter className="flex items-end border-t">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Trash2 />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{translate("editor.nodeActionsSheet.deleteNode")}</AlertDialogTitle>
                <AlertDialogDescription>{translate("editor.nodeActionsSheet.deleteNodeConfirm")}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{translate("common.cancel")}</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>{translate("common.delete")}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default NodeActionsSheet;
