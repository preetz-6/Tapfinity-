"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";

const NAV = [
  { href: "/merchant",              label: "Home" },
  { href: "/merchant/transactions", label: "Transactions" },
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
      <svg className="animate-spin h-7 w-7 text-blue-500/60" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
    </div>
  );

  const name = (session?.user as { name?: string })?.name ?? "Merchant";

  return (
    <div className="flex min-h-screen bg-[#07050f] text-white">
      {mobileOpen && (
        <div onClick={() => setMobileOpen(false)} className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm" />
      )}

      <aside className={`fixed lg:static z-50 h-full w-60 bg-[#0d0a1a] border-r border-white/5 flex flex-col transform transition-transform duration-300 ease-in-out ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        <div className="px-5 py-5 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-violet-500/15 border border-violet-500/20 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-violet-400">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-tight">Tapfinity</p>
              <p className="text-xs text-violet-400/60 truncate max-w-[120px]">{name}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {NAV.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href} onClick={() => setMobileOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active ? "bg-violet-500/15 text-violet-400 border border-violet-500/20" : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}>
                {label}
                {active && <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/5">
          <button onClick={() => signOut({ callbackUrl: "/", redirect: true })}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#0d0a1a] border-b border-white/5">
          <button onClick={() => setMobileOpen(true)} className="flex items-center justify-center w-9 h-9 rounded-lg bg-violet-500/10 text-violet-400">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <span className="font-semibold text-sm">Merchant</span>
          <div className="w-9" />
        </div>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
