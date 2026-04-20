import { Cog } from "lucide-react";
import { MouseEvent } from "react";
import { useTreegeEditorContext } from "@/editor/context/TreegeEditorContext";
import useFlowActions from "@/editor/hooks/useFlowActions";
import useTranslate from "@/editor/hooks/useTranslate";
import { cn } from "@/shared/lib/utils";

interface OpenSheetButtonProps {
  nodeId: string;
  className?: string;
}

const OpenSheetButton = ({ nodeId, className }: OpenSheetButtonProps) => {
  const { selectNode } = useFlowActions();
  const { setIsNodeSheetOpen } = useTreegeEditorContext();
  const t = useTranslate();

  const handleClick = (event: MouseEvent) => {
    event.stopPropagation();
    selectNode(nodeId);
    setIsNodeSheetOpen(true);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={t("editor.nodeActionsSheet.editNode")}
      className={cn(
        "nodrag nopan absolute top-2 right-2 flex h-6 w-6 cursor-pointer items-center justify-center rounded-md opacity-60 transition-all hover:text-[--treege-color-primary] hover:opacity-100",
        className,
      )}
    >
      <Cog className="h-3.5 w-3.5" />
    </button>
  );
};

export default OpenSheetButton;
