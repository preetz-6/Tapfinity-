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
  const [exportError, setExportError] = useState("");

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
    if (!startDate || !endDate) { setExportError("Please select a date range."); return; }
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
    setExportError(""); setLastDownload(new Date().toLocaleString("en-IN"));
    setLoading(false);
  }

  function downloadPdf() {
    if (!startDate || !endDate) { setExportError("Please select a date range."); return; }
    const params = new URLSearchParams({
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(new Date(endDate).setHours(23, 59, 59)).toISOString(),
    });
    if (merchantId) params.append("merchantId", merchantId);
    if (userId) params.append("userId", userId);
    if (status) params.append("status", status);
    window.open(`/api/admin/export/pdf?${params}`, "_blank");
    setLastDownload(new Date().toLocaleString("en-IN"));
  }

  const PRESETS: { key: Preset; label: string; icon: string }[] = [
    { key: "today", label: "Today", icon: "T" },
    { key: "week", label: "Last 7 days", icon: "7D" },
    { key: "month", label: "Last 30 days", icon: "30D" },
    { key: "custom", label: "Custom range", icon: "–" },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-7">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-white">Export & Audit</h1>
        <p className="text-xs text-gray-500 mt-0.5">Download filtered transaction reports as CSV or PDF</p>
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
              <label className="text-xs text-gray-500 mb-1.5 block font-medium">From</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block font-medium">To</label>
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
          <label className="text-xs text-gray-500 mb-1.5 block font-medium">Merchant</label>
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
            <label className="text-xs text-gray-500 mb-1.5 block font-medium">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)}
              className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition">
              <option value="">All</option>
              <option value="SUCCESS">Success only</option>
              <option value="FAILED">Failed only</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block font-medium">User ID</label>
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
            <p className="text-xs text-gray-500 mt-0.5">Choose your format below</p>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-blue-400"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
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

        {/* Two download buttons */}
        <div className="grid grid-cols-2 gap-3">
          {/* CSV */}
          <button onClick={download} disabled={loading || !startDate || !endDate}
            className="rounded-xl bg-blue-600 hover:bg-blue-500 py-3.5 text-sm font-bold text-white transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2">
            {loading ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="12" y2="18"/><line x1="15" y1="15" x2="12" y2="18"/></svg>
            )}
            Download CSV
          </button>

          {/* PDF */}
          <button onClick={downloadPdf} disabled={loading || !startDate || !endDate}
            className="rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 py-3.5 text-sm font-bold text-white transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            Export PDF
          </button>
        </div>

        {exportError && (
          <div className="rounded-xl bg-red-500/8 border border-red-500/20 px-4 py-2.5 text-sm text-red-400 text-center">{exportError}</div>
        )}
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
