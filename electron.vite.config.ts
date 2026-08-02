import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'electron-vite';

const shared = resolve(import.meta.dirname, 'src/shared');
const renderer = resolve(import.meta.dirname, 'src/renderer');

export default defineConfig({
  main: {
    resolve: { alias: { '@shared': shared } },
    build: {
      externalizeDeps: true,
      rollupOptions: { input: resolve(import.meta.dirname, 'src/main/index.ts') },
    },
  },
  preload: {
    resolve: { alias: { '@shared': shared } },
    build: {
      externalizeDeps: true,
      // Sandboxed preload scripts cannot use ESM imports, so this bundle stays CommonJS.
      rollupOptions: {
        input: resolve(import.meta.dirname, 'src/preload/index.ts'),
        output: { format: 'cjs', entryFileNames: 'index.cjs' },
      },
    },
  },
  renderer: {
    root: renderer,
    plugins: [react()],
    resolve: { alias: { '@shared': shared, '@': renderer } },
    build: {
      minify: 'esbuild',
      rollupOptions: { input: resolve(renderer, 'index.html') },
      chunkSizeWarningLimit: 2048,
    },
  },
});
