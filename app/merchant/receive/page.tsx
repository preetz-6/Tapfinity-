"use client";

import { useEffect, useState, useRef, useCallback } from "react";

/* Web NFC types are not in standard TS libs — we cast at usage sites instead */
/* eslint-disable @typescript-eslint/no-explicit-any */

type State = "ENTER" | "WAITING" | "PROCESSING" | "SUCCESS" | "FAILED";
const WAIT_SECONDS = 20;

const FAILURE_MESSAGES: Record<string, { title: string; desc: string }> = {
  "INSUFFICIENT_BALANCE":            { title: "Insufficient Balance",  desc: "The customer's wallet doesn't have enough funds." },
  "CARD_NOT_PROVISIONED":            { title: "Card Not Recognised",   desc: "This NFC card hasn't been registered in the system." },
  "USER_BLOCKED":                    { title: "Account Blocked",       desc: "This customer's account is blocked. Contact admin." },
  "REQUEST_ALREADY_PROCESSED":       { title: "Already Processed",     desc: "This payment request was already used. Please create a new one." },
  "Too many attempts. Please wait.": { title: "Too Many Attempts",     desc: "Wait a few seconds before trying again." },
  "TIMEOUT":                         { title: "Timed Out",             desc: "No card was tapped in time." },
  "DAILY_LIMIT_EXCEEDED":            { title: "Daily Limit Reached",   desc: "The customer has hit their daily spending limit." },
  "NFC_NOT_SUPPORTED":               { title: "NFC Not Available",     desc: "Web NFC is only supported on Android Chrome. Make sure you're using Chrome, not a WebView or in-app browser." },
  "NFC_DISABLED":                    { title: "NFC is Turned Off",     desc: "Enable NFC in your phone's Settings → Connected devices → Connection preferences → NFC." },
  "NFC_PERMISSION_DENIED":           { title: "NFC Permission Denied", desc: "You denied the NFC permission. Tap Try Again and allow NFC access when prompted." },
  "NFC_READ_ERROR":                  { title: "Card Not Readable",     desc: "The card was detected but couldn't be read. Make sure the card has been provisioned by an admin. Hold it steady for 1-2 seconds." },
  "DEFAULT":                         { title: "Payment Failed",        desc: "Something went wrong processing this payment." },
};

