"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [contactOpen, setContactOpen] = useState(false);
  const [contactSent, setContactSent] = useState(false);
  const [contactError, setContactError] = useState("");
  const [contactLoading, setContactLoading] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", phone: "", email: "", location: "" });

  useEffect(() => {
    if (status !== "authenticated") return;
    const role = (session?.user as { role?: string })?.role;
    if (role === "ADMIN") router.replace("/admin");
    else if (role === "MERCHANT") router.replace("/merchant");
    else if (role === "USER") router.replace("/dashboard");
  }, [status, session, router]);

  return (
    <main className="min-h-screen bg-[#030508] text-white overflow-x-hidden">

      {/* ── CONTACT MODAL ── */}
      {contactOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl bg-[#080f20] border border-white/10 shadow-2xl overflow-hidden">
            <div className="px-6 pt-6 pb-4 border-b border-white/5 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Get in Touch</h2>
                <p className="text-xs text-gray-500 mt-0.5">We'll reach out to set up Tapfinity for your campus</p>
              </div>
              <button onClick={() => { setContactOpen(false); setContactSent(false); setContactForm({ name: "", phone: "", email: "", location: "" }); }}
                className="text-gray-600 hover:text-white text-xl leading-none transition">×</button>
            </div>

            {contactSent ? (
              <div className="px-6 py-10 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center mx-auto">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-400"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <p className="text-white font-semibold">Thanks, {contactForm.name.split(" ")[0]}!</p>
                <p className="text-sm text-gray-500">We'll be in touch at {contactForm.email} shortly.</p>
              </div>
            ) : (
              <div className="px-6 py-5 space-y-4">
                {[
                  { key: "name",     label: "Full Name",     placeholder: "Your name",           type: "text" },
                  { key: "phone",    label: "Phone Number",  placeholder: "+91 98765 43210",      type: "tel" },
                  { key: "email",    label: "Email",         placeholder: "you@college.edu",      type: "email" },
                  { key: "location", label: "College / City",placeholder: "e.g. NITK Surathkal",  type: "text" },
                ].map(({ key, label, placeholder, type }) => (
                  <div key={key}>
                    <p className="text-xs text-gray-500 mb-1.5">{label}</p>
                    <input
                      type={type}
                      placeholder={placeholder}
                      value={contactForm[key as keyof typeof contactForm]}
                      onChange={e => setContactForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl bg-black/30 border border-white/10 text-white text-sm placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/20 transition"
                    />
                  </div>
                ))}

                {contactError && (
                  <p className="text-xs text-red-400">{contactError}</p>
                )}

                <button
                  onClick={async () => {
                    const { name, phone, email, location } = contactForm;
                    if (!name.trim() || !phone.trim() || !email.trim() || !location.trim()) {
                      setContactError("Please fill in all fields.");
                      return;
                    }
                    setContactError("");
                    setContactLoading(true);
                    const res = await fetch("/api/contact", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ name, phone, email, location }),
                    });
                    const data = await res.json();
                    setContactLoading(false);
                    if (!res.ok) { setContactError(data.error || "Something went wrong."); return; }
                    setContactSent(true);
                  }}
                  disabled={contactLoading}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition active:scale-95 mt-1 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {contactLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Sending…
                    </>
                  ) : "Send Message"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── NAVBAR ── */}
      <header className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 sm:px-10 py-4 bg-[#030508]/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-3">
          {/* Logo mark */}
          <div className="relative w-9 h-9 flex-shrink-0">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30" />
            <div className="absolute inset-0 rounded-xl flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 32 32" fill="none" className="text-white">
                <rect x="2" y="7" width="28" height="18" rx="3" stroke="currentColor" strokeWidth="2"/>
                <path d="M21 16a5 5 0 0 1-10 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="16" cy="16" r="1.5" fill="currentColor"/>
                <path d="M6 12h3M6 20h3M23 12h3M23 20h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
              </svg>
            </div>
          </div>
          <div className="leading-tight">
            <span className="text-lg font-black tracking-tight">Tap<span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">finity</span></span>
            <div className="flex items-center gap-1 -mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-emerald-400/70 font-medium tracking-wide">NFC Payments</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setContactOpen(true)}
          className="rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-2 text-sm font-semibold transition shadow-lg shadow-blue-500/20 active:scale-95 text-white">
          Contact Us
        </button>
      </header>

      {/* ── HERO ── */}
      <section className="relative pt-32 pb-24 px-6 sm:px-10 text-center overflow-hidden">
        {/* Background orbs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-600/8 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-40 left-[10%] w-[300px] h-[300px] bg-violet-600/8 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute top-40 right-[10%] w-[300px] h-[300px] bg-cyan-600/6 blur-[100px] rounded-full pointer-events-none" />

        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/8 px-4 py-1.5 text-xs font-medium text-blue-400 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          NFC-Powered Campus Payments
        </div>

        <h1 className="text-5xl sm:text-7xl font-black leading-[1.05] tracking-tight mb-6 max-w-4xl mx-auto">
          The future of
          <br />
          <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
            campus payments
          </span>
          <br />
          is a tap away.
        </h1>

        <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed mb-10">
          Tapfinity replaces cash and UPI with a secure, lightning-fast NFC card system built for colleges, cafeterias, hostels, and campus events.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/login"
            className="rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 px-8 py-4 text-sm font-bold shadow-2xl shadow-blue-500/30 hover:opacity-90 transition active:scale-95 w-full sm:w-auto text-center">
            Sign In to Dashboard →
          </Link>
          <a href="#how-it-works"
            className="rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 px-8 py-4 text-sm font-semibold text-gray-300 transition w-full sm:w-auto text-center">
            See how it works
          </a>
        </div>

        {/* Stats row */}
        <div className="mt-16 grid grid-cols-3 gap-4 max-w-lg mx-auto">
          {[
            { val: "<50ms", label: "Payment speed" },
            { val: "0 cash", label: "No physical money" },
            { val: "3 roles", label: "Admin · Merchant · User" },
          ].map(s => (
            <div key={s.label} className="rounded-2xl bg-white/3 border border-white/5 py-4 px-3">
              <p className="text-xl sm:text-2xl font-black text-white">{s.val}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="px-6 sm:px-10 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs text-blue-400 uppercase tracking-widest font-semibold mb-3">How it works</p>
          <h2 className="text-3xl sm:text-4xl font-black">Payment in 3 steps</h2>
          <p className="text-gray-500 mt-3 max-w-xl mx-auto">No cash, no QR codes, no delays. Just tap and go.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative">
          {/* connector line desktop */}
          <div className="hidden md:block absolute top-16 left-[16.5%] right-[16.5%] h-px bg-gradient-to-r from-blue-500/0 via-blue-500/40 to-blue-500/0" />

          {[
            { step: "01", icon: "01", title: "Merchant enters amount", desc: "The merchant opens their phone, enters the charge amount, and taps Continue." },
            { step: "02", icon: "02", title: "Customer taps NFC card", desc: "The customer holds their NFC card to the merchant's phone. The card secret is read instantly." },
            { step: "03", icon: "✓", title: "Payment confirmed", desc: "Backend verifies the card, debits the wallet atomically, and both parties see instant confirmation." },
          ].map(s => (
            <div key={s.step} className="relative rounded-2xl border border-white/8 bg-[#080d18] p-7 hover:border-blue-500/20 transition group">
              <div className="flex items-center gap-3 mb-5">
                <span className="text-xs font-black text-blue-500/60 tracking-widest">{s.step}</span>
                <div className="flex-1 h-px bg-white/5" />
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/15 flex items-center justify-center text-2xl group-hover:scale-110 transition">{s.icon}</div>
              </div>
              <h3 className="text-lg font-bold mb-2">{s.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES GRID ── */}
      <section className="px-6 sm:px-10 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs text-violet-400 uppercase tracking-widest font-semibold mb-3">Features</p>
          <h2 className="text-3xl sm:text-4xl font-black">Everything you need</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: "SHA", title: "Card Secret Hashing", desc: "NFC UID is never used. A random secret is written to the card and only its SHA-256 hash is stored — preventing cloning attacks.", accent: "blue" },
            { icon: "ATM", title: "Atomic Transactions", desc: "Every payment uses prisma.$transaction() — balance deduction, transaction record, and merchant link happen atomically or not at all.", accent: "violet" },
            { icon: "RLT", title: "Rate Limiting", desc: "IP-based rate limiting on the NFC authorize endpoint. 5 attempts per 5 seconds — brute force is blocked at the server.", accent: "cyan" },
            { icon: "ADM", title: "Admin Control Panel", desc: "Full user and merchant management. Create accounts, assign NFC cards, block/unblock users, top-up wallets, and export audit logs.", accent: "blue" },
            { icon: "CHT", title: "Live Analytics", desc: "Real-time transaction charts, credit/debit split, spending trends, and merchant performance — all in the admin dashboard.", accent: "violet" },
            { icon: "IDM", title: "Idempotency", desc: "Every transaction has a unique clientTxId. Duplicate payments from network retries are automatically rejected.", accent: "cyan" },
            { icon: "MOB", title: "Mobile First", desc: "Built for phones. The merchant receive page, admin panel, and user dashboard all work seamlessly on any screen size.", accent: "blue" },
            { icon: "MRC", title: "Multi-Merchant", desc: "Multiple merchants can operate simultaneously. Each merchant has their own transaction history and is linked to payments.", accent: "violet" },
            { icon: "CSV", title: "Audit Export", desc: "Download filtered CSV reports by date range, merchant, user, or status. Full audit trail for compliance and accounting.", accent: "cyan" },
          ].map(f => {
            const accents: Record<string, string> = {
              blue: "border-blue-500/15 hover:border-blue-500/30 hover:bg-blue-500/5",
              violet: "border-violet-500/15 hover:border-violet-500/30 hover:bg-violet-500/5",
              cyan: "border-cyan-500/15 hover:border-cyan-500/30 hover:bg-cyan-500/5",
            };
            const iconBg: Record<string, string> = {
              blue: "bg-blue-500/10 border-blue-500/20",
              violet: "bg-violet-500/10 border-violet-500/20",
              cyan: "bg-cyan-500/10 border-cyan-500/20",
            };
            return (
              <div key={f.title} className={`rounded-2xl border bg-[#080d18] p-6 transition ${accents[f.accent]}`}>
                <div className={`w-11 h-11 rounded-xl border flex items-center justify-center text-xl mb-4 ${iconBg[f.accent]}`}>{f.icon}</div>
                <h3 className="font-bold text-white mb-1.5">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── ROLES SECTION ── */}
      <section className="px-6 sm:px-10 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs text-cyan-400 uppercase tracking-widest font-semibold mb-3">Roles</p>
          <h2 className="text-3xl sm:text-4xl font-black">Three roles, one platform</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { icon: "A", role: "Admin", color: "from-blue-500 to-indigo-600", border: "border-blue-500/20", perms: ["Create & manage users", "Provision NFC cards", "Top-up wallets", "Block / unblock accounts", "Export audit logs", "View all transactions"] },
            { icon: "M", role: "Merchant", color: "from-violet-500 to-purple-600", border: "border-violet-500/20", perms: ["Accept NFC payments", "View transaction history", "Real-time payment status", "Automatic amount entry"] },
            { icon: "U", role: "User", color: "from-orange-500 to-amber-600", border: "border-orange-500/20", perms: ["Tap-to-pay at merchants", "Check wallet balance", "View spending history", "Top-up via UPI", "Block card instantly"] },
          ].map(r => (
            <div key={r.role} className={`rounded-2xl border ${r.border} bg-[#080d18] p-7 flex flex-col`}>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${r.color} flex items-center justify-center text-2xl mb-5 shadow-lg`}>{r.icon}</div>
              <h3 className="text-xl font-black mb-4">{r.role}</h3>
              <ul className="space-y-2 flex-1">
                {r.perms.map(p => (
                  <li key={p} className="flex items-center gap-2.5 text-sm text-gray-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/30 flex-shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-6 sm:px-10 py-20 max-w-3xl mx-auto text-center">
        <div className="rounded-3xl border border-white/8 bg-gradient-to-br from-blue-500/8 via-violet-500/5 to-cyan-500/8 p-12 sm:p-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.08),transparent_70%)]" />
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center mx-auto mb-5"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-blue-400"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M16 12a4 4 0 0 1-8 0"/></svg></div>
            <h2 className="text-3xl sm:text-4xl font-black mb-4">Ready to go cashless?</h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">Set up takes minutes. Add your admin, create users, provision cards, and start accepting payments today.</p>
            <a href="#how-it-works"
              className="inline-block rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 px-10 py-4 font-bold text-sm shadow-2xl shadow-blue-500/30 hover:opacity-90 transition active:scale-95">
              See How It Works →
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5 px-6 sm:px-10 py-8 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="relative w-6 h-6 flex-shrink-0">
            <div className="absolute inset-0 rounded-md bg-gradient-to-br from-blue-500 to-indigo-600" />
            <div className="absolute inset-0 flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 32 32" fill="none" className="text-white">
                <rect x="2" y="7" width="28" height="18" rx="3" stroke="currentColor" strokeWidth="2.5"/>
                <path d="M21 16a5 5 0 0 1-10 0" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
          <span className="text-sm font-bold">Tap<span className="text-blue-400">finity</span></span>
        </div>
        <p className="text-xs text-gray-600">© {new Date().getFullYear()} Tapfinity · Secure NFC Campus Payments</p>
        <button onClick={() => setContactOpen(true)} className="text-xs text-gray-500 hover:text-white transition">Contact us →</button>
      </footer>
    </main>
  );
}
