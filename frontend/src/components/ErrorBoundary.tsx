import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error boundary catch:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-gray-50">
          <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full border border-gray-100">
            <div className="mb-6 flex justify-center">
              <div className="bg-red-100 p-3 rounded-full">
                <svg
                  className="w-12 h-12 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-gray-600 mb-6">
              The application encountered an unexpected error.
            </p>
            <div className="bg-red-50 p-4 rounded-lg text-left mb-6 overflow-hidden">
               <code className="text-xs text-red-800 break-words whitespace-pre-wrap block max-h-48 overflow-y-auto">
                 {this.state.error?.toString()}
               </code>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                Reload Page
              </button>
              <button
                onClick={() => (window.location.href = "/")}
                className="w-full px-6 py-2.5 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors shadow-sm"
              >
                Back to Search
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
