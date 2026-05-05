import { Node } from "@xyflow/react";
import { ReactNode } from "react";
import { InputNodeData } from "@/shared/types/node";

interface DefaultInputWrapperProps {
  node: Node<InputNodeData>;
  children: ReactNode;
}

export const DefaultInputWrapper = ({ node, children }: DefaultInputWrapperProps) => {
  const { image } = node.data;

  return (
    <>
      {image && <img src={image} alt="" className="tg:mb-2 tg:max-h-40 tg:w-full tg:rounded-md tg:object-cover" />}
      {children}
    </>
  );
};

export default DefaultInputWrapper;
