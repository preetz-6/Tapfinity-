"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Role = "ADMIN" | "MERCHANT" | "USER";

const ROLE_CONFIG = {
  USER: {
    label: "User",
    icon: "👤",
    accent: "from-orange-500 to-amber-600",
    ring: "ring-orange-500/40",
    border: "border-orange-500/20",
  },
  MERCHANT: {
    label: "Merchant",
    icon: "🏪",
    accent: "from-violet-500 to-indigo-600",
    ring: "ring-violet-500/40",
    border: "border-violet-500/20",
  },
  ADMIN: {
    label: "Admin",
    icon: "⚙️",
    accent: "from-blue-500 to-cyan-500",
    ring: "ring-blue-500/40",
    border: "border-blue-500/20",
  },
} as const;

export default function Login() {
  const router = useRouter();
  const { status, data: session } = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("USER");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      const r = session?.user?.role;
      if (r === "ADMIN") router.replace("/admin");
      else if (r === "MERCHANT") router.replace("/merchant");
      else if (r === "USER") router.replace("/dashboard");
      else router.replace("/");
    }
  }, [status, session, router]);

  if (status === "loading") return null;

  const cfg = ROLE_CONFIG[role];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const provider =
      role === "ADMIN"
        ? "admin-credentials"
        : role === "MERCHANT"
        ? "merchant-credentials"
        : "user-credentials";

    const res = await signIn(provider, {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("Invalid email or password");
      return;
    }

    router.replace(
      role === "ADMIN" ? "/admin" : role === "MERCHANT" ? "/merchant" : "/dashboard"
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050a18] relative overflow-hidden">
      {/* Ambient blobs */}
      <div className="absolute top-[-15%] left-[-5%] w-[500px] h-[500px] rounded-full bg-blue-700/10 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-5%] w-[400px] h-[400px] rounded-full bg-purple-700/10 blur-[120px] pointer-events-none" />

      <div className="relative w-full max-w-md px-4 py-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${cfg.accent} shadow-2xl mb-4 transition-all duration-500`}>
            <span className="text-2xl">📳</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Tap<span className={`bg-gradient-to-r ${cfg.accent} bg-clip-text text-transparent`}>finity</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">Campus Payment Platform</p>
        </div>

        {/* Card */}
        <div className={`rounded-2xl border ${cfg.border} bg-[#0a1628]/90 backdrop-blur-xl p-8 shadow-2xl transition-all duration-300`}>

          {/* Role Selector */}
          <div className="grid grid-cols-3 gap-2 mb-7 p-1 rounded-xl bg-black/40 border border-white/5">
            {(["USER", "MERCHANT", "ADMIN"] as Role[]).map(r => {
              const c = ROLE_CONFIG[r];
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => { setRole(r); setError(""); }}
                  className={`flex flex-col items-center gap-1 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                    role === r
                      ? `bg-gradient-to-br ${c.accent} text-white shadow-lg scale-[1.02]`
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  <span className="text-base">{c.icon}</span>
                  {c.label}
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400 font-medium uppercase tracking-wider">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                className={`w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-white text-sm placeholder-gray-600 outline-none transition-all focus:border-white/25 focus:ring-2 ${cfg.ring}`}
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-gray-400 font-medium uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={`w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 pr-12 text-white text-sm placeholder-gray-600 outline-none transition-all focus:border-white/25 focus:ring-2 ${cfg.ring}`}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition text-sm select-none"
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3">
                <span className="text-red-400 text-xs font-bold">✕</span>
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full rounded-xl bg-gradient-to-r ${cfg.accent} py-3.5 text-white font-semibold text-sm shadow-lg transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-2`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Signing in…
                </span>
              ) : (
                `Sign in as ${ROLE_CONFIG[role].label}`
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          Tapfinity · Secure NFC Campus Payments
        </p>
      </div>
    </div>
  );
}
