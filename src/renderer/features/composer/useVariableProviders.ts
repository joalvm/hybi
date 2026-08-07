import { useEffect } from 'react';
import type { VariableScope } from '@shared/variables/resolve.js';
import { registerVariableProviders } from '@/shared/monaco/setup.js';
import { useStore } from '@/store/index.js';
import { selectScopeFor } from '@/store/selectors.js';

/** A module constant so the hover provider keeps a stable empty scope. */
const EMPTY_SCOPE: VariableScope = new Map();

/**
 * Monaco's hover and completion providers are global, so they read the scope of
 * whatever connection is active at call time rather than closing over one.
 */
export function useVariableProviders(): void {
  useEffect(() => {
    registerVariableProviders(() => {
      const state = useStore.getState();
      const activeId = state.activeConnectionId;
      return activeId === null ? EMPTY_SCOPE : selectScopeFor(activeId)(state);
    });
  }, []);
}
