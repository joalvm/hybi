/**
 * The subset of Markdown an AsyncAPI `summary` or `description` actually uses.
 * It is an AST and never a string of HTML: the text comes from a document the
 * user imported, so nothing here can end up as markup the renderer executes.
 */
export type Inline =
  | { kind: 'text'; text: string }
  | { kind: 'code'; text: string }
  | { kind: 'strong'; children: Inline[] }
  | { kind: 'em'; children: Inline[] }
  | { kind: 'link'; href: string; children: Inline[] };

export type Block =
  | { kind: 'heading'; level: number; children: Inline[] }
  | { kind: 'paragraph'; children: Inline[] }
  | { kind: 'list'; ordered: boolean; items: Inline[][] }
  | { kind: 'quote'; children: Inline[] }
  | { kind: 'fence'; language: string; text: string }
  | { kind: 'rule' };
