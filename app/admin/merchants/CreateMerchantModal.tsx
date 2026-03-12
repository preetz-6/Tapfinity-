"use client";

import { useState } from "react";
import { useToast } from "@/app/components/Toast";

export default function CreateMerchantModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { toast } = useToast();
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  async function handleCreate() {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("All fields are required."); return;
    }
    setLoading(true); setError("");
    const res = await fetch("/api/admin/merchants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      toast("Merchant created successfully", "success");
      onCreated(); onClose();
    } else {
      setError(data.error || "Failed to create merchant.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm rounded-2xl bg-[#080f20] border border-white/10 shadow-2xl overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">New Merchant</h2>
            <p className="text-xs text-gray-500 mt-0.5">Create a merchant account</p>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-white text-xl leading-none transition">×</button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {[
            { label: "Name", value: name, set: setName, placeholder: "e.g. Campus Canteen", type: "text" },
            { label: "Email", value: email, set: setEmail, placeholder: "merchant@college.edu", type: "email" },
            { label: "Password", value: password, set: setPassword, placeholder: "Min. 8 characters", type: "password" },
          ].map(({ label, value, set, placeholder, type }) => (
            <div key={label}>
              <p className="text-xs text-gray-500 mb-1.5">{label}</p>
              <input type={type} placeholder={placeholder} value={value}
                onChange={e => set(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-black/30 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition placeholder-gray-700" />
            </div>
          ))}

          {error && (
            <div className="rounded-xl bg-red-500/8 border border-red-500/20 px-4 py-2.5 text-sm text-red-400">{error}</div>
          )}

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-gray-400 hover:bg-white/5 hover:text-white transition">
              Cancel
            </button>
            <button onClick={handleCreate} disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-semibold text-white transition active:scale-95 disabled:opacity-50">
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
