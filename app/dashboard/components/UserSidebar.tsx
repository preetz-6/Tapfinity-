"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { 
    href: "/dashboard", 
    label: "Overview",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="9" />
        <rect x="14" y="3" width="7" height="5" />
        <rect x="14" y="12" width="7" height="9" />
        <rect x="3" y="16" width="7" height="5" />
      </svg>
    )
  },
  { 
    href: "/dashboard/topup", 
    label: "Top-up",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    )
  },
  { 
    href: "/dashboard/history", 
    label: "Transactions",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    )
  },
  { 
    href: "/dashboard/card", 
    label: "Card",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    )
  },
];

export default function UserSidebar({ onClose, onLogout }: { onClose?: () => void; onLogout: () => void }) {
  const pathname = usePathname();

  return (
    <aside className="h-full w-64 bg-gradient-to-b from-[#150e0a]/95 via-[#0e0a07]/95 to-[#070503]/98 border-r border-orange-500/10 flex flex-col backdrop-blur-md">
      <div className="px-6 py-6 border-b border-orange-500/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500/25 to-orange-600/5 border border-orange-500/30 flex items-center justify-center shadow-lg shadow-orange-500/10">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-orange-400">
              <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M16 12a4 4 0 0 1-8 0"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-black tracking-tight text-white leading-tight">My Wallet</p>
            <p className="text-[10px] text-orange-400 font-bold uppercase tracking-wider">Tapfinity</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 text-gray-400 hover:text-white transition">×</button>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {NAV.map(({ href, label, icon }) => {
          const active = pathname === href;
          return (
            <Link 
              key={href} 
              href={href} 
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 border ${
                active 
                  ? "bg-gradient-to-r from-orange-500/15 to-orange-500/5 text-orange-400 border-orange-500/25 shadow-md shadow-orange-500/[0.03]" 
                  : "text-gray-400 hover:bg-white/[0.03] hover:text-white border-transparent"
              }`}
            >
              <span className={`transition-colors duration-200 ${active ? "text-orange-400" : "text-gray-400"}`}>
                {icon}
              </span>
              <span className="flex-1">{label}</span>
              {active && <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shadow-[0_0_8px_#f97316]" />}
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer / Sign-out */}
      <div className="p-4 border-t border-orange-500/10">
        <button onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Sign out
        </button>
      </div>
    </aside>
  );
}
