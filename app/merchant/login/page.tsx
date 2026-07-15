"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function MerchantLogin() {
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
      if (r === "MERCHANT") router.replace("/merchant");
      else router.replace("/");
    }
  }, [status, session, router]);

  if (status === "loading") return (
    <div className="min-h-screen flex items-center justify-center bg-[#07050f]">
      <svg className="animate-spin h-7 w-7 text-violet-500/60" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
    </div>
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("merchant-credentials", { email, password, redirect: false });

    if (res?.error) {
      setLoading(false);
      setError(res.error === "CredentialsSignin" ? "Invalid credentials" : res.error);
      return;
    }

    router.replace("/merchant");
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[#07050f] text-white font-body overflow-hidden">
      <meta name="robots" content="noindex, nofollow" />

      {/* Left Panel: Merchant Branding (Hidden on Mobile) */}
      <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute w-[500px] h-[500px] rounded-full bg-violet-500/[0.08] blur-[120px] -top-32 -left-32" />
          <div className="absolute w-[400px] h-[400px] rounded-full bg-teal-500/[0.06] blur-[100px] -bottom-24 -right-24" />
          <div className="absolute inset-0 bg-[#07050f]/40 backdrop-blur-[60px]" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-500/15 border border-violet-500/20 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-violet-400">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight">Tapfinity</span>
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <div className="inline-flex items-center gap-2.5 bg-violet-500/8 border border-violet-500/15 px-4 py-2 rounded-full mb-6">
            <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-xs font-medium text-violet-400/80 uppercase tracking-widest">Merchant Portal</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter leading-tight mb-4">
            Accept contactless<br/>
            <span className="bg-gradient-to-r from-violet-400 to-teal-400 bg-clip-text text-transparent">payments instantly</span>
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed max-w-sm">
            View your settlement history, track daily revenue, and receive NFC payments — all from your merchant dashboard.
          </p>

          {/* Feature badges */}
          <div className="flex flex-wrap gap-3 mt-8">
            {[
              { icon: "⚡", label: "Instant settlements" },
              { icon: "📊", label: "Revenue tracking" },
              { icon: "🔒", label: "Secure transactions" },
            ].map(f => (
              <div key={f.label} className="flex items-center gap-2 bg-white/[0.03] border border-white/8 rounded-xl px-3 py-2">
                <span className="text-sm">{f.icon}</span>
                <span className="text-xs text-gray-400 font-medium">{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-xs text-gray-600">© 2026 Tapfinity. Merchant access only.</p>
        </div>
      </div>

      {/* Right Panel: Login Form */}
      <div className="flex flex-col items-center justify-center p-6 relative">
        {/* Mobile background */}
        <div className="absolute lg:hidden inset-0 pointer-events-none">
          <div className="absolute w-[300px] h-[300px] rounded-full bg-violet-500/[0.08] blur-[100px] top-0 left-0" />
          <div className="absolute inset-0 bg-[#07050f]/80 backdrop-blur-[60px]" />
        </div>

        <div className="w-full max-w-sm relative z-10">
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-violet-400">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tight mb-1">Tapfinity</h1>
            <p className="text-sm text-gray-500">Merchant Portal</p>
          </div>

          {/* Desktop heading */}
          <div className="mb-8 hidden lg:block">
            <h2 className="text-2xl font-bold tracking-tight mb-2">Merchant Sign In</h2>
            <p className="text-sm text-gray-500">Access your merchant dashboard</p>
          </div>

          {/* Login Card */}
          <div className="rounded-2xl bg-[#0d0a1a] border border-white/8 p-8 shadow-2xl shadow-black/50">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">Email</label>
                <input
                  type="email"
                  placeholder="store@campus.edu"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none transition-all focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/30"
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
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white placeholder-gray-600 outline-none transition-all focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/30"
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
                className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20"
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
            Need access? Contact your campus administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
