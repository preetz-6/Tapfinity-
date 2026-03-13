"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import PinModal from "@/app/components/PinModal";
import CreateUserModal from "./CreateUserModal";
import TopUpModal from "./TopUpModal";
import ProvisionCardModal from "./ProvisionCardModal";

type User = {
  id: string;
  name: string | null;
  email: string;
  balance: number;
  status: "ACTIVE" | "BLOCKED";
  cardSecretHash: string | null;
};
type PinAction = "CARD" | "BLOCK";

function SkeletonRow() {
  return (
    <tr className="border-t border-white/5">
      {[1,2,3,4,5].map(i => (
        <td key={i} className="px-4 py-3.5">
          <div className="skeleton h-4 rounded-md" style={{ width: `${40 + i*12}%` }} />
        </td>
      ))}
    </tr>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [cardUser, setCardUser] = useState<User | null>(null);
  const [cardPin, setCardPin] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState("");
  const [pinAction, setPinAction] = useState<PinAction | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      setUsers(data.users ?? []);
    } catch (err) {
      console.error("Failed to fetch users", err);
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
  const totalBalance = users.reduce((s, u) => s + u.balance, 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">User Management</h1>
          <p className="text-xs text-gray-500 mt-0.5">{users.length} total users</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition active:scale-95 shadow-lg shadow-blue-500/20"
        >
          <span className="text-base leading-none">+</span>
          Create User
        </button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total", value: users.length, color: "text-white" },
          { label: "Active", value: activeCount, color: "text-emerald-400" },
          { label: "Wallet Total", value: `₹${totalBalance.toLocaleString("en-IN")}`, color: "text-blue-400" },
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

      {/* Desktop Table */}
      <div className="hidden sm:block rounded-2xl border border-white/8 overflow-hidden bg-[#080f20]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 bg-white/3">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">User</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Balance</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Card</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && Array.from({length: 5}).map((_, i) => <SkeletonRow key={i} />)}
            {!loading && filteredUsers.length === 0 && (
              <tr><td colSpan={5} className="py-16 text-center text-gray-500 text-sm">No users found</td></tr>
            )}
            {!loading && filteredUsers.map(u => (
              <tr key={u.id} className="border-t border-white/5 hover:bg-white/3 transition-colors">
                <td className="px-4 py-3.5">
                  <p className="font-medium text-white">{u.name ?? "—"}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{u.email}</p>
                </td>
                <td className="px-4 py-3.5 font-semibold text-white">₹{u.balance.toLocaleString("en-IN")}</td>
                <td className="px-4 py-3.5">
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${u.cardSecretHash ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-gray-500/10 text-gray-500 border border-gray-500/20"}`}>
                    {u.cardSecretHash ? "● Provisioned" : "○ None"}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${u.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${u.status === "ACTIVE" ? "bg-emerald-400" : "bg-red-400"}`} />
                    {u.status}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <Btn label="Card" variant="blue" onClick={() => { setSelectedUser(u); setPinAction("CARD"); setPinOpen(true); }} />
                    <Btn label={u.status === "ACTIVE" ? "Block" : "Unblock"} variant={u.status === "ACTIVE" ? "yellow" : "green"} onClick={() => { setSelectedUser(u); setPinAction("BLOCK"); setPinOpen(true); }} />
                    <Btn label="Top-up" variant="green" disabled={u.status !== "ACTIVE"} onClick={() => { setSelectedUser(u); setShowTopupModal(true); }} />
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
          <div key={i} className="rounded-2xl border border-white/5 p-4 bg-[#080f20] space-y-3">
            <div className="skeleton h-4 w-1/2 rounded-md" />
            <div className="skeleton h-3 w-3/4 rounded-md" />
          </div>
        ))}
        {!loading && filteredUsers.map(u => (
          <div key={u.id} className="rounded-2xl border border-white/8 bg-[#080f20] p-4 space-y-3">
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
              <Btn label="Card" variant="blue" onClick={() => { setSelectedUser(u); setPinAction("CARD"); setPinOpen(true); }} />
              <Btn label={u.status === "ACTIVE" ? "Block" : "Unblock"} variant={u.status === "ACTIVE" ? "yellow" : "green"} onClick={() => { setSelectedUser(u); setPinAction("BLOCK"); setPinOpen(true); }} />
              <Btn label="Top-up" variant="green" disabled={u.status !== "ACTIVE"} onClick={() => { setSelectedUser(u); setShowTopupModal(true); }} />
            </div>
          </div>
        ))}
      </div>

      {/* Modals */}
      <PinModal open={pinOpen} loading={pinLoading} error={pinError}
        onClose={() => { setPinOpen(false); setSelectedUser(null); setPinAction(null); setPinError(""); }}
        onSubmit={async pin => {
          if (!selectedUser || !pinAction) return;
          setPinLoading(true);
          if (pinAction === "BLOCK") {
            await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: selectedUser.id, status: selectedUser.status === "ACTIVE" ? "BLOCKED" : "ACTIVE", pin }) });
            setPinLoading(false); setPinOpen(false); setPinAction(null); setSelectedUser(null); fetchUsers(); return;
          }
          setPinLoading(false); setPinOpen(false); setPinAction(null); setCardUser(selectedUser); setCardPin(pin);
        }}
      />
      {cardUser && (
        <ProvisionCardModal open user={{ id: cardUser.id, email: cardUser.email, hasCard: !!cardUser.cardSecretHash }} pin={cardPin}
          onClose={() => { setCardUser(null); setCardPin(""); fetchUsers(); }} />
      )}
      <CreateUserModal open={showCreateModal} onClose={() => setShowCreateModal(false)} onSuccess={fetchUsers} />
      {selectedUser && (
        <TopUpModal open={showTopupModal} userId={selectedUser.id} onClose={() => setShowTopupModal(false)} onSuccess={fetchUsers} />
      )}
    </div>
  );
}

function Btn({ label, variant, onClick, disabled }: { label: string; variant: "blue"|"yellow"|"green"; onClick: () => void; disabled?: boolean }) {
  const styles = {
    blue: "bg-blue-500/15 text-blue-400 border-blue-500/20 hover:bg-blue-500/25",
    yellow: "bg-amber-500/15 text-amber-400 border-amber-500/20 hover:bg-amber-500/25",
    green: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/25",
  };
  return (
    <button disabled={disabled} onClick={onClick}
      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${disabled ? "opacity-30 cursor-not-allowed" : styles[variant]}`}>
      {label}
    </button>
  );
}
