import { version as reactVersion } from "react";

// React 19 hoists <style href precedence> to <head> and deduplicates across
// mounts. React 18 doesn't know these props, so we omit them to avoid dev
// warnings — the <style> is rendered in place and the browser applies it
// before painting the content below.
const supportsStyleHoisting = Number.parseInt(reactVersion, 10) >= 19;

interface InlineStylesProps {
  id: string;
  css: string;
}

const InlineStyles = ({ id, css }: InlineStylesProps) => {
  const hoistingProps = supportsStyleHoisting ? { href: id, precedence: "default" } : {};

  return <style {...hoistingProps} dangerouslySetInnerHTML={{ __html: css }} />;
};

export default InlineStyles;
