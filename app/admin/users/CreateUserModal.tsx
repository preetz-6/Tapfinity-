"use client";

import { useState } from "react";
import PinModal from "@/app/components/PinModal";

export default function CreateUserModal({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void; }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pinOpen, setPinOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  async function submit(pin: string) {
    setLoading(true); setError("");
    const res = await fetch("/api/admin/users", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, pin }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || "Failed to create user"); return; }
    setPinOpen(false); onClose(); onSuccess();
    setName(""); setEmail(""); setPassword("");
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl bg-[#080f20] border border-white/10 overflow-hidden animate-fade-up shadow-2xl">
          <div className="px-6 pt-6 pb-4 border-b border-white/5">
            <h2 className="text-lg font-bold text-white">Create User</h2>
            <p className="text-xs text-gray-500 mt-0.5">Add a new user to the platform</p>
          </div>
          <div className="px-6 py-5 space-y-3">
            {[
              { placeholder: "Full name", value: name, onChange: (v: string) => setName(v), type: "text" },
              { placeholder: "Email address", value: email, onChange: (v: string) => setEmail(v), type: "email" },
              { placeholder: "Password", value: password, onChange: (v: string) => setPassword(v), type: "password" },
            ].map(f => (
              <input key={f.placeholder} type={f.type} placeholder={f.placeholder} value={f.value}
                onChange={e => f.onChange(e.target.value)}
                className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/30 transition" />
            ))}
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2.5">
                <span className="text-red-400 text-xs font-bold">✕</span>
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
            <div className="flex gap-3 pt-1">
              <button onClick={onClose} className="flex-1 rounded-xl border border-white/10 py-3 text-sm text-gray-400 hover:bg-white/5 hover:text-white transition">Cancel</button>
              <button onClick={() => setPinOpen(true)} disabled={!name || !email || !password}
                className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-500 py-3 text-sm font-semibold text-white transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed">
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>
      <PinModal open={pinOpen} loading={loading} error={error} onClose={() => setPinOpen(false)} onSubmit={submit} />
    </>
  );
}
