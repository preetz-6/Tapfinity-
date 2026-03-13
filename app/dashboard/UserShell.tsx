"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import UserSidebar from "./components/UserSidebar";

export default function UserShell({ children }: { children: React.ReactNode }) {
  const { status, data: session } = useSession();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
    if (status === "authenticated" && session?.user?.role !== "USER") router.replace("/");
  }, [status, session, router]);

  if (status === "loading") return (
    <div className="min-h-screen flex items-center justify-center bg-[#050a18]">
      <svg className="animate-spin h-7 w-7 text-blue-500/60" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#080604] text-white">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed lg:static z-50 h-full
          transform transition-transform duration-300 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        <UserSidebar
          onClose={() => setMobileOpen(false)}
          onLogout={() => signOut({ callbackUrl: "/", redirect: true })}
        />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#0f0a06] border-b border-orange-500/10">
          <button
            onClick={() => setMobileOpen(true)}
            className="flex items-center justify-center w-9 h-9 rounded-lg bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <span className="font-semibold text-white">My Wallet</span>
          <div className="w-9" />
        </div>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
