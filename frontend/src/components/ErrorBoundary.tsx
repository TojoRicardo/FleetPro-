import { Component, type ErrorInfo, type ReactNode } from 'react';
import ErrorFallback from '@/components/ui/ErrorFallback';

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
    if (import.meta.env.PROD) {
      // Hook for external error tracking (Sentry, etc.)
      window.dispatchEvent(new CustomEvent('fleetpro:error', { detail: { error, info } }));
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="min-h-screen flex items-center justify-center p-6">
          <ErrorFallback
            message={this.state.error?.message ?? 'An unexpected error occurred.'}
            onRetry={this.handleReset}
          />
        </div>
      );
    }

    return this.props.children;
  }
}
