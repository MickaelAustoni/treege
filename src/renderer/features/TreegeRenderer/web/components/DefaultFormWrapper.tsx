import { FormEvent, ReactNode } from "react";

const DefaultFormWrapper = ({
  children,
  id,
  onSubmit,
}: {
  children: ReactNode;
  id?: string;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}) => (
  <form id={id} onSubmit={onSubmit} className="tg:mx-auto tg:max-w-2xl tg:gap-y-3">
    {children}
  </form>
);

export default DefaultFormWrapper;
