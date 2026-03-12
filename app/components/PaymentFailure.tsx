"use client";

export default function PaymentFailure({
  message,
  onRetry,
}: {
  message?: string;
  onRetry: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-red-600 to-rose-800 flex items-center justify-center text-white animate-fadeIn">
      <div className="text-center scale-110 animate-shake">
        <div className="w-20 h-20 rounded-full bg-red-500/10 border-2 border-red-500/20 flex items-center justify-center mx-auto mb-4"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg></div>
        <h1 className="text-3xl font-bold">Payment Failed</h1>
        <p className="text-sm mt-2 opacity-80">
          {message || "Something went wrong"}
        </p>

        <button
          onClick={onRetry}
          className="mt-6 px-6 py-3 rounded-full bg-white text-red-700 font-semibold"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
