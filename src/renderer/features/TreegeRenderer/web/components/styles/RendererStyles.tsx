import css from "@/renderer/styles/style.css?inline";

// React 19+ hoists this <style> into <head> and deduplicates by href,
// so the CSS lands before first paint in SSR and CSR alike — no FOUC.
// React 18 ignores href/precedence and renders the <style> in place;
// the browser still applies the CSS before painting the content below.
const RendererStyles = () => (
  <style href="treege-renderer" precedence="default">
    {css}
  </style>
);

export default RendererStyles;