export default function ReceivePayment() {
  const [amount, setAmount]               = useState("");
  const [state, setState]                 = useState<State>("ENTER");
  const [requestId, setRequestId]         = useState<string | null>(null);
  const [failureReason, setFailureReason] = useState("DEFAULT");
  const [timeLeft, setTimeLeft]           = useState(WAIT_SECONDS);
  const [successData, setSuccessData]     = useState<{ name?: string; balance?: number } | null>(null);

  const nfcStartedRef   = useRef(false);
  const nfcProcessedRef = useRef(false);
  const ndefRef         = useRef<NDEFReader | null>(null);

  const fail = useCallback((reason: string) => {
    setFailureReason(reason);
    setState("FAILED");
  }, []);

  const stopScan = useCallback(() => {
    if (ndefRef.current) {
      ndefRef.current.onreading = null;
      ndefRef.current.onreadingerror = null;
      ndefRef.current = null;
    }
  }, []);

  const reset = useCallback((keepAmount = false) => {
    stopScan();
    nfcStartedRef.current = false;
    nfcProcessedRef.current = false;
    if (!keepAmount) setAmount("");
    setRequestId(null);
    setTimeLeft(WAIT_SECONDS);
    setState("ENTER");
    setFailureReason("DEFAULT");
    setSuccessData(null);
  }, [stopScan]);

  /* ── Create payment request & go to WAITING ── */
  async function createRequest() {
    if (!amount || Number(amount) <= 0) return;
    nfcStartedRef.current = false;
    nfcProcessedRef.current = false;

    const res = await fetch("/api/merchant/payment-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: Number(amount) }),
    });
    const data = await res.json();
    if (!data.ok) { fail(data.error || "DEFAULT"); return; }

    setRequestId(data.requestId);
    setTimeLeft(WAIT_SECONDS);
    setState("WAITING");
  }

  /* ── Start NFC scan (fires AFTER state is already WAITING) ── */
  async function startNfcReader(reqId: string) {
    if (!("NDEFReader" in window)) {
      fail("NFC_NOT_SUPPORTED");
      return;
    }

    try {
      const NFC = (window as any).NDEFReader;
      const ndef = new NFC();
      ndefRef.current = ndef;

      try {
        await ndef.scan();
      } catch (scanErr: unknown) {
        const errName = scanErr instanceof DOMException ? scanErr.name : "";
        if (errName === "NotAllowedError") fail("NFC_PERMISSION_DENIED");
        else if (errName === "NotReadableError" || errName === "NotSupportedError") fail("NFC_DISABLED");
        else fail("NFC_NOT_SUPPORTED");
        return;
      }

      // Card tapped but no readable NDEF data
      ndef.onreadingerror = () => {
        if (nfcProcessedRef.current) return;
        nfcProcessedRef.current = true;
        stopScan();
        fail("NFC_READ_ERROR");
      };

      // Card read successfully
      ndef.onreading = async (event: any) => {
        if (nfcProcessedRef.current) return;
        nfcProcessedRef.current = true;

        const record = event.message.records[0];
        if (!record?.data) { fail("CARD_NOT_PROVISIONED"); return; }

        try {
          let decoded: string;

          if (record.recordType === "text") {
            // Text records include a status byte + language code prefix before the actual text.
            // e.g. \x02en{"tpf":"1","secret":"..."} — must strip the header.
            const bytes   = new Uint8Array(record.data.buffer, record.data.byteOffset, record.data.byteLength);
            const langLen = bytes[0] & 0x3F; // lower 6 bits = language code length
            decoded = new TextDecoder("utf-8").decode(bytes.slice(1 + langLen));
          } else {
            // mime/application+json and any other type — raw bytes, decode directly
            decoded = new TextDecoder().decode(record.data);
          }

          const parsed = JSON.parse(decoded);

          if (!parsed.secret) { fail("CARD_NOT_PROVISIONED"); return; }

          // Card read — show processing UI immediately
          setState("PROCESSING");

          const res = await fetch("/api/nfc/authorize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ requestId: reqId, cardSecret: parsed.secret }),
          });
          const result = await res.json();

          if (result.ok) {
            setSuccessData({ name: result.user?.name, balance: result.balance });
            setState("SUCCESS");
          } else {
            // API returns generic error + specific code separately (TAP-005)
            fail(result.code || result.error || "DEFAULT");
          }
        } catch {
          fail("DEFAULT");
        }

        stopScan();
      };
    } catch {
      fail("DEFAULT");
    }
  }

  /* ── Trigger NFC scan when state becomes WAITING (no state changes during scan) ── */
  useEffect(() => {
    if (state === "WAITING" && requestId && !nfcStartedRef.current) {
      nfcStartedRef.current = true;
      nfcProcessedRef.current = false;
      startNfcReader(requestId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, requestId]);

  /* ── Polling backup: check if request was fulfilled (safety net) ── */
  useEffect(() => {
    if (!requestId || state !== "WAITING") return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/merchant/payment-request/${requestId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.status === "USED" && !nfcProcessedRef.current) {
          nfcProcessedRef.current = true;
          stopScan();
          setState("SUCCESS");
        }
      } catch { /* ignore polling errors */ }
    }, 1500);
    return () => clearInterval(interval);
  }, [requestId, state, stopScan]);

  /* ── Countdown ── */
  useEffect(() => {
    if (state !== "WAITING") return;
    if (timeLeft <= 0) { fail("TIMEOUT"); return; }
    const t = setTimeout(() => setTimeLeft(v => v - 1), 1000);
    return () => clearTimeout(t);
  }, [state, timeLeft, fail]);

  /* ── Auto-reset after success ── */
  useEffect(() => {
    if (state !== "SUCCESS") return;
    const t = setTimeout(reset, 5000);
    return () => clearTimeout(t);
  }, [state, reset]);

  /* ── Cleanup on unmount ── */
  useEffect(() => () => stopScan(), [stopScan]);

  async function cancelRequest() {
    stopScan();
    if (requestId) await fetch(`/api/merchant/payment-request/${requestId}`, { method: "DELETE" }).catch(() => {});
    reset();
  }

  const progressPercent = (timeLeft / WAIT_SECONDS) * 100;
  const failure = FAILURE_MESSAGES[failureReason] ?? FAILURE_MESSAGES["DEFAULT"];



  return (
    <div className="min-h-[calc(100vh-60px)] lg:min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">

        {/* ENTER */}
        {state === "ENTER" && (
          <div>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-violet-500/15 border border-violet-500/20 mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-violet-400">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white">Receive Payment</h1>
              <p className="text-sm text-gray-500 mt-1">Enter amount to charge</p>
            </div>
            <div className="bg-[#0d1829] border border-white/10 rounded-2xl p-6 space-y-5">
              <div>
                <p className="text-xs text-gray-500 font-medium mb-3">Quick Select</p>
                <div className="grid grid-cols-4 gap-2">
                  {[20, 50, 100, 200].map(a => (
                    <button key={a} onClick={() => setAmount(String(a))}
                      className={`py-2 rounded-xl text-sm font-medium transition-all ${
                        amount === String(a)
                          ? "bg-violet-500/20 border border-violet-500/40 text-violet-300"
                          : "bg-white/5 border border-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                      }`}>
                      ₹{a}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium mb-2">Custom Amount</p>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">₹</span>
                  <input type="number" placeholder="0.00" value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-3.5 rounded-xl bg-black/40 border border-white/10 text-white text-xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition placeholder-gray-700" />
                </div>
              </div>
              <button onClick={createRequest} disabled={!amount || Number(amount) <= 0}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 text-white font-bold text-lg shadow-lg shadow-violet-500/20 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                Charge ₹{amount || "0"}
              </button>
            </div>
          </div>
        )}


        {/* WAITING */}
        {state === "WAITING" && (
          <div className="text-center">
            <div className="bg-[#0d1829] border border-white/10 rounded-2xl p-8">
              <div className="relative flex items-center justify-center w-40 h-40 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full border-2 border-violet-500/20 animate-ping" style={{ animationDuration: "2s" }} />
                <div className="absolute inset-3 rounded-full border-2 border-violet-500/30 animate-ping" style={{ animationDuration: "2s", animationDelay: "0.3s" }} />
                <div className="absolute inset-6 rounded-full border-2 border-violet-500/40 animate-ping" style={{ animationDuration: "2s", animationDelay: "0.6s" }} />
                <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-600/20 border border-violet-500/30 flex items-center justify-center">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-violet-400">
                    <rect x="2" y="5" width="20" height="14" rx="2"/>
                    <path d="M16 12a4 4 0 0 1-8 0"/>
                  </svg>
                </div>
              </div>
              <h2 className="text-xl font-bold text-white mb-1">Tap card now</h2>
              <p className="text-3xl font-bold text-violet-400 mt-3 mb-6">₹{amount}</p>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-2">
                <div className={`h-full rounded-full transition-all duration-1000 ${timeLeft > 5 ? "bg-violet-500" : "bg-red-500"}`}
                  style={{ width: `${progressPercent}%` }} />
              </div>
              <p className={`text-sm font-medium ${timeLeft <= 5 ? "text-red-400" : "text-gray-500"}`}>
                {timeLeft}s remaining
              </p>
              <button onClick={cancelRequest} className="mt-6 text-sm text-gray-500 hover:text-gray-300 underline underline-offset-2 transition">Cancel</button>
            </div>
          </div>
        )}

        {/* PROCESSING — shown after card tap while waiting for server response */}
        {state === "PROCESSING" && (
          <div className="text-center">
            <div className="bg-[#0d1829] border border-violet-500/20 rounded-2xl p-8 space-y-6">
              {/* Pulsing card icon */}
              <div className="relative w-28 h-28 mx-auto">
                <div className="absolute inset-0 rounded-full bg-violet-500/10 animate-pulse" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-violet-400">
                    <rect x="2" y="5" width="20" height="14" rx="2"/>
                    <path d="M16 12a4 4 0 0 1-8 0"/>
                  </svg>
                </div>
              </div>

              <div>
                <p className="text-xs text-violet-400/60 uppercase tracking-widest font-semibold mb-2">Card detected</p>
                <h2 className="text-xl font-bold text-white mb-1">Processing Payment</h2>
                <p className="text-sm text-gray-500">Verifying card and debiting wallet&hellip;</p>
              </div>

              <p className="text-3xl font-bold text-violet-400">₹{amount}</p>

              {/* Animated dots */}
              <div className="flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        {/* SUCCESS */}
        {state === "SUCCESS" && (
          <div className="text-center">
            <div className="bg-[#030e08] border border-emerald-500/30 rounded-2xl p-8 space-y-4">
              <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-ping" style={{ animationDuration: "2s" }} />
                <div className="relative w-full h-full rounded-full bg-emerald-500/15 border-2 border-emerald-500/40 flex items-center justify-center">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-400">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
              </div>
              <p className="text-xs text-emerald-500/60 uppercase tracking-widest font-semibold">Payment received</p>
              <p className="text-4xl font-black text-white">₹{amount}</p>
              {successData?.name && (
                <div className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <p className="text-sm text-gray-300">from <span className="text-white font-semibold">{successData.name}</span></p>
                </div>
              )}
              {successData?.balance !== undefined && (
                <p className="text-xs text-gray-600">Customer balance: ₹{successData.balance.toLocaleString("en-IN")}</p>
              )}
              <p className="text-xs text-gray-600">Returning to home...</p>
            </div>
          </div>
        )}

        {/* FAILED */}
        {state === "FAILED" && (
          <div className="text-center">
            <div className="bg-[#0d0508] border border-red-500/30 rounded-2xl p-8 space-y-5">
              <div className="w-24 h-24 mx-auto rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              </div>
              <div>
                <p className="text-xs text-red-500/60 uppercase tracking-widest font-semibold mb-1">Payment failed</p>
                <h2 className="text-xl font-bold text-red-400">{failure.title}</h2>
                <p className="text-gray-500 text-sm mt-2 leading-relaxed max-w-xs mx-auto">{failure.desc}</p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-lg bg-red-500/8 border border-red-500/15 px-3 py-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <span className="text-xs text-red-400/70 font-mono">{failureReason}</span>
              </div>
              <div className="space-y-2 pt-1">
                <button onClick={async () => { if (requestId) await fetch(`/api/merchant/payment-request/${requestId}`, { method: "DELETE" }).catch(() => {}); nfcProcessedRef.current = false; nfcStartedRef.current = false; setRequestId(null); setState("ENTER"); setFailureReason("DEFAULT"); }}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 text-white font-semibold active:scale-95 transition shadow-lg shadow-violet-500/20">
                  Try Again
                </button>
                <button onClick={() => reset(true)}
                  className="w-full py-3 rounded-xl border border-white/10 text-gray-400 text-sm hover:bg-white/5 hover:text-white transition">
                  Change Amount
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
