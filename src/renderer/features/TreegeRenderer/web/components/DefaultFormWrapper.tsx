import { FormEvent, ReactNode } from "react";

const DefaultFormWrapper = ({ children, onSubmit }: { children: ReactNode; onSubmit: (e: FormEvent) => void }) => (
  <form onSubmit={onSubmit} className="tg:mx-auto tg:max-w-2xl tg:gap-y-3">
    {children}
  </form>
);

export default DefaultFormWrapper;
