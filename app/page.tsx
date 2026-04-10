"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [contactOpen, setContactOpen]       = useState(false);
  const [contactSent, setContactSent]       = useState(false);
  const [contactError, setContactError]     = useState("");
  const [contactLoading, setContactLoading] = useState(false);
  const [contactForm, setContactForm]       = useState({ name: "", phone: "", email: "", location: "" });

  // ── Redirect logic preserved exactly ──
  useEffect(() => {
    if (status !== "authenticated") return;
    const role = (session?.user as { role?: string })?.role;
    if (role === "ADMIN")         router.replace("/admin");
    else if (role === "MERCHANT") router.replace("/merchant");
    else if (role === "USER")     router.replace("/dashboard");
  }, [status, session, router]);

  // ── Effects for Animations and UI logic from Stitch ──
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px"
    };

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active");
        }
      });
    }, observerOptions);

    document.querySelectorAll(".reveal").forEach(el => revealObserver.observe(el));

    const bentoObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.classList.add("active");
          }, index * 100);
        }
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
      const card = e.currentTarget as HTMLElement;
      card.style.transform = "";
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

      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-[-1]">
        <div className="orb w-[600px] h-[600px] bg-primary top-[-200px] left-[-150px]" style={{ animationDelay: "0s" }}></div>
        <div className="orb w-[500px] h-[500px] bg-tertiary bottom-[-100px] right-[-100px]" style={{ animationDelay: "-5s" }}></div>
        <div className="orb w-[400px] h-[400px] bg-secondary middle left-[40%] top-[30%] opacity-10" style={{ animationDelay: "-10s" }}></div>
        <div className="orb w-[350px] h-[350px] bg-primary/30 top-[20%] right-[15%]" style={{ animationDelay: "-15s" }}></div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-slate-950/40 backdrop-blur-xl border-b border-white/5">
        <div className="flex justify-between items-center px-4 md:px-8 py-4 max-w-7xl mx-auto">
          <div className="text-2xl font-bold tracking-tighter text-slate-50 dark:text-white flex items-center gap-2 group cursor-pointer">
            <span className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform">
              <span className="material-symbols-outlined text-on-primary text-xl">offline_bolt</span>
            </span>
            Tapfinity
          </div>
          <div className="hidden md:flex items-center gap-8">
            <Link className="text-slate-400 hover:text-primary transition-colors font-headline tracking-tight text-sm font-medium" href="/features">Features</Link>
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
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 md:px-8 pb-32 grid lg:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col items-start gap-8">
            <div className="reveal inline-flex items-center gap-3 bg-surface-container-low px-4 py-2 rounded-full border border-outline-variant/20">
              <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
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
              <button className="px-8 py-4 rounded-xl border border-outline-variant/30 text-on-surface font-medium hover:bg-white/5 transition-all hover:border-primary/50">
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
          {/* Animated Hero Graphic */}
          <div className="reveal relative flex items-center justify-center min-h-[400px]" style={{ transitionDelay: "0.4s" }}>
            <div className="absolute w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="nfc-pulse w-48 h-48 bg-surface-container-high rounded-[2rem] flex items-center justify-center border border-primary/30 rotate-12 hover:rotate-0 transition-transform duration-700">
              <span className="material-symbols-outlined text-7xl text-primary animate-bounce">contactless</span>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-tertiary/20 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-secondary/20 rounded-full blur-2xl"></div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="bg-surface-container-low py-32 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
            <h2 className="reveal font-label text-xs uppercase tracking-[0.4em] text-primary mb-16 text-center">Protocol Workflow</h2>
            <div className="grid md:grid-cols-3 gap-16 relative">
              {/* Step 1 */}
              <div className="reveal flex flex-col gap-6 group" style={{ transitionDelay: "0.1s" }}>
                <div className="w-16 h-16 rounded-2xl bg-surface-container-highest flex items-center justify-center text-primary border border-outline-variant/20 group-hover:border-primary group-hover:bg-primary/10 transition-all duration-500 transform group-hover:-rotate-6">
                  <span className="material-symbols-outlined text-3xl">point_of_sale</span>
                </div>
                <h3 className="text-2xl font-bold tracking-tight group-hover:text-primary transition-colors">01. Merchant Initiation</h3>
                <p className="text-on-surface-variant leading-relaxed">The merchant enters the transaction amount directly on any NFC-enabled mobile device acting as a terminal.</p>
              </div>
              {/* Step 2 */}
              <div className="reveal flex flex-col gap-6 group" style={{ transitionDelay: "0.2s" }}>
                <div className="w-16 h-16 rounded-2xl bg-surface-container-highest flex items-center justify-center text-tertiary border border-outline-variant/20 group-hover:border-tertiary group-hover:bg-tertiary/10 transition-all duration-500 transform group-hover:rotate-6">
                  <span className="material-symbols-outlined text-3xl">contactless</span>
                </div>
                <h3 className="text-2xl font-bold tracking-tight group-hover:text-tertiary transition-colors">02. Near-Field Exchange</h3>
                <p className="text-on-surface-variant leading-relaxed">The customer taps their authorized NFC card or student ID against the merchant's device to initiate secure handshake.</p>
              </div>
              {/* Step 3 */}
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

        {/* Features Bento Grid */}
        <section className="py-32 max-w-7xl mx-auto px-4 md:px-8">
          <h2 className="reveal text-4xl font-black mb-16 text-center">Engineered for Scale</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6" id="bento-grid">
            {/* Large Card */}
            <div className="stagger-item md:col-span-2 lg:col-span-2 glass-card rounded-[2rem] p-10 flex flex-col justify-between aspect-square md:aspect-auto group">
              <div>
                <span className="material-symbols-outlined text-4xl text-primary mb-6 transition-transform group-hover:scale-125 duration-500">security</span>
                <h3 className="text-3xl font-bold tracking-tight mb-4 group-hover:text-primary transition-colors">Secret Hashing</h3>
                <p className="text-on-surface-variant">Military-grade encryption ensures that every card tap is uniquely signed and cannot be replayed or spoofed by malicious actors.</p>
              </div>
              <div className="mt-8 bg-black/40 backdrop-blur-md border border-white/5 p-4 rounded-xl font-label text-xs text-primary/80 overflow-hidden text-ellipsis whitespace-nowrap">
                sha256:7f83b1657ff1...[encrypted_payload_secure_node]
              </div>
            </div>
            {/* Tall Card */}
            <div className="stagger-item lg:row-span-2 glass-card rounded-[2rem] p-10 flex flex-col group">
              <span className="material-symbols-outlined text-4xl text-tertiary mb-6 transition-transform group-hover:rotate-12 duration-500">analytics</span>
              <h3 className="text-3xl font-bold tracking-tight mb-4 group-hover:text-tertiary transition-colors">Live Analytics</h3>
              <p className="text-on-surface-variant flex-grow">Monitor campus-wide spending habits in real-time. Merchants see peak hours while admins manage resource allocation.</p>
              <div className="mt-8 relative overflow-hidden rounded-xl">
                <img className="rounded-xl grayscale opacity-30 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 transform group-hover:scale-110" alt="abstract digital data visualization" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDkguZ8nRSZuAkCmTvn0WHhxXi8DkTqE-2i2PqEFUZYnxHrko29cbyr3mck0suOK36a8NGUZ-cz52J2IJ-fGHTD6TpQPmtkOXX7XHEYPK4DFEa_D2OwhQa1KSx8NcRzdNTXvNi5liofKmGj786TPHYvuU9nchv6gdSykrhzmwG3nMtTTqQaVuiVZ1bHcy7tQcDXnZCZyPuT5XekEBw3dtliykwvYaZxCoMx5zpW4jZ2qiD8ztHGUYuf2On4otdcLUCvkMhXkl9mTA" />
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
            {/* Last Card */}
            <div className="stagger-item glass-card rounded-[2rem] p-10 group">
              <span className="material-symbols-outlined text-4xl text-white mb-6 transition-transform group-hover:rotate-180 duration-700">settings_suggest</span>
              <h3 className="text-xl font-bold tracking-tight mb-2">Admin Panel</h3>
              <p className="text-sm text-on-surface-variant">Full control over provisioning and security policies.</p>
            </div>
          </div>
        </section>

        {/* Roles Breakdown */}
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
                    <span className="material-symbols-outlined text-sm text-primary">add_task</span>
                    Provision new merchant IDs
                  </li>
                  <li className="flex items-center gap-3 text-sm text-on-surface-variant group-hover:text-on-surface transition-colors">
                    <span className="material-symbols-outlined text-sm text-primary">account_balance_wallet</span>
                    Direct balance top-ups
                  </li>
                  <li className="flex items-center gap-3 text-sm text-on-surface-variant group-hover:text-on-surface transition-colors">
                    <span className="material-symbols-outlined text-sm text-primary">block</span>
                    Instant security blocking
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
                    <span className="material-symbols-outlined text-sm text-tertiary">tap_and_play</span>
                    Accept NFC payments
                  </li>
                  <li className="flex items-center gap-3 text-sm text-on-surface-variant group-hover:text-on-surface transition-colors">
                    <span className="material-symbols-outlined text-sm text-tertiary">history</span>
                    View settlement history
                  </li>
                  <li className="flex items-center gap-3 text-sm text-on-surface-variant group-hover:text-on-surface transition-colors">
                    <span className="material-symbols-outlined text-sm text-tertiary">monitoring</span>
                    Daily revenue tracking
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
                    <span className="material-symbols-outlined text-sm text-secondary">payments</span>
                    Tap to pay anywhere
                  </li>
                  <li className="flex items-center gap-3 text-sm text-on-surface-variant group-hover:text-on-surface transition-colors">
                    <span className="material-symbols-outlined text-sm text-secondary">account_balance</span>
                    Real-time balance check
                  </li>
                  <li className="flex items-center gap-3 text-sm text-on-surface-variant group-hover:text-on-surface transition-colors">
                    <span className="material-symbols-outlined text-sm text-secondary">lock</span>
                    Block lost cards instantly
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 px-4 md:px-8">
          <div className="reveal max-w-5xl mx-auto glass-card rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden border border-outline-variant/10">
            <div className="orb w-[400px] h-[400px] bg-primary top-[-200px] left-[-200px] opacity-20"></div>
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
            <div className="text-xl font-black text-slate-200 flex items-center gap-2">
              <span className="w-6 h-6 bg-primary rounded-md flex items-center justify-center text-xs">T</span>
              Tapfinity
            </div>
            <div className="font-label text-xs uppercase tracking-widest text-slate-500">© 2024 Tapfinity. Obsidian Kinetic Design.</div>
          </div>
          <div className="flex flex-wrap justify-center gap-8">
            <a className="font-label text-xs uppercase tracking-widest text-slate-500 hover:text-primary transition-colors" href="#">Privacy Policy</a>
            <a className="font-label text-xs uppercase tracking-widest text-slate-500 hover:text-primary transition-colors" href="#">Terms of Service</a>
            <a className="font-label text-xs uppercase tracking-widest text-slate-500 hover:text-primary transition-colors" href="#">Twitter</a>
            <a className="font-label text-xs uppercase tracking-widest text-slate-500 hover:text-primary transition-colors" href="#">GitHub</a>
          </div>
        </div>
      </footer>

      {/* Contact Modal */}
      {contactOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/90 backdrop-blur-xl" onClick={closeContact}></div>
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
                <p className="text-sm text-on-surface-variant">We'll be in touch at {contactForm.email} shortly.</p>
              </div>
            ) : (
              <>
                <p className="text-on-surface-variant mb-8">Tell us about your campus and we'll get back to you within 24 hours.</p>
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
                      <input className="w-full bg-surface-container-highest border-0 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary transition-all text-on-surface" placeholder="+1 234 567 89" type="tel"
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
