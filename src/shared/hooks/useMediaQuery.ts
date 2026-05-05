import { useEffect, useState } from "react";

const MEDIA_QUERIES = {
  desktop: "(min-width: 1024px)",
  mobile: "(max-width: 767px)",
  tablet: "(min-width: 768px) and (max-width: 1023px)",
} satisfies Record<string, string>;

type Breakpoint = keyof typeof MEDIA_QUERIES;

const isBreakpoint = (query: string): query is Breakpoint => query in MEDIA_QUERIES;

/**
 *  Tracks whether the current window matches a CSS media query.
 *  Accepts a preset (`"mobile"`, `"tablet"`, `"desktop"`) or any custom query string.
 */
export const useMediaQuery = (query: Breakpoint | (string & {})) => {
  const [matches, setMatches] = useState<boolean | undefined>(undefined);
  const resolvedQuery = isBreakpoint(query) ? MEDIA_QUERIES[query] : query;

  /**
   * Subscribe to the media query and keep `matches` in sync with it.
   * Re-subscribes when the query string changes.
   */
  useEffect(() => {
    const mql = window.matchMedia(resolvedQuery);
    const onChange = () => setMatches(mql.matches);
    mql.addEventListener("change", onChange);
    setMatches(mql.matches);
    return () => mql.removeEventListener("change", onChange);
  }, [resolvedQuery]);

  return !!matches;
};
