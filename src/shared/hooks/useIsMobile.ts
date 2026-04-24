import { useEffect, useState } from "react";

const MOBILE_BREAKPOINT = 768;

/**
 *  Detects if the current device is a mobile device based on the window width.
 *  It listens for changes in the window size and updates the state accordingly.
 *  Returns true if the device is mobile, false otherwise.
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}
