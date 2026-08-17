import { Component, type ErrorInfo, type ReactNode } from "react";
import { captureError } from "@/lib/capture";
import { Button } from "@/components/ui/Button";

interface Props {
  children: ReactNode;
  /** Human label for logging context. */
  label?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  ref: string | null;
}

/**
 * Error boundary (L6). Catches render/lifecycle errors and shows a friendly,
 * branded error screen with a reference id. Never lets one crash blank the app.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, ref: null };

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const ref = captureError(error, `ErrorBoundary[${this.props.label ?? "root"}]`);
    this.setState({ ref });
    console.error(info.componentStack);
  }

  private handleReset = () => {
    this.props.onReset?.();
    this.setState({ hasError: false, ref: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-container-margin text-center bg-background">
        <span className="material-symbols-outlined text-headline-xl text-error" aria-hidden="true">
          error
        </span>
        <h1 className="font-headline-lg text-headline-lg text-on-surface">Something went wrong</h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-sm">
          An unexpected error occurred. Your booking data is safe.
        </p>
        {this.state.ref && (
          <p className="font-label-sm text-label-sm text-on-surface-variant">
            Error ref: <span className="font-label-bold text-primary-container">{this.state.ref}</span>
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="primary" onClick={() => window.location.reload()}>
            Reload
          </Button>
          <Button variant="secondary" onClick={this.handleReset}>
            Try again
          </Button>
        </div>
      </div>
    );
  }
}
