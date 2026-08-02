import EditorWorker from 'monaco-editor/editor/editor.worker.js?worker';
import JsonWorker from 'monaco-editor/languages/features/json/json.worker.js?worker';

/**
 * Only two workers ship: the editor core and JSON. Every other label falls back
 * to the core worker, which is what keeps the css/html/typescript language
 * workers out of the bundle.
 */
export function installWorkers(): void {
  self.MonacoEnvironment = {
    getWorker(_workerId: string, label: string) {
      return label === 'json' ? new JsonWorker() : new EditorWorker();
    },
  };
}
