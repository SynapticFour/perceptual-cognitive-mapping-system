'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

type ErrorBoundaryProps = {
  children: ReactNode;
  title: string;
  body: string;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

/**
 * Catches render/runtime errors in subtree and shows a recoverable message instead of a blank screen.
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
          <div className="max-w-md rounded-xl border border-rose-200 bg-white p-6 text-center shadow">
            <h1 className="text-lg font-semibold text-slate-900">{this.props.title}</h1>
            <p className="mt-2 text-sm text-slate-600">{this.props.body}</p>
            <button
              type="button"
              className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              onClick={() => window.location.assign('/')}
            >
              Return home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
