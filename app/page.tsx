"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Transaction {
  id: string;
  time: string;
  merchant: string;
  amount: number;
}

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [contactOpen, setContactOpen]       = useState(false);
  const [contactSent, setContactSent]       = useState(false);
  const [contactError, setContactError]     = useState("");
  const [contactLoading, setContactLoading] = useState(false);
  const [contactForm, setContactForm]       = useState({ name: "", phone: "", email: "", location: "" });

  // NFC Simulator state
  const [nfcState, setNfcState] = useState<"idle" | "tapping" | "processing" | "settled">("idle");
  const [transactions, setTransactions] = useState<Transaction[]>([
    { id: "tx_f8e21a", time: "14:32:01", merchant: "Cafeteria Cafe", amount: 120 },
    { id: "tx_d9a18c", time: "14:31:45", merchant: "Campus Bookstore", amount: 650 },
    { id: "tx_c5b290", time: "14:29:12", merchant: "Hostel Laundry", amount: 40 },
  ]);
  const [simulatedBalance, setSimulatedBalance] = useState(1500);

  // Scroll graph state
  const [scrollProgress, setScrollProgress] = useState(0);
  const scrollSectionRef = useRef<HTMLDivElement>(null);

  // ── Redirect logic ──
  useEffect(() => {
    if (status !== "authenticated") return;
    const role = (session?.user as { role?: string })?.role;
    if (role === "ADMIN")         router.replace("/admin");
    else if (role === "MERCHANT") router.replace("/merchant");
    else if (role === "USER")     router.replace("/dashboard");
  }, [status, session, router]);

  // ── Scroll reveal + 3D tilt ──
  useEffect(() => {
    const observerOptions = { threshold: 0.1, rootMargin: "0px 0px -50px 0px" };

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add("active"); });
    }, observerOptions);
    document.querySelectorAll(".reveal").forEach(el => revealObserver.observe(el));

    const bentoObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) setTimeout(() => entry.target.classList.add("active"), index * 100);
      });
    }, observerOptions);
    document.querySelectorAll(".stagger-item").forEach(el => bentoObserver.observe(el));

    const handleMouseMove = (e: MouseEvent) => {
      const card = e.currentTarget as HTMLElement;
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = (y - centerY) / 20;
      const rotateY = (centerX - x) / 20;
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px) scale(1.02)`;
    };
    const handleMouseLeave = (e: MouseEvent) => {
      (e.currentTarget as HTMLElement).style.transform = "";
    };

    const cards = document.querySelectorAll(".glass-card");
    cards.forEach(card => {
      card.addEventListener("mousemove", handleMouseMove as EventListener);
      card.addEventListener("mouseleave", handleMouseLeave as EventListener);
    });

    return () => {
      revealObserver.disconnect();
      bentoObserver.disconnect();
      cards.forEach(card => {
        card.removeEventListener("mousemove", handleMouseMove as EventListener);
        card.removeEventListener("mouseleave", handleMouseLeave as EventListener);
      });
    };
  }, []);

  // Scroll graph tracking
  useEffect(() => {
    const handleScroll = () => {
      if (!scrollSectionRef.current) return;
      const rect = scrollSectionRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const progress = Math.max(0, Math.min(1, (windowHeight - rect.top) / (rect.height + windowHeight)));
      setScrollProgress(progress);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // NFC Tap handler with Web Audio beep
  const triggerNfcTap = () => {
    if (nfcState !== "idle") return;
    setNfcState("tapping");
    setTimeout(() => {
      setNfcState("processing");
      setTimeout(() => {
        setNfcState("settled");

        // Web Audio beep
        try {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtx) {
            const ctx = new AudioCtx();
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const gain = ctx.createGain();
            osc1.connect(gain); osc2.connect(gain); gain.connect(ctx.destination);
            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.02);
            gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
            osc1.frequency.setValueAtTime(880, ctx.currentTime);
            osc1.type = "sine"; osc1.start(ctx.currentTime); osc1.stop(ctx.currentTime + 0.15);
            osc2.frequency.setValueAtTime(1760, ctx.currentTime + 0.08);
            osc2.type = "sine"; osc2.start(ctx.currentTime + 0.08); osc2.stop(ctx.currentTime + 0.28);
          }
        } catch (_) {}

        const merchants = ["Campus Cafeteria", "Sports Complex", "Library Printing", "Tech Lab Store"];
        const merchant = merchants[Math.floor(Math.random() * merchants.length)];
        const amount = Math.floor(Math.random() * 250) + 20;
        const time = new Date().toTimeString().split(" ")[0];
        const newTx: Transaction = { id: `tx_${Math.random().toString(36).substr(2, 6)}`, time, merchant, amount };
        setTransactions(prev => [newTx, ...prev.slice(0, 4)]);
        setSimulatedBalance(prev => Math.max(0, prev - amount));

        setTimeout(() => setNfcState("idle"), 2500);
      }, 900);
    }, 400);
  };

  const closeContact = () => {
    setContactOpen(false);
    setContactSent(false);
    setContactForm({ name: "", phone: "", email: "", location: "" });
  };

  async function handleContactSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { name, phone, email, location } = contactForm;
    if (!name.trim() || !phone.trim() || !email.trim() || !location.trim()) {
      setContactError("Please fill in all fields."); return;
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
  }

  return (
    <div className="bg-background text-on-surface font-body selection:bg-primary/30 overflow-x-hidden">
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />

      {/* Dynamic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-[-1]">
        <div className="orb w-[600px] h-[600px] bg-primary top-[-200px] left-[-150px]" style={{ animationDelay: "0s" }} />
        <div className="orb w-[500px] h-[500px] bg-tertiary bottom-[-100px] right-[-100px]" style={{ animationDelay: "-5s" }} />
        <div className="orb w-[400px] h-[400px] bg-secondary left-[40%] top-[30%] opacity-10" style={{ animationDelay: "-10s" }} />
        <div className="orb w-[350px] h-[350px] bg-primary/30 top-[20%] right-[15%]" style={{ animationDelay: "-15s" }} />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-slate-950/40 backdrop-blur-xl border-b border-white/5">
        <div className="flex justify-between items-center px-4 md:px-8 py-4 max-w-7xl mx-auto">
          <div className="text-2xl font-bold tracking-tighter text-slate-50 flex items-center gap-3 group cursor-pointer">
            <Image src="/tapfinity-logo.png" alt="Tapfinity" width={36} height={36} className="rounded-lg group-hover:rotate-12 transition-transform duration-500" />
            Tapfinity
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden md:block text-slate-400 hover:text-slate-100 transition-colors font-headline tracking-tight text-sm font-medium px-4 py-2 hover:bg-white/5 rounded-xl">
              Sign In
            </Link>
            <button onClick={() => setContactOpen(true)} className="bg-gradient-primary text-on-primary font-bold px-6 py-2 rounded-xl transition-all active:scale-95 shadow-lg shadow-primary/20 hover:neon-glow">
              Contact Us
            </button>
          </div>
        </div>
      </nav>

      <main className="relative pt-32">

        {/* ── Hero ── */}
        <section className="max-w-7xl mx-auto px-4 md:px-8 pb-32 grid lg:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col items-start gap-8">
            <div className="reveal inline-flex items-center gap-3 bg-surface-container-low px-4 py-2 rounded-full border border-outline-variant/20">
              <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
              <span className="font-label text-xs uppercase tracking-widest text-on-surface-variant">Next-Gen Campus Payments</span>
            </div>
            <h1 className="reveal text-5xl md:text-8xl font-black tracking-tighter leading-tight text-gradient">
              The Future of <br />Campus Payments
            </h1>
            <p className="reveal text-on-surface-variant text-xl max-w-2xl leading-relaxed" style={{ transitionDelay: "0.1s" }}>
              Experience atomic NFC transactions on a sovereign ledger. Fast, secure, and entirely cashless infrastructure for modern educational ecosystems.
            </p>
            <div className="reveal flex flex-wrap gap-4 mt-4" style={{ transitionDelay: "0.2s" }}>
              <Link href="/login">
                <button className="bg-gradient-primary text-on-primary font-bold px-8 py-4 rounded-xl flex items-center gap-2 group transition-all hover:translate-y-[-4px] hover:shadow-2xl hover:shadow-primary/40">
                  Sign In to Dashboard
                  <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </button>
              </Link>
              <button onClick={() => setContactOpen(true)} className="px-8 py-4 rounded-xl border border-outline-variant/30 text-on-surface font-medium hover:bg-white/5 transition-all hover:border-primary/50">
                See how it works
              </button>
            </div>
            <div className="reveal flex flex-wrap gap-6 md:gap-8 mt-12" style={{ transitionDelay: "0.3s" }}>
              <div className="flex flex-col">
                <span className="font-label text-2xl font-bold text-tertiary">&lt; 50ms</span>
                <span className="text-xs text-on-surface-variant uppercase tracking-widest">Latency</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label text-2xl font-bold text-secondary">0 Cash</span>
                <span className="text-xs text-on-surface-variant uppercase tracking-widest">In Circulation</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label text-2xl font-bold text-primary">100%</span>
                <span className="text-xs text-on-surface-variant uppercase tracking-widest">Atomic Success</span>
              </div>
            </div>
          </div>

          {/* Interactive NFC Terminal Simulator — replaces old static icon */}
          <div className="reveal relative flex items-center justify-center min-h-[400px]" style={{ transitionDelay: "0.4s" }}>
            <div className="relative w-full max-w-[320px] glass-card rounded-[2.5rem] p-6 border border-white/10 flex flex-col justify-between glow-border overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent opacity-50 z-0" />

              {/* Window chrome */}
              <div className="relative z-10 flex justify-between items-center w-full mb-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <div className="text-[10px] text-on-surface-variant font-label bg-white/5 px-3 py-1 rounded-full border border-white/5 uppercase tracking-wider">
                  Device: Canteen_04
                </div>
              </div>

              {/* NFC tap area */}
              <div className="relative z-10 flex flex-col items-center justify-center py-6 select-none">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  {nfcState === "processing" && (
                    <div className="absolute inset-0 border border-primary/40 rounded-full animate-ping" />
                  )}
                  {nfcState === "settled" && (
                    <div className="absolute inset-0 border-2 border-emerald-400/40 rounded-full animate-ping" />
                  )}

                  <div
                    onClick={triggerNfcTap}
                    className={`w-24 h-24 rounded-full flex flex-col items-center justify-center cursor-pointer transition-all duration-500 ${
                      nfcState === "processing" ? "bg-primary/20 border border-primary/50" :
                      nfcState === "settled"    ? "bg-emerald-500/20 border border-emerald-500" :
                      "bg-white/5 border border-white/10 hover:border-primary/40 hover:bg-white/10"
                    }`}
                  >
                    {(nfcState === "idle" || nfcState === "tapping") && (
                      <>
                        <span className={`material-symbols-outlined text-4xl text-primary ${nfcState === "tapping" ? "animate-bounce" : "animate-pulse"}`}>contactless</span>
                        {nfcState === "idle" && <span className="text-[9px] font-label font-bold text-primary uppercase tracking-widest mt-1">Tap to pay</span>}
                      </>
                    )}
                    {nfcState === "processing" && (
                      <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    )}
                    {nfcState === "settled" && (
                      <span className="material-symbols-outlined text-4xl text-emerald-400">check_circle</span>
                    )}
                  </div>
                </div>

                <div className="text-center mt-4">
                  <div className="text-xs text-on-surface-variant font-label uppercase tracking-widest">Amount Due</div>
                  <div className="text-2xl font-black font-label text-slate-100 mt-1">₹120.00</div>
                </div>
              </div>

              {/* Live ledger feed */}
              <div className="relative z-10 bg-slate-950/80 border border-white/5 rounded-2xl p-3 mt-2">
                <div className="flex justify-between items-center text-[9px] font-label text-on-surface-variant uppercase tracking-wider border-b border-white/5 pb-2 mb-2">
                  <span>Ledger Feed</span>
                  <span className="text-emerald-400 font-bold">₹{simulatedBalance.toFixed(0)} bal</span>
                </div>
                <div className="space-y-1.5 max-h-[70px] overflow-y-auto terminal-scroll pr-1">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="flex justify-between items-center text-[10px] animate-fade-up">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-200">{tx.merchant}</span>
                        <span className="text-[8px] text-on-surface-variant/60 font-mono">{tx.id}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold font-label text-slate-100">-₹{tx.amount}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Protocol Workflow (original) ── */}
        <section className="bg-surface-container-low py-32 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
            <h2 className="reveal font-label text-xs uppercase tracking-[0.4em] text-primary mb-16 text-center">Protocol Workflow</h2>
            <div className="grid md:grid-cols-3 gap-16 relative">
              <div className="reveal flex flex-col gap-6 group" style={{ transitionDelay: "0.1s" }}>
                <div className="w-16 h-16 rounded-2xl bg-surface-container-highest flex items-center justify-center text-primary border border-outline-variant/20 group-hover:border-primary group-hover:bg-primary/10 transition-all duration-500 transform group-hover:-rotate-6">
                  <span className="material-symbols-outlined text-3xl">point_of_sale</span>
                </div>
                <h3 className="text-2xl font-bold tracking-tight group-hover:text-primary transition-colors">01. Merchant Initiation</h3>
                <p className="text-on-surface-variant leading-relaxed">The merchant enters the transaction amount directly on any NFC-enabled mobile device acting as a terminal.</p>
              </div>
              <div className="reveal flex flex-col gap-6 group" style={{ transitionDelay: "0.2s" }}>
                <div className="w-16 h-16 rounded-2xl bg-surface-container-highest flex items-center justify-center text-tertiary border border-outline-variant/20 group-hover:border-tertiary group-hover:bg-tertiary/10 transition-all duration-500 transform group-hover:rotate-6">
                  <span className="material-symbols-outlined text-3xl">contactless</span>
                </div>
                <h3 className="text-2xl font-bold tracking-tight group-hover:text-tertiary transition-colors">02. Near-Field Exchange</h3>
                <p className="text-on-surface-variant leading-relaxed">The customer taps their authorized NFC card or student ID against the merchant's device to initiate secure handshake.</p>
              </div>
              <div className="reveal flex flex-col gap-6 group" style={{ transitionDelay: "0.3s" }}>
                <div className="w-16 h-16 rounded-2xl bg-surface-container-highest flex items-center justify-center text-secondary border border-outline-variant/20 group-hover:border-secondary group-hover:bg-secondary/10 transition-all duration-500 transform group-hover:-rotate-6">
                  <span className="material-symbols-outlined text-3xl">verified_user</span>
                </div>
                <h3 className="text-2xl font-bold tracking-tight group-hover:text-secondary transition-colors">03. Atomic Confirmation</h3>
                <p className="text-on-surface-variant leading-relaxed">Payment is verified and settled atomically on the ledger, updating both balances instantly with zero failure risk.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Features Bento Grid (original, with interactive scroll graph replacing the external img) ── */}
        <section className="py-32 max-w-7xl mx-auto px-4 md:px-8">
          <h2 className="reveal text-4xl font-black mb-16 text-center">Engineered for Scale</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6" id="bento-grid">

            {/* Tall Card — replaced external img with interactive scroll graph */}
            <div className="stagger-item lg:row-span-2 glass-card rounded-[2rem] p-8 flex flex-col group" ref={scrollSectionRef}>
              <span className="material-symbols-outlined text-4xl text-tertiary mb-6 transition-transform group-hover:rotate-12 duration-500">analytics</span>
              <h3 className="text-2xl font-bold tracking-tight mb-3 group-hover:text-tertiary transition-colors">Live Analytics</h3>
              <p className="text-on-surface-variant text-sm flex-grow">Monitor campus-wide spending habits in real-time. Merchants see peak hours while admins manage resource allocation.</p>

              {/* Interactive scroll-driven SVG graph */}
              <div className="mt-6 relative bg-black/30 rounded-xl p-3 border border-white/5 overflow-hidden">
                <div className="flex justify-between text-[9px] font-mono text-on-surface-variant/50 mb-2">
                  <span>08:00</span><span>13:00</span><span>20:00</span>
                </div>
                <svg className="w-full h-[90px]" viewBox="0 0 260 80" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="analyticsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00daf3" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#00daf3" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="analyticsLine" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#0070f3" />
                      <stop offset="50%" stopColor="#00daf3" />
                      <stop offset="100%" stopColor="#d0bcff" />
                    </linearGradient>
                  </defs>
                  {/* faint dashed full path */}
                  <path d="M0 70 Q40 50 55 25 T90 65 T145 15 T180 60 T235 22 L260 70" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" strokeDasharray="4,4" />
                  {/* scroll-animated fill + stroke */}
                  <path
                    d="M0 70 Q40 50 55 25 T90 65 T145 15 T180 60 T235 22 L260 70"
                    fill="url(#analyticsFill)"
                    stroke="url(#analyticsLine)"
                    strokeWidth="2.5"
                    strokeDasharray="800"
                    strokeDashoffset={800 - 800 * Math.min(scrollProgress * 2, 1)}
                  />
                  {/* active dot */}
                  {scrollProgress > 0.05 && (
                    <circle cx={5 + 250 * Math.min(scrollProgress * 2, 1)} cy="35" r="3.5" fill="#00daf3" className="animate-pulse" />
                  )}
                </svg>
                <div className="text-[9px] font-label text-tertiary/80 mt-1 text-right">
                  {Math.round(20 + scrollProgress * 60)} tx/s · scroll to seek
                </div>
              </div>
            </div>

            {/* Square Card */}
            <div className="stagger-item glass-card rounded-[2rem] p-10 flex flex-col group">
              <span className="material-symbols-outlined text-4xl text-secondary mb-6 group-hover:animate-spin">hub</span>
              <h3 className="text-xl font-bold tracking-tight mb-2 group-hover:text-secondary transition-colors">Atomic Transactions</h3>
              <p className="text-sm text-on-surface-variant">Indivisible operations ensuring no partial states or double spending.</p>
            </div>

            {/* Wide Card */}
            <div className="stagger-item md:col-span-2 glass-card rounded-[2rem] p-10 flex items-center gap-8 group">
              <div className="flex-grow">
                <h3 className="text-2xl font-bold tracking-tight mb-2 group-hover:text-primary transition-colors">Multi-Merchant</h3>
                <p className="text-on-surface-variant">Seamlessly manage cafes, bookstores, and ticket booths under one unified campus umbrella.</p>
              </div>
              <div className="hidden md:flex gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary group-hover:text-on-primary transition-all duration-500"><span className="material-symbols-outlined">coffee</span></div>
                <div className="w-14 h-14 rounded-full bg-secondary/20 flex items-center justify-center group-hover:bg-secondary group-hover:text-on-secondary transition-all duration-500"><span className="material-symbols-outlined">menu_book</span></div>
              </div>
            </div>

            {/* Features Card */}
            <div className="stagger-item md:col-span-2 glass-card rounded-[2rem] p-10 flex flex-col justify-between group cursor-pointer hover:border-primary/50 transition-all hover:translate-y-[-4px]">
              <div>
                <span className="material-symbols-outlined text-4xl text-primary mb-6 transition-transform group-hover:scale-125 duration-500">explore</span>
                <h3 className="text-2xl font-bold tracking-tight mb-2 group-hover:text-primary transition-colors">Explore Protocol Features</h3>
                <p className="text-sm text-on-surface-variant">Click to view the full specification of Tapfinity's protocol features, terminal management, and ledger mechanics.</p>
              </div>
              <div className="mt-8 flex justify-end">
                <Link href="/features" className="bg-gradient-primary text-on-primary font-bold px-6 py-2 rounded-xl flex items-center gap-2 group-hover:neon-glow transition-all active:scale-95 text-xs">
                  View All Features
                  <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform text-sm">arrow_forward</span>
                </Link>
              </div>
            </div>

            {/* Last Card */}
            <div className="stagger-item glass-card rounded-[2rem] p-10 group">
              <span className="material-symbols-outlined text-4xl text-white mb-6 transition-transform group-hover:rotate-180 duration-700">settings_suggest</span>
              <h3 className="text-xl font-bold tracking-tight mb-2">Admin Panel</h3>
              <p className="text-sm text-on-surface-variant">Full control over provisioning and security policies.</p>
            </div>
          </div>
        </section>

        {/* ── Ecosystem Roles (original) ── */}
        <section className="py-32 bg-surface-container-lowest relative">
          <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-16">
              <div className="reveal">
                <h2 className="text-4xl font-bold tracking-tight">Ecosystem Roles</h2>
                <p className="text-on-surface-variant mt-4 max-w-xl">A tripartite structure designed for total accountability and frictionless operation within the institution.</p>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {/* Admin */}
              <div className="reveal role-card glass-card rounded-[2.5rem] p-8 border border-outline-variant/10 hover:border-primary hover:shadow-[0_0_30px_rgba(174,198,255,0.2)] group" style={{ transitionDelay: "0.1s" }}>
                <div className="flex justify-between items-start mb-12">
                  <div className="text-primary font-label font-bold text-sm tracking-widest uppercase">The Controller</div>
                  <span className="role-icon material-symbols-outlined text-primary/50 group-hover:text-primary transition-all duration-500 text-3xl">shield_person</span>
                </div>
                <h3 className="text-2xl font-bold mb-4">Administrator</h3>
                <ul className="space-y-4">
                  <li className="flex items-center gap-3 text-sm text-on-surface-variant group-hover:text-on-surface transition-colors">
                    <span className="material-symbols-outlined text-sm text-primary">add_task</span>Provision new merchant IDs
                  </li>
                  <li className="flex items-center gap-3 text-sm text-on-surface-variant group-hover:text-on-surface transition-colors">
                    <span className="material-symbols-outlined text-sm text-primary">account_balance_wallet</span>Direct balance top-ups
                  </li>
                  <li className="flex items-center gap-3 text-sm text-on-surface-variant group-hover:text-on-surface transition-colors">
                    <span className="material-symbols-outlined text-sm text-primary">block</span>Instant security blocking
                  </li>
                </ul>
              </div>
              {/* Merchant */}
              <div className="reveal role-card glass-card rounded-[2.5rem] p-8 border border-outline-variant/10 hover:border-tertiary hover:shadow-[0_0_30px_rgba(0,218,243,0.2)] group" style={{ transitionDelay: "0.2s" }}>
                <div className="flex justify-between items-start mb-12">
                  <div className="text-tertiary font-label font-bold text-sm tracking-widest uppercase">The Node</div>
                  <span className="role-icon material-symbols-outlined text-tertiary/50 group-hover:text-tertiary transition-all duration-500 text-3xl">storefront</span>
                </div>
                <h3 className="text-2xl font-bold mb-4">Merchant</h3>
                <ul className="space-y-4">
                  <li className="flex items-center gap-3 text-sm text-on-surface-variant group-hover:text-on-surface transition-colors">
                    <span className="material-symbols-outlined text-sm text-tertiary">tap_and_play</span>Accept NFC payments
                  </li>
                  <li className="flex items-center gap-3 text-sm text-on-surface-variant group-hover:text-on-surface transition-colors">
                    <span className="material-symbols-outlined text-sm text-tertiary">history</span>View settlement history
                  </li>
                  <li className="flex items-center gap-3 text-sm text-on-surface-variant group-hover:text-on-surface transition-colors">
                    <span className="material-symbols-outlined text-sm text-tertiary">monitoring</span>Daily revenue tracking
                  </li>
                </ul>
              </div>
              {/* User */}
              <div className="reveal role-card glass-card rounded-[2.5rem] p-8 border border-outline-variant/10 hover:border-secondary hover:shadow-[0_0_30px_rgba(208,188,255,0.2)] group" style={{ transitionDelay: "0.3s" }}>
                <div className="flex justify-between items-start mb-12">
                  <div className="text-secondary font-label font-bold text-sm tracking-widest uppercase">The Participant</div>
                  <span className="role-icon material-symbols-outlined text-secondary/50 group-hover:text-secondary transition-all duration-500 text-3xl">person</span>
                </div>
                <h3 className="text-2xl font-bold mb-4">End User</h3>
                <ul className="space-y-4">
                  <li className="flex items-center gap-3 text-sm text-on-surface-variant group-hover:text-on-surface transition-colors">
                    <span className="material-symbols-outlined text-sm text-secondary">payments</span>Tap to pay anywhere
                  </li>
                  <li className="flex items-center gap-3 text-sm text-on-surface-variant group-hover:text-on-surface transition-colors">
                    <span className="material-symbols-outlined text-sm text-secondary">account_balance</span>Real-time balance check
                  </li>
                  <li className="flex items-center gap-3 text-sm text-on-surface-variant group-hover:text-on-surface transition-colors">
                    <span className="material-symbols-outlined text-sm text-secondary">lock</span>Block lost cards instantly
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA (original) ── */}
        <section className="py-32 px-4 md:px-8">
          <div className="reveal max-w-5xl mx-auto glass-card rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden border border-outline-variant/10">
            <div className="orb w-[400px] h-[400px] bg-primary top-[-200px] left-[-200px] opacity-20" />
            <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-8">Ready to go cashless?</h2>
            <p className="text-on-surface-variant text-lg max-w-2xl mx-auto mb-12">
              Join the growing network of universities transforming their physical currency into high-velocity digital assets.
            </p>
            <div className="flex justify-center">
              <button onClick={() => setContactOpen(true)} className="bg-gradient-primary text-on-primary font-bold px-10 py-5 rounded-xl transition-all active:scale-95 text-lg shadow-xl shadow-primary/30 hover:neon-glow hover:-translate-y-1">
                Contact Us
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 w-full py-12 px-4 md:px-8 relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="text-xl font-black text-slate-200 flex items-center gap-3">
              <Image src="/tapfinity-logo.png" alt="Tapfinity" width={28} height={28} className="rounded-md" />
              Tapfinity
            </div>
            <div className="font-label text-xs uppercase tracking-widest text-slate-500">© 2026 Tapfinity.</div>
          </div>
        </div>
      </footer>

      {/* Contact Modal (original) */}
      {contactOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/90 backdrop-blur-xl" onClick={closeContact} />
          <div className="glass-card w-full max-w-lg rounded-[2rem] p-10 relative border border-outline-variant/30 animate-in fade-in zoom-in duration-300">
            <button className="absolute top-6 right-6 text-on-surface-variant hover:text-white transition-colors" onClick={closeContact}>
              <span className="material-symbols-outlined">close</span>
            </button>
            <h2 className="text-3xl font-bold tracking-tight mb-2">Contact Us</h2>

            {contactSent ? (
              <div className="py-10 text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-emerald-400">check</span>
                </div>
                <p className="text-white font-bold text-xl mb-2">Thanks, {contactForm.name.split(" ")[0]}!</p>
                <p className="text-sm text-on-surface-variant">We&apos;ll be in touch at {contactForm.email} shortly.</p>
              </div>
            ) : (
              <>
                <p className="text-on-surface-variant mb-8">Tell us about your campus and we&apos;ll get back to you within 24 hours.</p>
                <form onSubmit={handleContactSubmit} className="space-y-6">
                  <div>
                    <label className="block font-label text-xs uppercase tracking-widest text-primary mb-2">Name</label>
                    <input className="w-full bg-surface-container-highest border-0 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary transition-all text-on-surface" placeholder="John Doe" type="text"
                      value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-label text-xs uppercase tracking-widest text-primary mb-2">Email</label>
                      <input className="w-full bg-surface-container-highest border-0 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary transition-all text-on-surface" placeholder="john@uni.edu" type="email"
                        value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} />
                    </div>
                    <div>
                      <label className="block font-label text-xs uppercase tracking-widest text-primary mb-2">Phone</label>
                      <input className="w-full bg-surface-container-highest border-0 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary transition-all text-on-surface" placeholder="+91 98765 43210" type="tel"
                        value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="block font-label text-xs uppercase tracking-widest text-primary mb-2">Location</label>
                    <input className="w-full bg-surface-container-highest border-0 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary transition-all text-on-surface" placeholder="Campus Name / City" type="text"
                      value={contactForm.location} onChange={(e) => setContactForm({ ...contactForm, location: e.target.value })} />
                  </div>
                  {contactError && <p className="text-xs text-red-400">{contactError}</p>}
                  <button type="submit" disabled={contactLoading} className="w-full bg-gradient-primary text-on-primary font-bold py-4 rounded-xl shadow-lg shadow-primary/20 hover:neon-glow transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    {contactLoading ? (
                      <>
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                        Sending...
                      </>
                    ) : "Send Message"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
