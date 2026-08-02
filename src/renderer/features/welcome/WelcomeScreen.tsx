import { useState } from 'react';
import { PlusIcon } from '@/shared/ui/icons.js';
import { NameDialog } from '@/shared/ui/NameDialog.js';
import { useWelcomeWorkspaces } from './useWelcomeWorkspaces.js';
import { WelcomeFlight } from './WelcomeFlight.js';
import { WelcomeRecent } from './WelcomeRecent.js';

const BRAND_MARK_URL = new URL('../../../../resources/images/icon.svg', import.meta.url).href;

/** Startup stays focused: choose one document or create the first one. */
export function WelcomeScreen() {
  const list = useWelcomeWorkspaces();
  const [naming, setNaming] = useState(false);

  return (
    <main className="welcome">
      <section className="welcome__content" aria-labelledby="welcome-title">
        <div className="welcome__brand" aria-label="Hybi">
          <img className="welcome__brand-mark" src={BRAND_MARK_URL} alt="" />
          Hybi
        </div>
        <p className="welcome__kicker">Cliente WebSocket</p>
        <h1 id="welcome-title" className="welcome__title">
          Tus workspaces
        </h1>
        <p className="welcome__intro">
          Abre un workspace reciente o crea uno para empezar a trabajar.
        </p>
        <button
          type="button"
          className="button button--primary welcome__create"
          onClick={() => {
            setNaming(true);
          }}
        >
          <PlusIcon />
          Crear workspace
        </button>

        <WelcomeRecent
          summaries={list.summaries}
          status={list.status}
          error={list.error}
          onOpen={list.open}
        />
      </section>

      <WelcomeFlight />

      {naming && (
        <NameDialog
          open
          title="Nuevo workspace"
          initial=""
          onSubmit={(name) => {
            list.create(name);
            setNaming(false);
          }}
          onClose={() => {
            setNaming(false);
          }}
        />
      )}
    </main>
  );
}
