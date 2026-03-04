"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: "◈" },
  { href: "/dashboard/topup", label: "Top-up", icon: "+" },
  { href: "/dashboard/history", label: "Transactions", icon: "≡" },
  { href: "/dashboard/card", label: "Card Status", icon: "▣" },
];

export default function UserSidebar({
  onClose,
  onLogout,
}: {
  onClose?: () => void;
  onLogout: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside className="h-full w-64 bg-[#0f0a06] flex flex-col border-r border-orange-500/10">
      {/* Header */}
      <div className="px-5 py-6 border-b border-orange-500/10 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-lg">📳</span>
            <h2 className="text-lg font-bold text-white">My Wallet</h2>
          </div>
          <p className="text-xs text-orange-400/60 pl-7">Tapfinity</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden text-gray-500 hover:text-white transition text-xl leading-none"
          >
            ×
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {NAV.map(({ href, label, icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                active
                  ? "bg-orange-500/15 text-orange-400 border border-orange-500/20"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className={`text-base leading-none ${active ? "text-orange-400" : "text-gray-600"}`}>{icon}</span>
              {label}
              {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-400" />}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="p-4 border-t border-orange-500/10">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition-all duration-150"
        >
          <span className="text-base">→</span>
          Sign out
        </button>
      </div>
    </aside>
  );
}
