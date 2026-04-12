import { AlertTriangle, RefreshCcw } from "lucide-react";
import { APIError } from "@/lib/api";

interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
  title?: string;
}

export function ErrorState({ error, onRetry, title = "Something went wrong" }: ErrorStateProps) {
  const isApiError = error instanceof APIError;
  const status = isApiError ? error.status : null;

  let message = "We encountered an unexpected error while fetching data.";
  let description = "Please check your connection and try again.";

  if (status === 404) {
    message = "Resource not found";
    description = "The requested data could not be found on our servers.";
  } else if (status && status >= 500) {
    message = "Server is currently unavailable";
    description = "Our backend service is experiencing issues or undergoing maintenance (HTTP " + status + ").";
  } else if (error instanceof Error) {
    description = error.message;
  }

  return (
    <div className="flex flex-col items-center justify-center p-12 bg-red-50 rounded-2xl border border-red-100 text-center animate-in fade-in zoom-in duration-300">
      <div className="bg-red-100 p-4 rounded-full mb-6">
        <AlertTriangle className="w-10 h-10 text-red-600" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-red-700 font-medium mb-1">{message}</p>
      <p className="text-red-500 text-sm mb-8 max-w-md">{description}</p>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-sm"
        >
          <RefreshCcw className="w-4 h-4" /> Try Again
        </button>
      )}
    </div>
  );
}
