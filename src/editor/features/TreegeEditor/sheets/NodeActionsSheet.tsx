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
import { Button } from "@/shared/components/ui/button";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Separator } from "@/shared/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/shared/components/ui/sheet";
import { TreegeNodeData } from "@/shared/types/node";
import { isFlowNode, isGroupNode, isInputNode, isUINode } from "@/shared/utils/nodeTypeGuards";

const NodeActionsSheet = () => {
  const { selectedNode } = useNodesSelection<TreegeNodeData>();
  const { clearSelection } = useFlowActions();
  const { isNodeSheetOpen, setIsNodeSheetOpen, openDeleteNodeConfirmation } = useTreegeEditorContext();
  const t = useTranslate();
  const label = t(selectedNode?.data?.label);

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
    if (selectedNode) {
      openDeleteNodeConfirmation(selectedNode.id);
    }
  };

  return (
    <Sheet open={isNodeSheetOpen && !!selectedNode} onOpenChange={handleOpenChange}>
      <SheetContent className="flex flex-col gap-0">
        <SheetHeader>
          <SheetTitle>
            {t("editor.nodeActionsSheet.editNode")} <span className="font-light text-muted-foreground text-xs">{selectedNode?.id}</span>
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
          <Button variant="ghost" size="icon" onClick={handleDelete} aria-label={t("editor.nodeActionsSheet.deleteNode")}>
            <Trash2 />
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default NodeActionsSheet;
