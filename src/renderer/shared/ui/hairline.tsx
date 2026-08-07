import type { LucideIcon, LucideProps } from 'lucide-react';

/** Centralizes glyph weight, size, and accessibility so every icon stays consistent. */
const HAIRLINE: LucideProps = {
  size: 14,
  strokeWidth: 1,
  absoluteStrokeWidth: true,
  'aria-hidden': true,
  focusable: false,
};

/**
 * Wraps one Lucide glyph in the app's weight. Its own module so that `icons.tsx`
 * is nothing but the list of glyphs the app uses and what each one means.
 *
 * Props still win over the defaults, so one caller can ask for a larger glyph.
 */
export function hairline(Glyph: LucideIcon) {
  return function Icon(props: LucideProps) {
    return <Glyph {...HAIRLINE} {...props} />;
  };
}
