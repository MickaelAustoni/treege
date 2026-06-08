import { createContext, type PropsWithChildren, useContext } from "react";

/**
 * The DOM element that floating overlays (e.g. popovers) should portal into,
 * instead of `document.body`.
 *
 * Each surface declares its own container by nesting a provider, and the
 * nearest one wins — context follows the React tree, so it crosses Radix
 * portals (a Sheet/Dialog overrides the editor's container for the popovers it
 * contains). `null` means "portal to body" (the Radix default).
 *
 * Why this exists: inline content stays trapped in a transformed node's
 * stacking context (other nodes paint over it), while a `document.body` portal
 * escapes a host modal (e.g. MUI) the editor is embedded in and renders behind
 * it or gets focus-trapped out. Portaling into the editor's own root clears
 * both — above the nodes, still inside the modal.
 */
const PortalContainerContext = createContext<HTMLElement | null>(null);

export const usePortalContainer = () => useContext(PortalContainerContext);

export const PortalContainerProvider = ({ container, children }: PropsWithChildren<{ container: HTMLElement | null }>) => (
  <PortalContainerContext.Provider value={container}>{children}</PortalContainerContext.Provider>
);
