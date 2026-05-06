import { ReactNode, SubmitEvent } from "react";

const DefaultFormWrapper = ({ children, onSubmit }: { children: ReactNode; onSubmit: (e: SubmitEvent) => void }) => (
  <form onSubmit={onSubmit} className="tg:mx-auto tg:max-w-2xl tg:gap-y-3">
    {children}
  </form>
);

export default DefaultFormWrapper;
