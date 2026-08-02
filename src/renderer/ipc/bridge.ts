import type { WorkbenchBridge } from '@shared/ipc/contract.js';

declare global {
  interface Window {
    workbench: WorkbenchBridge;
  }
}

/**
 * The single point where the renderer touches the preload. Every other module
 * imports this binding, so a test replaces one module instead of patching a
 * global.
 */
export const bridge: WorkbenchBridge = window.workbench;
