/**
 * Interface text belongs in `src/lang`. A literal in a component is a string
 * only one language can read, and it is invisible until someone switches: the
 * catalog stays honest only if nothing is allowed to bypass it.
 *
 * Attributes are checked as well as text nodes because half the wording in this
 * app never becomes a text node — it is an `aria-label` on an icon button or a
 * `placeholder` in a field.
 */
const TEXT_ATTRIBUTES = new Set([
  'alt',
  'aria-label',
  'cancelLabel',
  'confirmLabel',
  'description',
  'hint',
  'label',
  'placeholder',
  'title',
]);

/** Punctuation and separators carry no language, so they are not text. */
const HAS_LETTER = /\p{L}/u;

export const noLiteralUiText = {
  meta: {
    type: 'problem',
    docs: { description: 'Interface text comes from the catalogs in src/lang.' },
    schema: [],
    messages: {
      text: 'Interface text belongs in src/lang; read it with useMessages().',
      attribute: '`{{name}}` is read by a person: take it from src/lang with useMessages().',
    },
  },
  create(context) {
    return {
      JSXText(node) {
        if (!HAS_LETTER.test(node.value)) return;
        context.report({ node, messageId: 'text' });
      },
      JSXAttribute(node) {
        const name = node.name.type === 'JSXIdentifier' ? node.name.name : null;
        if (name === null || !TEXT_ATTRIBUTES.has(name)) return;

        const value = node.value;
        if (value === null || value.type !== 'Literal') return;
        if (typeof value.value !== 'string' || !HAS_LETTER.test(value.value)) return;

        context.report({ node: value, messageId: 'attribute', data: { name } });
      },
    };
  },
};
