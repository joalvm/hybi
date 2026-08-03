import type { RetryPolicy } from '@shared/domain/connections/websocket.js';
import { NumberField } from '../../settings/NumberField.js';
import { ToggleField } from '../../settings/ToggleField.js';

type Props = {
  retry: RetryPolicy;
  onChange: (retry: RetryPolicy) => void;
};

/**
 * Reconnection after the peer drops a connection that had reached `open`. A
 * first attempt that never connects is reported instead of retried, and a close
 * the user asked for is final — neither is affected by anything here.
 */
export function RetryFields({ retry, onChange }: Props) {
  return (
    <section className="settings-section">
      <h3 className="settings-section__title">Reintentos</h3>
      <ToggleField
        label="Reconectar cuando el servidor corta"
        hint="No afecta a un primer intento fallido ni a una desconexión manual."
        checked={retry.enabled}
        onChange={(enabled) => {
          onChange({ ...retry, enabled });
        }}
      />
      <div className="settings-grid">
        <NumberField
          label="Intentos"
          value={retry.attempts}
          min={0}
          max={100}
          disabled={!retry.enabled}
          onChange={(attempts) => {
            onChange({ ...retry, attempts });
          }}
        />
        <NumberField
          label="Espera inicial (ms)"
          value={retry.baseMs}
          min={100}
          max={60000}
          disabled={!retry.enabled}
          onChange={(baseMs) => {
            onChange({ ...retry, baseMs });
          }}
        />
        <NumberField
          label="Espera máxima (ms)"
          value={retry.maxMs}
          min={100}
          max={300000}
          disabled={!retry.enabled}
          onChange={(maxMs) => {
            onChange({ ...retry, maxMs });
          }}
        />
      </div>
    </section>
  );
}
