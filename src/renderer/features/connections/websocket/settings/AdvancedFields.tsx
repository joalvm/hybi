import type { WebSocketTransportSettings } from '@shared/domain/connections/websocket.js';
import { ShieldAlertIcon } from '@/shared/ui/icons.js';
import { NumberField } from '@/shared/ui/NumberField.js';
import { ToggleField } from '@/shared/ui/ToggleField.js';
import { ProtocolsField } from './ProtocolsField.js';

type Props = {
  settings: WebSocketTransportSettings;
  onChange: (next: Partial<WebSocketTransportSettings>) => void;
};

const KIB = 1024;

/**
 * Subprotocols, transport security and the payload ceiling.
 *
 * The ceiling is shown in KiB: the stored number is bytes, and a hundred
 * million of them is not a figure anyone reads off a field.
 */
export function AdvancedFields({ settings, onChange }: Props) {
  return (
    <div className="flex flex-col">
      <ProtocolsField
        protocols={settings.protocols}
        onChange={(protocols) => {
          onChange({ protocols });
        }}
      />
      <NumberField
        label="Tamaño máximo de mensaje"
        description="Un frame mayor cierra la conexión en vez de reservar memoria por él."
        value={Math.round(settings.maxMessageBytes / KIB)}
        min={1}
        max={102400}
        unit="KiB"
        onChange={(kib) => {
          onChange({ maxMessageBytes: kib * KIB });
        }}
      />
      <ToggleField
        label="Verificar el certificado del servidor"
        hint="Solo afecta a wss://."
        checked={settings.verifyCertificate}
        onChange={(verifyCertificate) => {
          onChange({ verifyCertificate });
        }}
      />
      {/* Permanent and in the panel, not a tooltip: this is the one setting here
          that removes a defence, and it has to be readable while it is off. */}
      {!settings.verifyCertificate && (
        <p
          className="mt-3 flex items-start gap-2 rounded-ui border border-error bg-chrome px-3 py-2 text-label text-error"
          role="alert"
        >
          <ShieldAlertIcon />
          <span>
            Sin verificación se acepta cualquier certificado, incluido el de un tercero que se
            interponga: el tráfico de esta conexión puede ser leído y modificado sin que se note.
            Úsalo solo contra un servidor de desarrollo bajo tu control.
          </span>
        </p>
      )}
    </div>
  );
}
