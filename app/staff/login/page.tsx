"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function StaffLogin() {
  const router = useRouter();
  const { status, data: session } = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      const r = (session?.user as { role?: string })?.role;
      if (r === "STAFF") router.replace("/staff");
      else router.replace("/");
    }
  }, [status, session, router]);

  if (status === "loading") return (
    <div className="min-h-screen flex items-center justify-center bg-[#080a12]">
      <svg className="animate-spin h-7 w-7 text-amber-500/60" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
    </div>
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("staff-credentials", { email, password, redirect: false });

    if (res?.error) {
      setLoading(false);
      setError(res.error === "CredentialsSignin" ? "Invalid credentials" : res.error);
      return;
    }

    router.replace("/staff");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080a12] text-white font-body p-4 relative overflow-hidden">
      <meta name="robots" content="noindex, nofollow" />

      {/* Subtle background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-[500px] h-[500px] rounded-full bg-amber-500/[0.05] blur-[120px] -top-40 -right-40" />
        <div className="absolute w-[400px] h-[400px] rounded-full bg-orange-500/[0.04] blur-[100px] -bottom-32 -left-32" />
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-amber-400">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Staff Portal</h1>
          <p className="text-sm text-gray-500 mt-1">Tapfinity Campus Staff</p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl bg-[#0c0f1a] border border-white/8 p-8 shadow-2xl shadow-black/50">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">Email</label>
              <input
                type="email"
                placeholder="teacher@campus.edu"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none transition-all focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/30"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white placeholder-gray-600 outline-none transition-all focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/30"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors p-1"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {showPassword ? (
                      <>
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </>
                    ) : (
                      <>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </>
                    )}
                  </svg>
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3">
                <span className="text-red-400 text-sm">⚠</span>
                <p className="text-red-400 text-sm font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Authenticating…
                </>
              ) : "Sign In"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          Access provided by your campus administrator.
        </p>
      </div>
    </div>
  );
}
