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
        <div className="text-7xl mb-4">❌</div>
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
