import { ReactNode } from "react";
import { useTranslate } from "@/renderer/hooks/useTranslate";
import type { NodeRenderProps } from "@/renderer/types/renderer";

export const DefaultGroup = ({ node, children }: NodeRenderProps & { children: ReactNode }) => {
  const t = useTranslate();
  const label = t(node.data.label);

  return (
    <section className="tg:mb-6 tg:rounded-lg tg:border tg:p-4">
      {label && <h3 className="tg:mb-4 tg:font-semibold tg:text-lg">{label}</h3>}
      {children}
    </section>
  );
};

export default DefaultGroup;
