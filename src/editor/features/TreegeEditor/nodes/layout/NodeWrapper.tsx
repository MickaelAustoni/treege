import { PropsWithChildren } from "react";
import { cn } from "@/shared/lib/utils";

interface NodeWrapperProps extends PropsWithChildren {
  isSubmit?: boolean;
}

const NodeWrapper = ({ children, isSubmit }: NodeWrapperProps) => (
  <div className={cn("react-flow__node__wrapper tg:relative", isSubmit && "submit-type")}>{children}</div>
);
export default NodeWrapper;
