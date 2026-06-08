import { ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/shared/components/ui/item";

interface OptionItemContentProps {
  /** Already-translated option label. */
  label: string;
  /** Already-translated option description (optional). */
  description?: string;
  /** Option image — base64 data URL or remote URL (optional). */
  image?: string;
}

/**
 * Shared content for an option row in a dropdown/combobox/select, built from the
 * shadcn `Item` primitives: an optional leading image, the label, and an
 * optional muted description underneath. Rendered as a fragment — the enclosing
 * `CommandItem`/`SelectItem` already provides the flex row. The selection
 * indicator (check) is left to the caller so it can sit outside this block.
 */
const OptionItemContent = ({ label, description, image }: OptionItemContentProps) => (
  <>
    {image && (
      <ItemMedia variant="image">
        <img src={image} alt="" />
      </ItemMedia>
    )}
    <ItemContent className="tg:min-w-0 tg:gap-0">
      <ItemTitle className="tg:block tg:w-full tg:truncate tg:font-normal">{label}</ItemTitle>
      {description && <ItemDescription className="tg:line-clamp-1">{description}</ItemDescription>}
    </ItemContent>
  </>
);

export default OptionItemContent;
