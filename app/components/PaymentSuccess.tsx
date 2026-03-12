"use client";

import { useEffect, useState } from "react";

export default function PaymentSuccess({
  amount,
  name,
  transactionId,
  time,
  onDone,
}: {
  amount: number;
  name?: string;
  transactionId?: string;
  time?: string;
  onDone: () => void;
}) {
  const [showCard, setShowCard] = useState(false);

  // ⏱️ show details card after animation
  useEffect(() => {
    const t = setTimeout(() => setShowCard(true), 800);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center text-white">
      <div className="relative w-full max-w-sm px-6 text-center">
        {/* SUCCESS ICON */}
        <div className="w-20 h-20 rounded-full bg-emerald-500/15 border-2 border-emerald-500/30 flex items-center justify-center mx-auto mb-4 animate-pop"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-400"><polyline points="20 6 9 17 4 12"/></svg></div>

        <h1 className="text-3xl font-bold">Payment Successful</h1>
        <p className="text-xl mt-2">₹{amount}</p>

        {/* DETAILS CARD */}
        {showCard && (
          <div className="mt-6 rounded-2xl bg-white/15 backdrop-blur border border-white/30 p-4 text-left text-sm animate-slideUp">
            {name && (
              <div className="flex justify-between mb-2">
                <span className="opacity-80">From</span>
                <span className="font-medium">{name}</span>
              </div>
            )}

            {time && (
              <div className="flex justify-between mb-2">
                <span className="opacity-80">Date</span>
                <span>{time}</span>
              </div>
            )}

            {transactionId && (
              <div className="flex justify-between">
                <span className="opacity-80">Txn ID</span>
                <span className="text-xs truncate max-w-[140px]">
                  {transactionId}
                </span>
              </div>
            )}
          </div>
        )}

        {/* CTA */}
        <button
          onClick={onDone}
          className="mt-8 px-6 py-3 rounded-full bg-white text-green-700 font-semibold hover:scale-105 transition"
        >
          New Payment
        </button>
      </div>
    </div>
  );
}
