"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

type Role = "ADMIN" | "MERCHANT" | "USER";

const ROLE_CONFIG = {
  USER: {
    label: "End User",
    icon: "person",
    accent: "from-secondary to-purple-600",
    text: "text-secondary",
    ring: "focus:ring-secondary/40",
    border: "border-secondary/20 hover:border-secondary/40",
    bgHover: "hover:bg-secondary/10",
    activeBg: "bg-secondary/15 border-secondary/50",
  },
  MERCHANT: {
    label: "Merchant",
    icon: "storefront",
    accent: "from-tertiary to-cyan-600",
    text: "text-tertiary",
    ring: "focus:ring-tertiary/40",
    border: "border-tertiary/20 hover:border-tertiary/40",
    bgHover: "hover:bg-tertiary/10",
    activeBg: "bg-tertiary/15 border-tertiary/50",
  },
  ADMIN: {
    label: "Admin",
    icon: "shield_person",
    accent: "from-primary to-blue-600",
    text: "text-primary",
    ring: "focus:ring-primary/40",
    border: "border-primary/20 hover:border-primary/40",
    bgHover: "hover:bg-primary/10",
    activeBg: "bg-primary/15 border-primary/50",
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
      const r = (session?.user as { role?: string })?.role;
      if (r === "ADMIN") router.replace("/admin");
      else if (r === "MERCHANT") router.replace("/merchant");
      else if (r === "USER") router.replace("/dashboard");
      else router.replace("/");
    }
  }, [status, session, router]);

  if (status === "loading") return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );

  const cfg = ROLE_CONFIG[role];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const provider =
      role === "ADMIN" ? "admin-credentials" :
      role === "MERCHANT" ? "merchant-credentials" : "user-credentials";

    const res = await signIn(provider, { email, password, redirect: false });

    setLoading(false);

    if (res?.error) {
      setError(res.error === "CredentialsSignin" ? "Invalid email or password" : res.error);
      return;
    }

    router.replace(role === "ADMIN" ? "/admin" : role === "MERCHANT" ? "/merchant" : "/dashboard");
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background text-on-surface font-body overflow-hidden">
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />

      {/* Left Panel: Visuals & Branding (Hidden on Mobile) */}
      <div className="hidden lg:flex flex-col justify-between p-12 relative bg-surface-container-lowest border-r border-outline-variant/20 overflow-hidden">
        {/* Dynamic Orbs background behind text */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="orb w-[500px] h-[500px] bg-primary top-[-100px] left-[-100px] opacity-20" style={{ animationDelay: "0s" }} />
          <div className="orb w-[400px] h-[400px] bg-tertiary bottom-[-100px] right-[-50px] opacity-[0.15]" style={{ animationDelay: "-5s" }} />
          <div className="absolute inset-0 bg-background/40 backdrop-blur-[80px]" />
        </div>

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 group cursor-pointer text-2xl font-bold tracking-tighter text-white">
            <span className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-on-primary text-xl">offline_bolt</span>
            </span>
            Tap<span className="text-primary">finity</span>
          </Link>
        </div>

        <div className="relative z-10 max-w-md">
          <div className="inline-flex items-center gap-3 bg-surface-container-high/50 px-4 py-2 rounded-full border border-outline-variant/30 mb-6 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="font-label text-xs uppercase tracking-widest text-on-surface-variant">Sovereign Architecture</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter leading-tight mb-6">
            Access your <br/>
            <span className="text-gradient">Ecosystem</span>
          </h1>
          <p className="text-on-surface-variant text-lg leading-relaxed">
            Military-grade atomic transactions. No physical currency. Total operational accountability. Select your role to enter the secure environment.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-4 text-sm text-on-surface-variant font-label uppercase tracking-widest">
          <div className="flex gap-1">
            {[...Array(3)].map((_, i) => (
              <span key={i} className="w-1.5 h-1.5 rounded-full bg-outline-variant" />
            ))}
          </div>
          System Status: Optimal
        </div>
      </div>

      {/* Right Panel: Login Form (Centered, Mobile Responsive) */}
      <div className="flex flex-col items-center justify-center p-6 relative">
        {/* Subtle blur for right side mobile context */}
        <div className="absolute lg:hidden inset-0 pointer-events-none z-0">
          <div className="orb w-[300px] h-[300px] bg-primary top-0 left-0 opacity-[0.15]" />
          <div className="absolute inset-0 bg-background/80 backdrop-blur-[60px]" />
        </div>

        <div className="w-full max-w-sm relative z-10">
          
          {/* Mobile Header (Only visible on sm/md) */}
          <div className="lg:hidden text-center mb-10 w-full flex flex-col items-center">
            <Link href="/" className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-primary shadow-2xl shadow-primary/20 mb-4 transition-transform active:scale-95">
              <span className="material-symbols-outlined text-on-primary text-3xl">offline_bolt</span>
            </Link>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Tapfinity</h1>
            <p className="text-sm text-on-surface-variant">Access your operational environment</p>
          </div>

          <div className="mb-8 hidden lg:block">
            <h2 className="text-3xl font-bold tracking-tight mb-2">Sign In</h2>
            <p className="text-on-surface-variant text-sm">Welcome back. Enter your credentials to continue.</p>
          </div>

          <div className="glass-card rounded-[2rem] p-8 md:p-10 border border-outline-variant/20 shadow-2xl shadow-black/50">
            {/* Custom Role Selector Toggle */}
            <div className="flex space-x-2 mb-8 bg-surface-container-highest p-1.5 rounded-2xl border border-outline-variant/30">
              {(["USER", "MERCHANT", "ADMIN"] as Role[]).map(r => {
                const c = ROLE_CONFIG[r];
                const isActive = role === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => { setRole(r); setError(""); }}
                    className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl transition-all duration-300 font-label tracking-wide text-xs uppercase
                      ${isActive ? `bg-surface-container-high shadow-md shadow-black/20 ${c.text} ${c.activeBg}` : `text-on-surface-variant ${c.bgHover} ${c.border} border-transparent`}
                    `}
                  >
                    <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                      {c.icon}
                    </span>
                    <span className="font-bold">{c.label}</span>
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block font-label text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">Email Address</label>
                <input
                  type="email"
                  placeholder="you@campus.edu"
                  className={`w-full bg-surface-container-high border border-outline-variant/20 rounded-xl px-4 py-3.5 text-white placeholder-outline-variant outline-none transition-all ${cfg.ring} focus:bg-surface-container-highest`}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="block font-label text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className={`w-full bg-surface-container-high border border-outline-variant/20 rounded-xl px-4 py-3.5 pr-12 text-white placeholder-outline-variant outline-none transition-all ${cfg.ring} focus:bg-surface-container-highest`}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-outline-variant hover:text-white transition-colors p-2"
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
                className={`w-full bg-gradient-to-r ${cfg.accent} text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:brightness-110 hover:shadow-${cfg.accent.split('-')[1]}/30`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Authenticating...
                  </>
                ) : (
                  <>
                    Sign in as {cfg.label}
                    <span className="material-symbols-outlined text-lg">login</span>
                  </>
                )}
              </button>
            </form>
          </div>
          
          <div className="text-center mt-8 space-y-4">
             <Link href="/" className="inline-flex items-center gap-2 text-xs font-label uppercase tracking-widest text-outline-variant hover:text-white transition-colors">
              <span className="material-symbols-outlined justify-center text-sm">arrow_back</span>
              Return to Homepage
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
