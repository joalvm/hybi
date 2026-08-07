import { format } from '@lang/translate.js';
import type { BinaryFile } from '@shared/ipc/contract.js';
import { useMessages } from '@/shared/i18n/useMessages.js';
import { Button } from '@/shared/ui/Button.js';

type Props = {
  file: BinaryFile | null;
  onPick: () => void;
};

/**
 * What stands in for the editor while the payload is a file. The bytes are held
 * by the composer and sent straight from there, so all this shows is which file
 * is loaded — the editor never sees a spelling of it.
 */
export function BinaryAttachment({ file, onPick }: Props) {
  const messages = useMessages().composer.binary;

  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-3 text-label">
      {file === null ? (
        <p className="text-muted">{messages.noFile}</p>
      ) : (
        <>
          <p className="font-semibold">{file.name}</p>
          <p className="text-muted">{format(messages.size, { count: file.bytes })}</p>
        </>
      )}
      <Button className="min-h-5.5 px-3" onClick={onPick}>
        {file === null ? messages.choose : messages.replace}
      </Button>
    </div>
  );
}
