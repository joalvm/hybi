import { useMemo, useState } from 'react';
import type { BinaryFile } from '@shared/ipc/contract.js';
import { bridge } from '@/ipc/bridge.js';
import { readBinary, type BinaryPayload, type BinarySource } from './binary.js';

export type BinaryComposer = {
  source: BinarySource;
  setSource: (source: BinarySource) => void;
  /** The picked file, kept whole and out of the editor. */
  file: BinaryFile | null;
  pickFile: () => void;
  /** What would leave, or `null` while the payload cannot be read. */
  payload: BinaryPayload | null;
  /** A failed pick, said in the words the main process used. */
  error: string | null;
};

/**
 * The binary side of the composer: where the bytes come from and whether they
 * can be read yet.
 *
 * A picked file never reaches the editor. Four megabytes would become eight
 * megabytes of hex inside Monaco, which is how the composer becomes unusable
 * for exactly the frames this mode exists to send — so the file is held here
 * and the draft is left alone.
 */
export function useBinaryPayload(text: string, active: boolean): BinaryComposer {
  const [source, setSource] = useState<BinarySource>('hex');
  const [file, setFile] = useState<BinaryFile | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Only while the composer is in binary mode: every other format would pay for
  // parsing a payload nobody is going to read, once per keystroke.
  const written = useMemo(
    () => (!active || source === 'file' ? null : readBinary(text, source)),
    [active, text, source],
  );

  return {
    source,
    setSource: (next) => {
      setSource(next);
      setError(null);
    },
    file,
    pickFile: () => {
      void bridge.file
        .pickBinary()
        .then((outcome) => {
          if (outcome.ok) {
            setFile({ name: outcome.name, body: outcome.body, bytes: outcome.bytes });
            setError(null);
            return;
          }
          // Cancelling is an answer, not a failure: it leaves what was there.
          if (!('cancelled' in outcome)) setError(outcome.error);
        })
        .catch((cause: unknown) => {
          setError(cause instanceof Error ? cause.message : String(cause));
        });
    },
    payload: source === 'file' ? file : written,
    error,
  };
}
