import { useState } from 'react';
import { APP_NAME } from '@shared/brand.js';
import { useMessages } from '@/shared/i18n/useMessages.js';
import { Button } from '@/shared/ui/Button.js';
import { PlusIcon } from '@/shared/ui/icons.js';
import { NameDialog } from '@/shared/ui/NameDialog.js';
import { useWelcomeWorkspaces } from './useWelcomeWorkspaces.js';
import { WelcomeFlight } from './WelcomeFlight.js';
import { WelcomeRecent } from './WelcomeRecent.js';

const BRAND_MARK_URL = new URL('../../../../resources/images/icon.svg', import.meta.url).href;

/** Startup stays focused: choose one document or create the first one. */
export function WelcomeScreen() {
  const messages = useMessages().welcome;
  const list = useWelcomeWorkspaces();
  const [naming, setNaming] = useState(false);

  return (
    <main className="welcome-layout absolute inset-0 grid overflow-hidden bg-app px-8 pt-15 pb-8">
      <section
        className="welcome-content-runtime flex min-h-0 w-full max-w-welcome flex-col self-center justify-self-center"
        aria-labelledby="welcome-title"
      >
        <div
          className="mb-8 flex items-center gap-2 text-section font-semibold tracking-brand text-foreground"
          aria-label={APP_NAME}
        >
          <img className="block h-5 w-5" src={BRAND_MARK_URL} alt="" />
          {APP_NAME}
        </div>
        <p className="text-kicker font-semibold tracking-kicker text-muted uppercase">
          {messages.kicker}
        </p>
        <h1
          id="welcome-title"
          className="mt-2 max-w-welcome-title text-welcome-title leading-welcome font-semibold tracking-welcome text-foreground"
        >
          {messages.title}
        </h1>
        <p className="mt-4 max-w-welcome-intro text-ui leading-intro text-muted">
          {messages.intro}
        </p>
        <Button
          className="mt-6 min-h-titlebar w-full px-4"
          tone="primary"
          onClick={() => {
            setNaming(true);
          }}
        >
          <PlusIcon />
          {messages.create}
        </Button>

        <WelcomeRecent
          summaries={list.summaries}
          status={list.status}
          error={list.error}
          onOpen={list.open}
          onDiscard={list.discard}
        />
      </section>

      <WelcomeFlight />

      {naming && (
        <NameDialog
          open
          title={messages.newWorkspace}
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
