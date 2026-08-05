import { useMemo, useState } from 'react';
import type { Variable } from '@shared/domain/types.js';
import type { VariableScope } from '@shared/variables/resolve.js';
import { variableQuery } from './urlSegments.js';

export type UrlSuggestions = {
  variables: readonly Variable[];
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  /** Moves the highlight by a signed step, wrapping at both ends. */
  step: (delta: number) => void;
  /** The URL with the in-progress `{{query` closed as `{{name}}`. */
  complete: (name: string) => { url: string; caret: number } | null;
  /** Hides the list for the query being typed, until that query changes. */
  dismiss: () => void;
};

/**
 * The list is derived from the text, never stored: whatever the field holds
 * after `{{` is the query, so no keystroke has to be mirrored into state. Only
 * the highlight and an explicit dismissal are state, because neither can be
 * read back out of the URL.
 */
export function useUrlSuggestions(value: string, scope: VariableScope): UrlSuggestions {
  const [activeIndex, setActiveIndex] = useState(0);
  const [dismissed, setDismissed] = useState<string | null>(null);
  const query = variableQuery(value);

  const matches = useMemo(() => {
    if (query === null) return [];
    const normalized = query.toLocaleLowerCase();
    return [...scope.values()].filter((variable): variable is Variable =>
      variable.name.toLocaleLowerCase().startsWith(normalized),
    );
  }, [query, scope]);

  const variables = query === null || query === dismissed ? [] : matches;
  const selected = variables.length === 0 ? -1 : Math.min(activeIndex, variables.length - 1);

  return {
    variables,
    activeIndex: selected,
    setActiveIndex,
    step: (delta) => {
      if (variables.length === 0) return;
      setActiveIndex((current) => {
        const next = (Math.min(current, variables.length - 1) + delta) % variables.length;
        return next < 0 ? next + variables.length : next;
      });
    },
    complete: (name) => {
      const start = value.lastIndexOf('{{');
      if (start < 0 || query === null) return null;
      setActiveIndex(0);
      return {
        url: `${value.slice(0, start)}{{${name}}}${value.slice(start + 2 + query.length)}`,
        caret: start + name.length + 4,
      };
    },
    dismiss: () => {
      setDismissed(query);
    },
  };
}
