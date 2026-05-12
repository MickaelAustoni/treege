import { Panel } from "@xyflow/react";
import { Trash2, X } from "lucide-react";
import { useMemo } from "react";
import SelectNodeGroup from "@/editor/features/TreegeEditor/inputs/SelectNodeGroup";
import useFlowActions from "@/editor/hooks/useFlowActions";
import useNodesSelection from "@/editor/hooks/useNodesSelection";
import useTranslate from "@/editor/hooks/useTranslate";
import { Button } from "@/shared/components/ui/button";
import { Separator } from "@/shared/components/ui/separator";
import { isGroupNode } from "@/shared/utils/nodeTypeGuards";

/**
 * Floating bar that appears at the top-center of the canvas when two or more
 * nodes are selected. Exposes batch actions: assign a group (reuses
 * `SelectNodeGroup`), delete the selection, or clear it.
 */
const MultiSelectionPanel = () => {
  const { selectedNodes } = useNodesSelection();
  const { clearSelection, deleteNodes } = useFlowActions();
  const t = useTranslate();
  const editableSelected = useMemo(() => selectedNodes.filter((node) => !isGroupNode(node)), [selectedNodes]); // Group nodes are hidden in the editor; defensive filter in case one slips in.

  if (editableSelected.length < 2) {
    return null;
  }

  const handleDelete = () => {
    deleteNodes(editableSelected.map((node) => node.id));
    clearSelection();
  };

  return (
    <Panel position="top-center" className="tg:pointer-events-auto">
      <div className="tg:flex tg:items-center tg:gap-2 tg:rounded-lg tg:border tg:bg-card tg:p-2 tg:shadow-md">
        <span className="tg:px-2 tg:font-medium tg:text-sm">
          {editableSelected.length} {t("editor.multiSelectionPanel.nodesSelected")}
        </span>
        <Separator orientation="vertical" className="tg:h-6!" />
        <SelectNodeGroup hideLabel targetNodes={editableSelected} />
        <Separator orientation="vertical" className="tg:h-6!" />
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          aria-label={t("editor.multiSelectionPanel.deleteSelected")}
          title={t("editor.multiSelectionPanel.deleteSelected")}
        >
          <Trash2 className="tg:h-4 tg:w-4 tg:text-destructive" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={clearSelection}
          aria-label={t("editor.multiSelectionPanel.clearSelection")}
          title={t("editor.multiSelectionPanel.clearSelection")}
        >
          <X className="tg:h-4 tg:w-4" />
        </Button>
      </div>
    </Panel>
  );
};

export default MultiSelectionPanel;
