import type { WorkspaceSummary } from '@shared/domain/types.js';

type Props = {
  summaries: WorkspaceSummary[];
  status: 'loading' | 'ready' | 'error';
  error: string | null;
  onOpen: (workspaceId: string) => void;
};

/** The documents already on disk. Empty, loading and failed are all sayable. */
export function WelcomeRecent({ summaries, status, error, onOpen }: Props) {
  return (
    <div className="welcome__recent">
      <h2 className="welcome__section-title">Recientes</h2>

      {status === 'loading' && (
        <p className="welcome__status" role="status">
          Cargando workspaces…
        </p>
      )}
      {status === 'error' && (
        <p className="welcome__status welcome__status--error" role="alert">
          No se pudieron cargar los workspaces: {error}
        </p>
      )}
      {status === 'ready' && summaries.length === 0 && (
        <p className="welcome__status">Todavía no hay workspaces.</p>
      )}

      {summaries.length > 0 && (
        <nav aria-label="Workspaces recientes">
          <ul className="welcome__list">
            {summaries.map((workspace) => (
              <li key={workspace.id} className="welcome__item">
                <button
                  type="button"
                  className="welcome__link"
                  aria-label={`Abrir ${workspace.name}`}
                  onClick={() => {
                    onOpen(workspace.id);
                  }}
                >
                  <span className="welcome__link-mark" aria-hidden="true" />
                  <span className="welcome__link-name">{workspace.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
