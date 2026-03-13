"use client";

import { useState, useRef } from "react";

function SectionCard({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-[#080f20] border border-white/8 p-6 space-y-5">
      <div>
        <h2 className="text-base font-semibold text-white">{title}</h2>
        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
      </div>
      {children}
    </div>
  );
}

// Extracted OUTSIDE — if defined inside the parent component, React
// unmounts + remounts it on every keystroke, killing focus.
function PinInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500 font-medium">{label}</p>

      {/* Dot indicators */}
      <div className="flex gap-2 mb-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            onClick={() => inputRef.current?.focus()}
            className={`w-3 h-3 rounded-full border-2 transition-all duration-150 cursor-text ${
              i < value.length
                ? "bg-blue-500 border-blue-500 scale-110"
                : "bg-transparent border-white/20"
            }`}
          />
        ))}
      </div>

      {/* Single clean input */}
      <input
        ref={inputRef}
        type="password"
        inputMode="numeric"
        maxLength={6}
        value={value}
        onChange={e => onChange(e.target.value.replace(/\D/g, ""))}
        autoComplete="off"
        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white text-center tracking-[0.5em] text-base font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/30 transition"
        placeholder="——————"
      />
    </div>
  );
}

export default function AdminSettingsPage() {
  const [pin, setPin]               = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinLoading, setPinLoading] = useState(false);
  const [pinMsg, setPinMsg]         = useState<{ ok: boolean; text: string } | null>(null);

  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin]         = useState("");
  const [changeLoading, setChangeLoading] = useState(false);
  const [changeMsg, setChangeMsg]   = useState<{ ok: boolean; text: string } | null>(null);

  async function setInitialPin() {
    if (!/^\d{6}$/.test(pin)) {
      setPinMsg({ ok: false, text: "PIN must be exactly 6 digits." }); return;
    }
    if (pin !== confirmPin) {
      setPinMsg({ ok: false, text: "PINs do not match." }); return;
    }
    setPinLoading(true); setPinMsg(null);
    const res  = await fetch("/api/admin/pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    const data = await res.json();
    setPinLoading(false);
    if (res.ok) {
      setPinMsg({ ok: true, text: "PIN set successfully. You can now provision cards, block users, and top up." });
      setPin(""); setConfirmPin("");
    } else {
      setPinMsg({ ok: false, text: data.error || "Failed to set PIN." });
    }
  }

  async function changeExistingPin() {
    if (!/^\d{6}$/.test(newPin)) {
      setChangeMsg({ ok: false, text: "New PIN must be exactly 6 digits." }); return;
    }
    setChangeLoading(true); setChangeMsg(null);
    const verifyRes = await fetch("/api/admin/pin/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: currentPin }),
    });
    if (!verifyRes.ok) {
      const d = await verifyRes.json();
      setChangeLoading(false);
      setChangeMsg({ ok: false, text: d.error || "Current PIN incorrect." });
      return;
    }
    const res  = await fetch("/api/admin/pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: newPin }),
    });
    const data = await res.json();
    setChangeLoading(false);
    if (res.ok) {
      setChangeMsg({ ok: true, text: "PIN changed successfully." });
      setCurrentPin(""); setNewPin("");
    } else {
      setChangeMsg({ ok: false, text: data.error || "Failed to change PIN." });
    }
  }

  return (
    <div className="max-w-md space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Settings</h1>
        <p className="text-xs text-gray-500 mt-0.5">Manage your admin PIN</p>
      </div>

      <SectionCard
        title="Set Admin PIN"
        desc="Required for provisioning cards, blocking users, and top-ups. Must be 6 digits."
      >
        <div className="space-y-4">
          <PinInput label="New PIN" value={pin} onChange={setPin} />
          <PinInput label="Confirm PIN" value={confirmPin} onChange={setConfirmPin} />

          {pinMsg && (
            <div className={`rounded-xl px-4 py-3 text-sm border ${
              pinMsg.ok
                ? "bg-emerald-500/8 border-emerald-500/20 text-emerald-400"
                : "bg-red-500/8 border-red-500/20 text-red-400"
            }`}>
              {pinMsg.text}
            </div>
          )}

          <button
            onClick={setInitialPin}
            disabled={pinLoading || pin.length !== 6 || confirmPin.length !== 6}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {pinLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Setting PIN…
              </>
            ) : "Set PIN"}
          </button>
        </div>
      </SectionCard>

      <SectionCard
        title="Change Existing PIN"
        desc="If you already have a PIN set and want to rotate it."
      >
        <div className="space-y-4">
          <PinInput label="Current PIN" value={currentPin} onChange={setCurrentPin} />
          <PinInput label="New PIN" value={newPin} onChange={setNewPin} />

          {changeMsg && (
            <div className={`rounded-xl px-4 py-3 text-sm border ${
              changeMsg.ok
                ? "bg-emerald-500/8 border-emerald-500/20 text-emerald-400"
                : "bg-red-500/8 border-red-500/20 text-red-400"
            }`}>
              {changeMsg.text}
            </div>
          )}

          <button
            onClick={changeExistingPin}
            disabled={changeLoading || currentPin.length !== 6 || newPin.length !== 6}
            className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-sm transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {changeLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Changing PIN…
              </>
            ) : "Change PIN"}
          </button>
        </div>
      </SectionCard>

      <div className="rounded-xl bg-blue-500/5 border border-blue-500/15 px-4 py-3">
        <p className="text-xs text-blue-400/80 leading-relaxed">
          The PIN is hashed with bcrypt and never stored in plain text. After 5 wrong attempts it locks — reset via database if needed. Never share your PIN.
        </p>
      </div>
    </div>
  );
}
