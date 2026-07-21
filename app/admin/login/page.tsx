"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminLogin() {
  const router = useRouter();
  const { status } = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loadingText, setLoadingText] = useState("Authenticating...");

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/admin");
    }
  }, [status, router]);

  if (status === "loading") return (
    <div className="min-h-screen flex items-center justify-center bg-[#050a18]">
      <svg className="animate-spin h-7 w-7 text-blue-500/60" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
    </div>
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("admin-credentials", { email, password, redirect: false });

    if (res?.error) {
      setLoading(false);
      setError(res.error === "CredentialsSignin" ? "Invalid credentials" : res.error);
      return;
    }

    setLoadingText("Loading console");
    router.replace("/admin");
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[#050a18] text-white font-body overflow-hidden">
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      <meta name="robots" content="noindex, nofollow" />

      {/* Left Panel: Branding (Hidden on Mobile) */}
      <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute w-[500px] h-[500px] rounded-full bg-blue-500/[0.08] blur-[120px] -top-32 -left-32" />
          <div className="absolute w-[400px] h-[400px] rounded-full bg-cyan-500/[0.06] blur-[100px] -bottom-24 -right-24" />
          <div className="absolute inset-0 bg-[#050a18]/40 backdrop-blur-[60px]" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-blue-400 text-lg">offline_bolt</span>
            </div>
            <span className="text-xl font-bold tracking-tight">Tapfinity</span>
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <div className="inline-flex items-center gap-2.5 bg-blue-500/8 border border-blue-500/15 px-4 py-2 rounded-full mb-6">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-xs font-medium text-blue-400/80 uppercase tracking-widest">Admin Console</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter leading-tight mb-4">
            System<br/>
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Administration</span>
          </h1>
        </div>

        <div className="relative z-10">
          <p className="text-xs text-gray-600">© 2026 Tapfinity. Authorized personnel only.</p>
        </div>
      </div>

      {/* Right Panel: Login Form */}
      <div className="flex flex-col items-center justify-center p-6 relative">
        {/* Mobile background */}
        <div className="absolute lg:hidden inset-0 pointer-events-none">
          <div className="absolute w-[300px] h-[300px] rounded-full bg-blue-500/[0.08] blur-[100px] top-0 left-0" />
          <div className="absolute inset-0 bg-[#050a18]/80 backdrop-blur-[60px]" />
        </div>

        <div className="w-full max-w-sm relative z-10">
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 mb-4">
              <span className="material-symbols-outlined text-blue-400 text-3xl">offline_bolt</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight mb-1">Tapfinity</h1>
            <p className="text-sm text-gray-500">Admin Console</p>
          </div>

          {/* Desktop heading */}
          <div className="mb-8 hidden lg:block">
            <h2 className="text-2xl font-bold tracking-tight mb-2">Admin Sign In</h2>
            <p className="text-sm text-gray-500">Enter your credentials to continue.</p>
          </div>

          {/* Login Card */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/8 p-8 shadow-2xl shadow-black/50">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">Email</label>
                <input
                  type="email"
                  placeholder="admin@tapfinity.in"
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-gray-600 outline-none transition-all focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/30"
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
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3.5 pr-12 text-white placeholder-gray-600 outline-none transition-all focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/30"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors p-2"
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 animate-in fade-in zoom-in duration-300">
                  <span className="material-symbols-outlined text-red-400 text-lg">error</span>
                  <p className="text-red-400 text-sm font-medium">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:brightness-110"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    {loadingText}
                  </>
                ) : (
                  <>
                    Sign In
                    <span className="material-symbols-outlined text-lg">login</span>
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="text-center mt-8 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-gray-600 hover:text-white transition-colors">
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Return to Homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
