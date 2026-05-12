import { PropsWithChildren } from "react";
import { StackPosition } from "@/editor/utils/stackPositionIndex";
import { cn } from "@/shared/lib/utils";

interface NodeWrapperProps extends PropsWithChildren {
  isSubmit?: boolean;
  stackPosition?: StackPosition;
}

const RADIUS_BY_POSITION: Record<StackPosition, string> = {
  first: "tg:rounded-t-lg tg:rounded-b-none",
  last: "tg:rounded-b-lg tg:rounded-t-none",
  middle: "tg:rounded-none",
  single: "tg:rounded-lg",
};

const NodeWrapper = ({ children, isSubmit, stackPosition = "single" }: NodeWrapperProps) => {
  const hidesTopBorder = stackPosition === "middle" || stackPosition === "last";

  return (
    <div
      className={cn(
        "react-flow__node__wrapper tg:relative",
        RADIUS_BY_POSITION[stackPosition],
        hidesTopBorder && "stacked",
        isSubmit && "submit-type",
      )}
    >
      {children}
    </div>
  );
};
export default NodeWrapper;
