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

  if (status === "loading") return null;

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
            <span className="text-lg leading-none">☰</span>
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
