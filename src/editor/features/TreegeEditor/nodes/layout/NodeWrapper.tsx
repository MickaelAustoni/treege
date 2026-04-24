import { PropsWithChildren } from "react";
import { cn } from "@/shared/lib/utils";

interface NodeWrapperProps extends PropsWithChildren {
  inGroup: boolean;
  isSubmit?: boolean;
}

const NodeWrapper = ({ children, inGroup, isSubmit }: NodeWrapperProps) => (
  <div className={cn("react-flow__node__wrapper tg:relative", inGroup && "in-group", isSubmit && "submit-type")}>{children}</div>
);
export default NodeWrapper;
