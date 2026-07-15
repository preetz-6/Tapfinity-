"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import PinModal from "@/app/components/PinModal";

type Staff = {
  id: string;
  name: string;
  email: string;
  status: "ACTIVE" | "BLOCKED";
  createdAt: string;
};

function SkeletonRow() {
  return (
    <tr className="border-t border-white/5">
      {[1,2,3,4].map(i => (
        <td key={i} className="px-4 py-3.5">
          <div className="skeleton h-4 rounded-md" style={{ width: `${40 + i*12}%` }} />
        </td>
      ))}
    </tr>
  );
}

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  // Block/unblock
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [pinOpen, setPinOpen] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState("");
  const [pinAction, setPinAction] = useState<"BLOCK" | "CREATE" | null>(null);

  const fetchStaff = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/staff");
      const data = await res.json();
      setStaff(data.staff ?? []);
    } catch (err) {
      console.error("Failed to fetch staff", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  const filteredStaff = useMemo(() => {
    const q = search.toLowerCase();
    return staff.filter(s => s.name?.toLowerCase().includes(q) || s.email.toLowerCase().includes(q));
  }, [staff, search]);

  const activeCount = staff.filter(s => s.status === "ACTIVE").length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Staff Management</h1>
          <p className="text-xs text-gray-500 mt-0.5">{staff.length} staff members</p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setCreateError(""); }}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition active:scale-95 shadow-lg shadow-blue-500/20"
        >
          <span className="text-base leading-none">+</span>
          Create Staff
        </button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total", value: staff.length, color: "text-white" },
          { label: "Active", value: activeCount, color: "text-emerald-400" },
          { label: "Blocked", value: staff.length - activeCount, color: "text-red-400" },
        ].map(s => (
          <div key={s.label} className="rounded-xl bg-white/3 border border-white/5 px-4 py-3">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-lg font-bold mt-0.5 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input
          placeholder="Search by name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full sm:max-w-sm pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/30 transition"
        />
      </div>

      {/* Table */}
      <div className="hidden sm:block rounded-2xl border border-white/8 overflow-hidden bg-[#080f20]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 bg-white/3">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Staff</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Joined</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && Array.from({length: 3}).map((_, i) => <SkeletonRow key={i} />)}
            {!loading && filteredStaff.length === 0 && (
              <tr><td colSpan={4} className="py-16 text-center text-gray-500 text-sm">No staff members found</td></tr>
            )}
            {!loading && filteredStaff.map(s => (
              <tr key={s.id} className="border-t border-white/5 hover:bg-white/3 transition-colors">
                <td className="px-4 py-3.5">
                  <p className="font-medium text-white">{s.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.email}</p>
                </td>
                <td className="px-4 py-3.5 text-gray-400 text-xs">
                  {new Date(s.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </td>
                <td className="px-4 py-3.5">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${s.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${s.status === "ACTIVE" ? "bg-emerald-400" : "bg-red-400"}`} />
                    {s.status}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <button
                    onClick={() => { setSelectedStaff(s); setPinAction("BLOCK"); setPinOpen(true); }}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
                      s.status === "ACTIVE"
                        ? "bg-amber-500/15 text-amber-400 border-amber-500/20 hover:bg-amber-500/25"
                        : "bg-emerald-500/15 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/25"
                    }`}
                  >
                    {s.status === "ACTIVE" ? "Block" : "Unblock"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="sm:hidden space-y-3">
        {loading && Array.from({length:3}).map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/5 p-4 bg-[#080f20] space-y-3">
            <div className="skeleton h-4 w-1/2 rounded-md" />
            <div className="skeleton h-3 w-3/4 rounded-md" />
          </div>
        ))}
        {!loading && filteredStaff.map(s => (
          <div key={s.id} className="rounded-2xl border border-white/8 bg-[#080f20] p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-white">{s.name}</p>
                <p className="text-xs text-gray-500">{s.email}</p>
              </div>
              <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${s.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${s.status === "ACTIVE" ? "bg-emerald-400" : "bg-red-400"}`} />
                {s.status}
              </span>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => { setSelectedStaff(s); setPinAction("BLOCK"); setPinOpen(true); }}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
                  s.status === "ACTIVE"
                    ? "bg-amber-500/15 text-amber-400 border-amber-500/20 hover:bg-amber-500/25"
                    : "bg-emerald-500/15 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/25"
                }`}
              >
                {s.status === "ACTIVE" ? "Block" : "Unblock"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* PIN Modal for block/unblock and create */}
      <PinModal open={pinOpen} loading={pinLoading} error={pinError}
        onClose={() => { setPinOpen(false); setSelectedStaff(null); setPinAction(null); setPinError(""); }}
        onSubmit={async pin => {
          setPinLoading(true);
          setPinError("");

          if (pinAction === "BLOCK" && selectedStaff) {
            try {
              const res = await fetch("/api/admin/staff", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  staffId: selectedStaff.id,
                  status: selectedStaff.status === "ACTIVE" ? "BLOCKED" : "ACTIVE",
                  pin,
                }),
              });
              const data = await res.json();
              if (!res.ok) {
                setPinError(data.error || "Failed");
                setPinLoading(false);
                return;
              }
            } catch {
              setPinError("Something went wrong");
              setPinLoading(false);
              return;
            }
          }

          if (pinAction === "CREATE") {
            try {
              const res = await fetch("/api/admin/staff", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  name: createName,
                  email: createEmail,
                  password: createPassword,
                  pin,
                }),
              });
              const data = await res.json();
              if (!res.ok) {
                setPinError(data.error || "Failed to create staff");
                setPinLoading(false);
                return;
              }
              setShowCreate(false);
              setCreateName(""); setCreateEmail(""); setCreatePassword("");
            } catch {
              setPinError("Something went wrong");
              setPinLoading(false);
              return;
            }
          }

          setPinLoading(false);
          setPinOpen(false);
          setSelectedStaff(null);
          setPinAction(null);
          fetchStaff();
        }}
      />

      {/* Create Staff Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-[#080f20] border border-white/10 p-8 shadow-2xl">
            <button className="absolute top-4 right-4 text-gray-500 hover:text-white transition" onClick={() => setShowCreate(false)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>

            <h2 className="text-lg font-bold text-white mb-1">Create Staff Account</h2>
            <p className="text-xs text-gray-500 mb-6">Staff members can view students and block/unblock cards.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">Name</label>
                <input
                  type="text"
                  placeholder="Dr. Patel"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/30 transition text-sm"
                  value={createName}
                  onChange={e => setCreateName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">Email</label>
                <input
                  type="email"
                  placeholder="teacher@campus.edu"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/30 transition text-sm"
                  value={createEmail}
                  onChange={e => setCreateEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/30 transition text-sm"
                  value={createPassword}
                  onChange={e => setCreatePassword(e.target.value)}
                  required
                />
              </div>

              {createError && (
                <div className="flex items-center gap-2 bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3">
                  <span className="text-red-400 text-sm">⚠</span>
                  <p className="text-red-400 text-sm font-medium">{createError}</p>
                </div>
              )}

              <button
                onClick={() => {
                  if (!createEmail || !createPassword) {
                    setCreateError("Email and password are required");
                    return;
                  }
                  setCreateError("");
                  setPinAction("CREATE");
                  setPinOpen(true);
                }}
                disabled={createLoading}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
              >
                Create Staff
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
