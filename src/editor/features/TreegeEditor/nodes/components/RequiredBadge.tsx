import { MouseEvent } from "react";
import useFlowActions from "@/editor/hooks/useFlowActions";
import useTranslate from "@/editor/hooks/useTranslate";
import { Badge } from "@/shared/components/ui/badge";

interface RequiredBadgeProps {
  nodeId: string;
  required?: boolean;
}

const RequiredBadge = ({ nodeId, required }: RequiredBadgeProps) => {
  const { updateNodeData } = useFlowActions();
  const t = useTranslate();

  const handleClick = (event: MouseEvent) => {
    event.stopPropagation();
    updateNodeData(nodeId, { required: !required });
  };

  return (
    <Badge
      variant={required ? "destructive" : "outline"}
      asChild
      className="nodrag nopan cursor-pointer px-1.5 py-0 text-[10px] capitalize [&>svg]:size-2.5"
    >
      <button type="button" onClick={handleClick}>
        {required ? t("editor.inputNodeForm.required") : t("editor.inputNodeForm.optional")}
      </button>
    </Badge>
  );
};

export default RequiredBadge;
