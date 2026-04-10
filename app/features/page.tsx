"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function FeaturesPage() {
  useEffect(() => {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active");
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

    document.querySelectorAll(".reveal").forEach(el => revealObserver.observe(el));

    return () => revealObserver.disconnect();
  }, []);

  return (
    <div className="bg-background text-on-surface font-body selection:bg-primary/30 min-h-screen overflow-x-hidden">
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />

      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-[-1]">
        <div className="orb w-[600px] h-[600px] bg-primary top-[-200px] left-[-150px]" style={{ animationDelay: "0s" }}></div>
        <div className="orb w-[500px] h-[500px] bg-tertiary bottom-[-100px] right-[-100px]" style={{ animationDelay: "-5s" }}></div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-slate-950/40 backdrop-blur-xl border-b border-white/5">
        <div className="flex justify-between items-center px-4 md:px-8 py-4 max-w-7xl mx-auto">
          <Link href="/" className="text-2xl font-bold tracking-tighter text-slate-50 dark:text-white flex items-center gap-2 group cursor-pointer">
            <span className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform">
              <span className="material-symbols-outlined text-on-primary text-xl">offline_bolt</span>
            </span>
            <span className="hidden sm:inline">Tapfinity</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-slate-400 hover:text-primary transition-colors font-headline tracking-tight text-sm font-medium">
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative pt-32 pb-32">
        <section className="max-w-4xl mx-auto px-4 md:px-8 text-center mb-24">
          <h1 className="reveal text-5xl md:text-7xl font-black tracking-tighter leading-tight text-gradient mb-8">
            Frictionless Workflows
          </h1>
          <p className="reveal text-on-surface-variant text-xl leading-relaxed">
            Discover the high-level architecture that powers our atomic campus payment network. We prioritize speed, security, and absolute reliability.
          </p>
        </section>

        <section className="max-w-5xl mx-auto px-4 md:px-8">
          <div className="grid gap-12">
            {/* Workflow 1 */}
            <div className="reveal glass-card rounded-[2rem] p-10 flex flex-col md:flex-row gap-8 items-center">
              <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                <span className="material-symbols-outlined text-5xl text-primary">speed</span>
              </div>
              <div>
                <h3 className="text-3xl font-bold tracking-tight mb-4">Instantaneous Authorization</h3>
                <p className="text-on-surface-variant leading-relaxed text-lg">
                  When a card taps the terminal, our proprietary handshake protocol initiates. We use localized cryptography to authenticate the participant before a single byte of data hits the cloud, keeping latency well under standard thresholds.
                </p>
              </div>
            </div>

            {/* Workflow 2 */}
            <div className="reveal glass-card rounded-[2rem] p-10 flex flex-col md:flex-row gap-8 items-center md:flex-row-reverse">
              <div className="w-24 h-24 rounded-2xl bg-tertiary/10 flex items-center justify-center border border-tertiary/20 shrink-0">
                <span className="material-symbols-outlined text-5xl text-tertiary">schema</span>
              </div>
              <div className="text-left md:text-right">
                <h3 className="text-3xl font-bold tracking-tight mb-4">Atomic Settlement Engine</h3>
                <p className="text-on-surface-variant leading-relaxed text-lg">
                  No pending states. No double spends. Our ledger updates the merchant and user balances in a single indivisible operation. If an exchange fails midway, the entire state rolls back gracefully.
                </p>
              </div>
            </div>

            {/* Workflow 3 */}
            <div className="reveal glass-card rounded-[2rem] p-10 flex flex-col md:flex-row gap-8 items-center">
              <div className="w-24 h-24 rounded-2xl bg-secondary/10 flex items-center justify-center border border-secondary/20 shrink-0">
                <span className="material-symbols-outlined text-5xl text-secondary">security</span>
              </div>
              <div>
                <h3 className="text-3xl font-bold tracking-tight mb-4">Zero-Knowledge Verification</h3>
                <p className="text-on-surface-variant leading-relaxed text-lg">
                  Every interaction is shielded. The terminal verifies the validity of the funds without exposing the underlying account mechanics. We only orchestrate what is strictly necessary to clear the transaction securely.
                </p>
              </div>
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
    </div>
  );
}
