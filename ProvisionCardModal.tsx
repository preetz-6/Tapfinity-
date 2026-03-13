"use client";

import { useEffect, useRef, useState, useCallback } from "react";

declare global {
  interface NDEFRecord { recordType: string; mediaType?: string; data?: ArrayBuffer | string; }
  interface NDEFWriteOptions { records: NDEFRecord[]; }
  interface NDEFReader { write(data: NDEFWriteOptions): Promise<void>; }
  interface Window { NDEFReader: { new(): NDEFReader }; }
}

type ProvisionUser = { id: string; email: string; hasCard: boolean; };
type Status = "CONFIRM" | "WAITING" | "SUCCESS" | "ERROR";

export default function ProvisionCardModal({ open, user, pin, onClose }: {
  open: boolean; user: ProvisionUser | null; pin: string; onClose: () => void;
}) {
  const [requestId, setRequestId] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>(user?.hasCard ? "CONFIRM" : "WAITING");
  const [secondsLeft, setSecondsLeft] = useState(20);
  const [errorMsg, setErrorMsg] = useState("");

  const pollRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const startedRef = useRef(false);

  const cleanup = useCallback(() => {
    if (pollRef.current !== null) { clearInterval(pollRef.current); pollRef.current = null; }
    if (timerRef.current !== null) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const handleCancel = useCallback(() => {
    cleanup();
    setTimeout(onClose, 100);
  }, [cleanup, onClose]);

  async function writeCard(reqId: string) {
    if (!("NDEFReader" in window)) {
      setErrorMsg("Web NFC not supported on this device/browser.");
      setStatus("ERROR");
      return;
    }
    try {
      const secret  = crypto.randomUUID();
      const payload = new TextEncoder().encode(JSON.stringify({ tpf: "1", secret }));
      const ndef    = new window.NDEFReader();

      // Use mime — "text" records inject a status byte + language code prefix
      // which corrupts JSON.parse on the merchant read side
      await ndef.write({
        records: [{ recordType: "mime", mediaType: "application/json", data: payload.buffer }],
      });

      const res = await fetch("/api/admin/provision-card/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: reqId, cardSecret: secret }),
      });
      if (!res.ok) {
        const d = await res.json();
        setErrorMsg(d.error || "Failed to confirm card");
        setStatus("ERROR");
      }
    } catch (err) {
      console.error("NFC Write Failed:", err);
      setErrorMsg("Failed to write to card. Make sure the card is close and try again.");
      setStatus("ERROR");
    }
  }

  async function startProvisioning() {
    startedRef.current = true;
    setStatus("WAITING");
    setSecondsLeft(20);

    const res = await fetch("/api/admin/provision-card", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user!.id, pin }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErrorMsg(data.error || "Failed to create provision request");
      setStatus("ERROR");
      return;
    }
    setRequestId(data.requestId);
    await writeCard(data.requestId);
  }

  // Auto-start if no existing card
  useEffect(() => {
    if (!open || !user || startedRef.current) return;
    if (!user.hasCard) startProvisioning();
    else setStatus("CONFIRM");
    return cleanup;
  }, [open, user]);

  // Countdown
  useEffect(() => {
    if (!open || status !== "WAITING") return;
    timerRef.current = window.setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) { handleCancel(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current !== null) clearInterval(timerRef.current); };
  }, [open, status, handleCancel]);

  // Poll
  useEffect(() => {
    if (!open || !requestId || status !== "WAITING") return;
    pollRef.current = window.setInterval(async () => {
      const res = await fetch(`/api/admin/provision-card/confirm?requestId=${requestId}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.status === "COMPLETED") { cleanup(); setStatus("SUCCESS"); }
    }, 1500);
    return () => { if (pollRef.current !== null) clearInterval(pollRef.current); };
  }, [open, requestId, status, cleanup]);

  if (!open || !user) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-[#080f20] border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-fade-up">

        {/* CONFIRM RELINK */}
        {status === "CONFIRM" && (
          <div className="p-7 space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>
            <div className="text-center">
              <h2 className="text-lg font-bold text-white">Card Already Linked</h2>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                <span className="text-white font-medium">{user.email}</span> already has an NFC card provisioned.
              </p>
              <div className="mt-3 rounded-xl bg-amber-500/10 border border-amber-500/15 px-4 py-3 text-left">
                <p className="text-xs text-amber-400 font-semibold mb-1">⚠ Warning</p>
                <p className="text-xs text-amber-300/80 leading-relaxed">
                  The existing card will immediately stop working. Only proceed if you are replacing a lost or damaged card.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleCancel}
                className="flex-1 rounded-xl border border-white/10 py-3 text-sm text-gray-400 hover:bg-white/5 transition">
                Cancel
              </button>
              <button onClick={startProvisioning}
                className="flex-1 rounded-xl bg-amber-500 hover:bg-amber-400 py-3 text-sm font-bold text-black transition active:scale-95">
                Replace Card
              </button>
            </div>
          </div>
        )}

        {/* WAITING / WRITING */}
        {status === "WAITING" && (
          <div className="p-7 text-center space-y-5">
            <div className="relative w-24 h-24 mx-auto">
              <div className="absolute inset-0 rounded-full border-2 border-blue-500/20 animate-ping" style={{ animationDuration: "2s" }} />
              <div className="absolute inset-2 rounded-full border-2 border-blue-500/30 animate-ping" style={{ animationDuration: "2s", animationDelay: "0.4s" }} />
              <div className="w-full h-full rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-blue-400"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M16 12a4 4 0 0 1-8 0"/></svg></div>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Hold Card to Phone</h2>
              <p className="text-sm text-gray-500 mt-1">Writing card data…</p>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                style={{ width: `${(secondsLeft / 20) * 100}%` }} />
            </div>
            <p className="text-xs text-gray-600">{secondsLeft}s remaining</p>
            <button onClick={handleCancel}
              className="text-sm text-gray-600 hover:text-gray-400 underline underline-offset-2 transition">
              Cancel
            </button>
          </div>
        )}

        {/* SUCCESS */}
        {status === "SUCCESS" && (
          <div className="p-7 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 border-2 border-emerald-500/30 flex items-center justify-center mx-auto"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-400"><polyline points="20 6 9 17 4 12"/></svg></div>
            <div>
              <h2 className="text-lg font-bold text-emerald-400">Card Linked!</h2>
              <p className="text-sm text-gray-500 mt-1">{user.email} can now tap to pay.</p>
              {user.hasCard && <p className="text-xs text-gray-600 mt-1">Previous card has been invalidated.</p>}
            </div>
            <button onClick={onClose}
              className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 py-3 text-sm font-semibold transition active:scale-95">
              Done
            </button>
          </div>
        )}

        {/* ERROR */}
        {status === "ERROR" && (
          <div className="p-7 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border-2 border-red-500/20 flex items-center justify-center mx-auto"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg></div>
            <div>
              <h2 className="text-lg font-bold text-red-400">Provisioning Failed</h2>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">{errorMsg}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={handleCancel}
                className="flex-1 rounded-xl border border-white/10 py-3 text-sm text-gray-400 hover:bg-white/5 transition">
                Close
              </button>
              <button onClick={() => { setStatus("WAITING"); startedRef.current = false; startProvisioning(); }}
                className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-500 py-3 text-sm font-semibold transition">
                Retry
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
