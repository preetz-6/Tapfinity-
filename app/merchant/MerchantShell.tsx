"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";

const NAV = [
  { href: "/merchant", label: "Receive Payment", icon: "⚡" },
  { href: "/merchant/transactions", label: "Transactions", icon: "≡" },
];

export default function MerchantShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { status, data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
    if (status === "authenticated" && session?.user?.role !== "MERCHANT") router.replace("/");
  }, [status, session, router]);

  if (status === "loading") return null;

  return (
    <div className="flex min-h-screen bg-[#050a18] text-white">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static z-50 h-full w-64
          bg-[#080f20] border-r border-white/5
          flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        {/* Logo */}
        <div className="px-5 py-6 border-b border-white/5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-lg">🏪</span>
              <h2 className="text-lg font-bold text-white">Merchant</h2>
            </div>
            <p className="text-xs text-violet-400/60 pl-7">Tapfinity</p>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-gray-500 hover:text-white transition text-xl leading-none"
          >
            ×
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV.map(({ href, label, icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  active
                    ? "bg-violet-500/15 text-violet-400 border border-violet-500/20"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className={`text-base leading-none ${active ? "text-violet-400" : "text-gray-600"}`}>{icon}</span>
                {label}
                {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button
            onClick={() => signOut({ callbackUrl: "/", redirect: true })}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition-all duration-150"
          >
            <span className="text-base">→</span>
            Sign out
          </button>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#080f20] border-b border-white/5">
          <button
            onClick={() => setMobileOpen(true)}
            className="flex items-center justify-center w-9 h-9 rounded-lg bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 transition"
          >
            <span className="text-lg leading-none">☰</span>
          </button>
          <span className="font-semibold">Merchant Panel</span>
          <div className="w-9" />
        </div>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
