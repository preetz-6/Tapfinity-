"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import PinModal from "@/app/components/PinModal";

type User = {
  id: string;
  name: string | null;
  email: string;
  balance: number;
  status: "ACTIVE" | "BLOCKED";
  hasCard: boolean;
};

type Transaction = {
  id: string;
  amount: number;
  type: "CREDIT" | "DEBIT";
  status: string;
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

export default function StaffDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [pinOpen, setPinOpen] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState("");

  // Transaction viewer state
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txLoading, setTxLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/staff/students");
      const data = await res.json();
      setUsers(data.users ?? []);
    } catch (err) {
      console.error("Failed to fetch students", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter(u => u.name?.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }, [users, search]);

  const activeCount = users.filter(u => u.status === "ACTIVE").length;

  async function viewTransactions(user: User) {
    setViewingUser(user);
    setTxLoading(true);
    try {
      const res = await fetch(`/api/staff/students/${user.id}/transactions`);
      const data = await res.json();
      setTransactions(data.transactions ?? []);
    } catch {
      setTransactions([]);
    } finally {
      setTxLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Student Management</h1>
        <p className="text-xs text-gray-500 mt-0.5">{users.length} students · Block or unblock student cards</p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total", value: users.length, color: "text-white" },
          { label: "Active", value: activeCount, color: "text-emerald-400" },
          { label: "Blocked", value: users.length - activeCount, color: "text-red-400" },
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
          className="w-full sm:max-w-sm pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/30 transition"
        />
      </div>

      {/* Desktop Table */}
      <div className="hidden sm:block rounded-2xl border border-white/8 overflow-hidden bg-[#0c0f1a]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 bg-white/3">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Student</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Balance</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && Array.from({length: 5}).map((_, i) => <SkeletonRow key={i} />)}
            {!loading && filteredUsers.length === 0 && (
              <tr><td colSpan={4} className="py-16 text-center text-gray-500 text-sm">No students found</td></tr>
            )}
            {!loading && filteredUsers.map(u => (
              <tr key={u.id} className="border-t border-white/5 hover:bg-white/3 transition-colors">
                <td className="px-4 py-3.5">
                  <p className="font-medium text-white">{u.name ?? "—"}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{u.email}</p>
                </td>
                <td className="px-4 py-3.5 font-semibold text-white">₹{u.balance.toLocaleString("en-IN")}</td>
                <td className="px-4 py-3.5">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${u.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${u.status === "ACTIVE" ? "bg-emerald-400" : "bg-red-400"}`} />
                    {u.status}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setSelectedUser(u); setPinOpen(true); }}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
                        u.status === "ACTIVE"
                          ? "bg-amber-500/15 text-amber-400 border-amber-500/20 hover:bg-amber-500/25"
                          : "bg-emerald-500/15 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/25"
                      }`}
                    >
                      {u.status === "ACTIVE" ? "Block" : "Unblock"}
                    </button>
                    <button
                      onClick={() => viewTransactions(u)}
                      className="rounded-lg border px-3 py-1.5 text-xs font-semibold transition active:scale-95 bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white"
                    >
                      History
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="sm:hidden space-y-3">
        {loading && Array.from({length:3}).map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/5 p-4 bg-[#0c0f1a] space-y-3">
            <div className="skeleton h-4 w-1/2 rounded-md" />
            <div className="skeleton h-3 w-3/4 rounded-md" />
          </div>
        ))}
        {!loading && filteredUsers.map(u => (
          <div key={u.id} className="rounded-2xl border border-white/8 bg-[#0c0f1a] p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-white">{u.name ?? "—"}</p>
                <p className="text-xs text-gray-500">{u.email}</p>
              </div>
              <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${u.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${u.status === "ACTIVE" ? "bg-emerald-400" : "bg-red-400"}`} />
                {u.status}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm border-t border-white/5 pt-3">
              <span className="text-gray-400">Balance</span>
              <span className="font-bold text-white">₹{u.balance.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex gap-2 flex-wrap pt-1">
              <button
                onClick={() => { setSelectedUser(u); setPinOpen(true); }}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
                  u.status === "ACTIVE"
                    ? "bg-amber-500/15 text-amber-400 border-amber-500/20 hover:bg-amber-500/25"
                    : "bg-emerald-500/15 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/25"
                }`}
              >
                {u.status === "ACTIVE" ? "Block" : "Unblock"}
              </button>
              <button
                onClick={() => viewTransactions(u)}
                className="rounded-lg border px-3 py-1.5 text-xs font-semibold transition active:scale-95 bg-white/5 text-gray-400 border-white/10 hover:bg-white/10"
              >
                History
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* PIN Modal for block/unblock */}
      <PinModal open={pinOpen} loading={pinLoading} error={pinError}
        onClose={() => { setPinOpen(false); setSelectedUser(null); setPinError(""); }}
        onSubmit={async pin => {
          if (!selectedUser) return;
          setPinLoading(true);
          setPinError("");
          try {
            const res = await fetch("/api/staff/students", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: selectedUser.id,
                status: selectedUser.status === "ACTIVE" ? "BLOCKED" : "ACTIVE",
                pin,
              }),
            });
            const data = await res.json();
            if (!res.ok) {
              setPinError(data.error || "Failed");
              setPinLoading(false);
              return;
            }
            setPinLoading(false);
            setPinOpen(false);
            setSelectedUser(null);
            fetchUsers();
          } catch {
            setPinError("Something went wrong");
            setPinLoading(false);
          }
        }}
      />

      {/* Transaction Viewer Modal */}
      {viewingUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setViewingUser(null)} />
          <div className="relative w-full max-w-lg rounded-2xl bg-[#0c0f1a] border border-white/10 p-6 shadow-2xl max-h-[80vh] overflow-y-auto">
            <button className="absolute top-4 right-4 text-gray-500 hover:text-white transition" onClick={() => setViewingUser(null)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>

            <div className="mb-5">
              <h2 className="text-lg font-bold text-white">{viewingUser.name ?? "Student"}</h2>
              <p className="text-xs text-gray-500">{viewingUser.email} · Balance: ₹{viewingUser.balance.toLocaleString("en-IN")}</p>
            </div>

            <p className="text-xs text-gray-500 uppercase tracking-widest mb-3 font-semibold">Recent Transactions</p>

            {txLoading ? (
              <div className="space-y-2">
                {Array.from({length: 4}).map((_, i) => (
                  <div key={i} className="skeleton h-10 rounded-xl" />
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No transactions yet</p>
            ) : (
              <div className="space-y-0">
                {transactions.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs flex-shrink-0 ${tx.type === "CREDIT" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                        {tx.type === "CREDIT" ? "↑" : "↓"}
                      </div>
                      <div>
                        <p className="text-xs text-white font-medium">{tx.type}</p>
                        <p className="text-[10px] text-gray-600">{new Date(tx.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                    </div>
                    <span className={`text-sm font-bold ${tx.type === "CREDIT" ? "text-emerald-400" : "text-red-400"}`}>
                      {tx.type === "CREDIT" ? "+" : "−"}₹{tx.amount}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
