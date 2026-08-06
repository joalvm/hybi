import { Component, type ErrorInfo, type ReactNode } from 'react';
import { currentMessages } from '@/shared/i18n/useMessages.js';
import { Button } from '@/shared/ui/Button.js';

type Props = { children: ReactNode };
type State = { message: string | null };

/**
 * A class component because React exposes no hook for render errors. Both the
 * Welcome screen and editor sit below it, so either can offer the same reload.
 */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { message: null };

  static getDerivedStateFromError(error: Error): State {
    return { message: error.message };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(error, info.componentStack);
  }

  override render(): ReactNode {
    if (this.state.message === null) return this.props.children;
    return (
      <div className="flex flex-col items-start gap-3 p-3 text-error" role="alert">
        <p>{this.state.message}</p>
        <Button
          onClick={() => {
            window.location.reload();
          }}
        >
          {currentMessages().common.reload}
        </Button>
      </div>
    );
  }
}
