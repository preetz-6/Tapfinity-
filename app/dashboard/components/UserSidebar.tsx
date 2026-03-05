"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/dashboard",         label: "Overview" },
  { href: "/dashboard/topup",   label: "Top-up" },
  { href: "/dashboard/history", label: "Transactions" },
  { href: "/dashboard/card",    label: "Card" },
];

export default function UserSidebar({ onClose, onLogout }: { onClose?: () => void; onLogout: () => void }) {
  const pathname = usePathname();

  return (
    <aside className="h-full w-60 bg-[#0f0a06] flex flex-col border-r border-orange-500/10">
      <div className="px-5 py-5 border-b border-orange-500/10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-orange-500/15 border border-orange-500/20 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-orange-400">
              <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M16 12a4 4 0 0 1-8 0"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">My Wallet</p>
            <p className="text-xs text-orange-400/60">Tapfinity</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden text-gray-500 hover:text-white text-xl leading-none">×</button>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {NAV.map(({ href, label }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} onClick={onClose}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active ? "bg-orange-500/15 text-orange-400 border border-orange-500/20" : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`}>
              {label}
              {active && <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-orange-500/10">
        <button onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Sign out
        </button>
      </div>
    </aside>
  );
}
