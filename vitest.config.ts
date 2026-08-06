import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

const shared = resolve(import.meta.dirname, 'src/shared');
const renderer = resolve(import.meta.dirname, 'src/renderer');
const lang = resolve(import.meta.dirname, 'src/lang');

export default defineConfig({
  resolve: { alias: { '@shared': shared, '@lang': lang, '@': renderer } },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'node',
          environment: 'node',
          include: ['tests/{shared,main}/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'renderer',
          environment: 'jsdom',
          // Testing Library registers its afterEach cleanup only when a global
          // hook exists; without it, DOM from one test leaks into the next.
          globals: true,
          setupFiles: ['tests/renderer/setup.ts'],
          include: ['tests/renderer/**/*.test.{ts,tsx}'],
        },
      },
    ],
  },
});
