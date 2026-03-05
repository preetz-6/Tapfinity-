"use client";

import { useState } from "react";

type Section = "pin";

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

export default function AdminSettingsPage() {
  // PIN state
  const [pin, setPin]           = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinLoading, setPinLoading] = useState(false);
  const [pinMsg, setPinMsg]     = useState<{ ok: boolean; text: string } | null>(null);

  // Change PIN (requires current PIN)
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin]         = useState("");
  const [changeLoading, setChangeLoading] = useState(false);
  const [changeMsg, setChangeMsg]   = useState<{ ok: boolean; text: string } | null>(null);

  async function setInitialPin() {
    if (pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      setPinMsg({ ok: false, text: "PIN must be exactly 6 digits." }); return;
    }
    if (pin !== confirmPin) {
      setPinMsg({ ok: false, text: "PINs do not match." }); return;
    }
    setPinLoading(true); setPinMsg(null);
    const res = await fetch("/api/admin/pin", {
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
    if (newPin.length !== 6 || !/^\d{6}$/.test(newPin)) {
      setChangeMsg({ ok: false, text: "New PIN must be exactly 6 digits." }); return;
    }
    setChangeLoading(true); setChangeMsg(null);
    // Verify current PIN first via a dummy top-up of 0 to current user
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
    const res = await fetch("/api/admin/pin", {
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

  function PinInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-gray-500">{placeholder}</p>
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={value}
              onChange={e => onChange(e.target.value.replace(/\D/g, ""))}
              placeholder="••••••"
              className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/10 text-white text-center tracking-[0.5em] text-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition placeholder-gray-700"
            />
          </div>
          <div className="flex gap-1.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full border transition-all ${
                i < value.length ? "bg-blue-500 border-blue-500" : "bg-transparent border-white/20"
              }`} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Settings</h1>
        <p className="text-xs text-gray-500 mt-0.5">Manage your admin PIN and preferences</p>
      </div>

      {/* Set PIN */}
      <SectionCard
        title="Set Admin PIN"
        desc="Required for sensitive actions: provisioning cards, blocking users, and top-ups. Must be 6 digits."
      >
        <div className="space-y-4">
          <PinInput value={pin} onChange={setPin} placeholder="New PIN" />
          <PinInput value={confirmPin} onChange={setConfirmPin} placeholder="Confirm PIN" />

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
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {pinLoading ? "Setting PIN..." : "Set PIN"}
          </button>
        </div>
      </SectionCard>

      {/* Change PIN */}
      <SectionCard
        title="Change Existing PIN"
        desc="If you already have a PIN set and want to rotate it."
      >
        <div className="space-y-4">
          <PinInput value={currentPin} onChange={setCurrentPin} placeholder="Current PIN" />
          <PinInput value={newPin} onChange={setNewPin} placeholder="New PIN" />

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
            className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-sm transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {changeLoading ? "Changing PIN..." : "Change PIN"}
          </button>
        </div>
      </SectionCard>

      {/* Info */}
      <div className="rounded-xl bg-blue-500/5 border border-blue-500/15 px-4 py-3">
        <p className="text-xs text-blue-400/80 leading-relaxed">
          The PIN is hashed and stored securely. After 5 wrong attempts the PIN is locked — contact your database admin to reset it. Never share your PIN with merchants or users.
        </p>
      </div>
    </div>
  );
}
