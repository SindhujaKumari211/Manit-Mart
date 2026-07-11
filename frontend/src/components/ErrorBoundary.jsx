import { Component } from "react";

/**
 * Catches render/lifecycle errors in its subtree so a single broken component
 * can't take down the whole app.
 *
 * Props:
 *  - variant: "page" (default) full-screen fallback, or "section" for a compact
 *    inline card that keeps the rest of the page alive.
 *  - label:  optional name shown in the section fallback ("Couldn't load {label}").
 */
class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Unhandled UI error:", error, info?.componentStack || info);
  }

  handleRetry = () => this.setState({ hasError: false });

  render() {
    if (this.state.hasError) {
      if (this.props.variant === "section") {
        return (
          <div className="my-4 rounded-xl border border-slate-200 bg-slate-50 p-6 text-center">
            <p className="text-sm font-semibold text-slate-700">
              Couldn&apos;t load {this.props.label || "this section"}.
            </p>
            <button
              onClick={this.handleRetry}
              className="mt-3 px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-brand-800 hover:bg-brand-700 transition"
            >
              Try again
            </button>
          </div>
        );
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
          <div className="max-w-md w-full text-center bg-white rounded-2xl border border-slate-100 shadow-soft p-8">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-red-50 flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-800">Something went wrong</h1>
            <p className="text-sm text-slate-500 mt-2">
              An unexpected error occurred. Try reloading the page — if it keeps happening, please let us know.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-brand-900 to-brand-700 hover:from-brand-800 hover:to-brand-600 shadow-soft transition"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
