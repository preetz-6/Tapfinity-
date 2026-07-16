"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";

const NAV = [
  { 
    href: "/merchant", 
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
    href: "/merchant/transactions", 
    label: "Transactions",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    )
  },
];

export default function MerchantShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { status, data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  if (status === "loading") return (
    <div className="min-h-screen flex items-center justify-center bg-[#050a18]">
      <svg className="animate-spin h-7 w-7 text-violet-500/60" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
    </div>
  );

  const name = (session?.user as { name?: string })?.name ?? "Merchant";

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#05040a] via-[#090715] to-[#05040a] text-white">
      {mobileOpen && (
        <div onClick={() => setMobileOpen(false)} className="fixed inset-0 bg-black/75 z-40 lg:hidden backdrop-blur-md transition-opacity duration-300" />
      )}

      {/* Premium Sidebar */}
      <aside className={`fixed lg:sticky top-0 z-50 h-screen w-64 bg-gradient-to-b from-[#0f0a20]/95 via-[#0b0818]/95 to-[#06050e]/98 border-r border-white/5 flex flex-col transform transition-transform duration-300 ease-in-out ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 backdrop-blur-md`}>
        <div className="px-6 py-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500/25 to-violet-600/5 border border-violet-500/30 flex items-center justify-center shadow-lg shadow-violet-500/10">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-violet-400">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-black tracking-tight text-white leading-tight">Tapfinity</p>
              <p className="text-[10px] text-violet-400 font-bold uppercase tracking-wider truncate max-w-[130px]">{name}</p>
            </div>
          </div>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 text-gray-400 hover:text-white transition">×</button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV.map(({ href, label, icon }) => {
            const active = pathname === href;
            return (
              <Link 
                key={href} 
                href={href} 
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 border ${
                  active 
                    ? "bg-gradient-to-r from-violet-500/15 to-violet-500/5 text-violet-400 border-violet-500/25 shadow-md shadow-violet-500/[0.03]" 
                    : "text-gray-400 hover:bg-white/[0.03] hover:text-white border-transparent"
                }`}
              >
                <span className={`transition-colors duration-200 ${active ? "text-violet-400" : "text-gray-400"}`}>
                  {icon}
                </span>
                <span className="flex-1">{label}</span>
                {active && <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shadow-[0_0_8px_#8b5cf6]" />}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer / Sign-out */}
        <div className="p-4 border-t border-white/5">
          <button onClick={() => signOut({ callbackUrl: "/", redirect: true })}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Panel Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header bar */}
        <div className="lg:hidden flex items-center justify-between px-5 py-3.5 bg-[#0f0a20]/95 border-b border-white/5">
          <button onClick={() => setMobileOpen(true)} className="flex items-center justify-center w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 hover:bg-violet-500/20 transition">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <span className="font-bold text-sm tracking-tight">Merchant Portal</span>
          <div className="w-9" />
        </div>
        <main className="flex-1 p-5 sm:p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
