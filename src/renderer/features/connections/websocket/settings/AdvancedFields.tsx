import type { WebSocketTransportSettings } from '@shared/domain/connections/websocket.js';
import { ShieldAlertIcon } from '@/shared/ui/icons.js';
import { NumberField } from '../../settings/NumberField.js';
import { ProtocolsField } from './ProtocolsField.js';
import { ToggleField } from '../../settings/ToggleField.js';

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
    <section className="settings-section">
      <h3 className="settings-section__title">Avanzado</h3>
      <ProtocolsField
        protocols={settings.protocols}
        onChange={(protocols) => {
          onChange({ protocols });
        }}
      />
      <div className="settings-grid">
        <NumberField
          label="Tamaño máximo de mensaje (KiB)"
          value={Math.round(settings.maxMessageBytes / KIB)}
          min={1}
          max={102400}
          onChange={(kib) => {
            onChange({ maxMessageBytes: kib * KIB });
          }}
        />
      </div>
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
        <p className="settings-warning" role="alert">
          <ShieldAlertIcon />
          <span>
            Sin verificación se acepta cualquier certificado, incluido el de un tercero que
            se interponga: el tráfico de esta conexión puede ser leído y modificado sin que
            se note. Úsalo solo contra un servidor de desarrollo bajo tu control.
          </span>
        </p>
      )}
    </section>
  );
}
