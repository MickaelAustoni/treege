import { PropsWithChildren } from "react";
import { ChainPosition } from "@/editor/hooks/useChainPosition";
import { cn } from "@/shared/lib/utils";

interface NodeWrapperProps extends PropsWithChildren {
  isSubmit?: boolean;
  chainPosition?: ChainPosition;
}

const RADIUS_BY_POSITION: Record<ChainPosition, string> = {
  first: "tg:rounded-t-lg tg:rounded-b-none",
  last: "tg:rounded-b-lg tg:rounded-t-none",
  middle: "tg:rounded-none",
  single: "tg:rounded-lg",
};

const NodeWrapper = ({ children, isSubmit, chainPosition = "single" }: NodeWrapperProps) => {
  const hidesTopBorder = chainPosition === "middle" || chainPosition === "last";

  return (
    <div
      className={cn(
        "react-flow__node__wrapper tg:relative",
        RADIUS_BY_POSITION[chainPosition],
        hidesTopBorder && "chain-stacked",
        isSubmit && "submit-type",
      )}
    >
      {children}
    </div>
  );
};
export default NodeWrapper;
