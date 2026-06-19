import { Trash2 } from "lucide-react";
import type { KeyboardEvent } from "react";
import { useTreegeEditorRuntime } from "@/editor/context/TreegeEditorRuntimeProvider";
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
import { isGroupNode, isInputNode, isUINode } from "@/shared/utils/nodeTypeGuards";

const NodeActionsSheet = () => {
  const { selectedNode } = useNodesSelection<TreegeNodeData>();
  const { clearSelection } = useFlowActions();
  const { isNodeSheetOpen, setIsNodeSheetOpen, openDeleteNodeConfirmation } = useTreegeEditorRuntime();
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

  // Mirror Radix's native Escape-to-close on Enter as a "done editing" gesture.
  // Forms here auto-save on change, so closing just commits the current values.
  // Guarded so we never steal Enter from a control that already used it: skip if
  // it was consumed (Select/combobox option pick — handled on inner elements
  // during bubbling) or if focus isn't a plain <input> (e.g. the CodeMirror JSON
  // editor, where Enter inserts a newline).
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Enter" || event.defaultPrevented) {
      return;
    }
    if ((event.target as HTMLElement).tagName !== "INPUT") {
      return;
    }
    event.preventDefault();
    handleClose();
  };

  return (
    <Sheet open={isNodeSheetOpen && !!selectedNode} onOpenChange={handleOpenChange}>
      <SheetContent className="tg:flex tg:flex-col tg:gap-0" onKeyDown={handleKeyDown}>
        <SheetHeader>
          <SheetTitle>
            {t("editor.nodeActionsSheet.editNode")}{" "}
            <span className="tg:font-light tg:text-muted-foreground tg:text-xs">{selectedNode?.id}</span>
          </SheetTitle>
          <SheetDescription>{label || "\u00A0"}</SheetDescription>
        </SheetHeader>

        <ScrollArea className="tg:flex tg:min-h-0 tg:flex-1 tg:flex-col tg:px-4">
          <div className="tg:space-y-6 tg:py-4">
            <SelectNodeType />
            <SelectNodeGroup />

            <Separator />

            {isInputNode(selectedNode) && <InputNodeForm />}
            {isUINode(selectedNode) && <UINodeForm />}
            {isGroupNode(selectedNode) && <GroupNodeForm />}
          </div>
        </ScrollArea>

        <SheetFooter className="tg:flex tg:items-end tg:border-t">
          <Button variant="ghost" size="icon" onClick={handleDelete} aria-label={t("editor.nodeActionsSheet.deleteNode")}>
            <Trash2 />
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default NodeActionsSheet;
