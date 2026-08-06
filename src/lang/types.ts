import type { EN } from './en/index.js';

/**
 * English is the shape every other catalog is checked against: `es/index.ts`
 * declares itself as this type, so a key it does not answer for is a build
 * error rather than a blank label someone runs into.
 *
 * Extra keys are not a compile error — an object assigned from a variable is
 * not excess-property checked — which is what `tests/shared/lang.test.ts` is
 * for.
 */
export type Messages = typeof EN;
