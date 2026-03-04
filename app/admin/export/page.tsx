"use client";

import { useEffect, useState } from "react";

type Merchant = { id: string; name: string; email: string; };

type Preset = "today" | "week" | "month" | "custom";

function getPresetDates(p: Preset): { start: string; end: string } {
  const now = new Date();
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  if (p === "today") return { start: fmt(now), end: fmt(now) };
  if (p === "week") {
    const s = new Date(now); s.setDate(now.getDate() - 7);
    return { start: fmt(s), end: fmt(now) };
  }
  if (p === "month") {
    const s = new Date(now); s.setDate(now.getDate() - 30);
    return { start: fmt(s), end: fmt(now) };
  }
  return { start: "", end: "" };
}

export default function ExportPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [preset, setPreset] = useState<Preset>("week");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [merchantId, setMerchantId] = useState("");
  const [userId, setUserId] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastDownload, setLastDownload] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/merchants")
      .then(r => r.json())
      .then(d => setMerchants(d.merchants || []));
  }, []);

  useEffect(() => {
    if (preset !== "custom") {
      const { start, end } = getPresetDates(preset);
      setStartDate(start); setEndDate(end);
    }
  }, [preset]);

  async function download() {
    if (!startDate || !endDate) { alert("Select a date range"); return; }
    setLoading(true);
    const params = new URLSearchParams({
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(new Date(endDate).setHours(23, 59, 59)).toISOString(),
    });
    if (merchantId) params.append("merchantId", merchantId);
    if (userId) params.append("userId", userId);
    if (status) params.append("status", status);

    const url = `/api/admin/export?${params}`;
    window.open(url, "_blank");
    setLastDownload(new Date().toLocaleString("en-IN"));
    setLoading(false);
  }

  const PRESETS: { key: Preset; label: string; icon: string }[] = [
    { key: "today", label: "Today", icon: "📅" },
    { key: "week", label: "Last 7 days", icon: "📆" },
    { key: "month", label: "Last 30 days", icon: "🗓️" },
    { key: "custom", label: "Custom range", icon: "✏️" },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-7">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-white">Export & Audit</h1>
        <p className="text-xs text-gray-500 mt-0.5">Download filtered transaction reports as CSV</p>
      </div>

      {/* Date Presets */}
      <div className="rounded-2xl border border-white/8 bg-[#080f20] p-6 space-y-4">
        <p className="text-sm font-semibold text-white">Date Range</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PRESETS.map(p => (
            <button key={p.key} onClick={() => setPreset(p.key)}
              className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-xs font-semibold transition active:scale-95 ${preset === p.key ? "bg-blue-500/15 border-blue-500/30 text-blue-300" : "bg-white/3 border-white/8 text-gray-400 hover:bg-white/8 hover:text-white"}`}>
              <span className="text-lg">{p.icon}</span>
              {p.label}
            </button>
          ))}
        </div>

        {/* Custom date inputs */}
        {preset === "custom" && (
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block uppercase tracking-wider">From</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block uppercase tracking-wider">To</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition" />
            </div>
          </div>
        )}

        {/* Show selected range */}
        {startDate && endDate && (
          <div className="flex items-center gap-2 rounded-lg bg-white/3 border border-white/5 px-4 py-2.5">
            <span className="text-xs text-gray-500">Range:</span>
            <span className="text-xs font-semibold text-white">{startDate} → {endDate}</span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-white/8 bg-[#080f20] p-6 space-y-4">
        <p className="text-sm font-semibold text-white">Filters <span className="text-xs text-gray-500 font-normal">(all optional)</span></p>

        <div>
          <label className="text-xs text-gray-500 mb-1.5 block uppercase tracking-wider">Merchant</label>
          <select value={merchantId} onChange={e => setMerchantId(e.target.value)}
            className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition">
            <option value="">All Merchants</option>
            {merchants.map(m => (
              <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block uppercase tracking-wider">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)}
              className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition">
              <option value="">All</option>
              <option value="SUCCESS">Success only</option>
              <option value="FAILED">Failed only</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block uppercase tracking-wider">User ID</label>
            <input placeholder="Optional" value={userId} onChange={e => setUserId(e.target.value)}
              className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition" />
          </div>
        </div>
      </div>

      {/* Summary + Download */}
      <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-bold text-white">Ready to export</p>
            <p className="text-xs text-gray-500 mt-0.5">File will be downloaded as a CSV</p>
          </div>
          <span className="text-2xl">📤</span>
        </div>

        {/* Summary chips */}
        <div className="flex flex-wrap gap-2">
          {startDate && <Chip label={`From: ${startDate}`} />}
          {endDate && <Chip label={`To: ${endDate}`} />}
          {merchantId && <Chip label={`Merchant: ${merchants.find(m => m.id === merchantId)?.name ?? merchantId}`} />}
          {status && <Chip label={`Status: ${status}`} />}
          {userId && <Chip label={`User: ${userId}`} />}
          {!merchantId && !status && !userId && <Chip label="No filters — all data" muted />}
        </div>

        <button onClick={download} disabled={loading || !startDate || !endDate}
          className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 py-4 text-sm font-bold text-white transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2">
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              Preparing…
            </>
          ) : "⬇ Download CSV Report"}
        </button>

        {lastDownload && (
          <p className="text-xs text-center text-gray-600">Last downloaded: {lastDownload}</p>
        )}
      </div>
    </div>
  );
}

function Chip({ label, muted }: { label: string; muted?: boolean }) {
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full border ${muted ? "bg-white/3 border-white/8 text-gray-600" : "bg-blue-500/10 border-blue-500/20 text-blue-400"}`}>
      {label}
    </span>
  );
}
