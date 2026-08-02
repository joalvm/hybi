import { bridge } from '@/ipc/bridge.js';
import { Badge } from '@/shared/ui/Badge.js';
import { Dialog } from '@/shared/ui/Dialog.js';
import { useAboutRequests } from './useAboutRequests.js';

const ICON = new URL('../../../../resources/images/icon.svg', import.meta.url).href;

/** `0.3.0-alpha.1` is the alpha phase; a stable version carries no suffix. */
function phaseOf(version: string): string | null {
  const suffix = version.split('-')[1];
  return suffix === undefined ? null : (suffix.split('.')[0] ?? null);
}

export function AboutDialog() {
  const { open, close } = useAboutRequests();
  const version = bridge.app.version;
  const phase = phaseOf(version);

  return (
    <Dialog open={open} title="Acerca de Hybi" size="sm" onClose={close}>
      <div className="about">
        <img className="about__mark" src={ICON} alt="" width={72} height={72} />
        <p className="about__name">Hybi</p>
        <p className="about__version">
          <span>{version}</span>
          {phase === null ? null : <Badge tone="warn">{phase}</Badge>}
        </p>
        <p className="about__text">Cliente de escritorio para conexiones en tiempo real.</p>
        {phase === null ? null : (
          <p className="about__text">
            Esta es una versión de prueba: la aplicación sigue en construcción, así que faltan
            funciones y algunas cosas cambiarán de una versión a otra.
          </p>
        )}
        <p className="about__note">El aviso de actualizaciones llegará en una versión próxima.</p>
        <p className="about__note">Publicado bajo licencia GPL-3.0.</p>
      </div>
    </Dialog>
  );
}
