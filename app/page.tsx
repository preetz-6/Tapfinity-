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

  const closeContact = () => {
    setContactOpen(false);
    setContactSent(false);
    setContactForm({ name: "", phone: "", email: "", location: "" });
  };

  // ── Contact submit logic preserved exactly ──
  async function handleContactSubmit() {
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

  const S = {
    base:   "#0B0E13",
    surf:   "#101418",
    low:    "#191C20",
    high:   "#272A2F",
    highest:"#32353A",
    text:   "#E0E2E8",
    muted:  "#8B90A0",
    dim:    "#414754",
    primary:"#AEC6FF",
    blue:   "#0070F3",
    teal:   "#00DAF3",
    purple: "#D0BCFF",
  } as const;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Space+Grotesk:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        .tapf-btn-primary {
          background: linear-gradient(135deg, #AEC6FF 0%, #0070F3 100%);
          transition: opacity .18s, transform .12s;
          cursor: pointer; border: none;
        }
        .tapf-btn-primary:hover  { opacity: .86; }
        .tapf-btn-primary:active { transform: scale(.97); }
        .tapf-btn-ghost {
          background: transparent;
          border: 1px solid rgba(0,218,243,.3);
          color: #00DAF3;
          cursor: pointer;
          transition: background .18s;
        }
        .tapf-btn-ghost:hover { background: rgba(0,218,243,.06); }
        @keyframes tapf-float {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-10px); }
        }
        @keyframes tapf-ping {
          0%   { transform: scale(.95); opacity: .4; }
          70%  { transform: scale(1.15); opacity: 0; }
          100% { transform: scale(1.15); opacity: 0; }
        }
        .tapf-float { animation: tapf-float 6s ease-in-out infinite; }
        .tapf-ping  { animation: tapf-ping  2.5s ease-out infinite; }
        .tapf-ping-d1 { animation: tapf-ping 2.5s ease-out infinite .4s; }
        .tapf-ping-d2 { animation: tapf-ping 2.5s ease-out infinite .8s; }
        .tapf-glow { filter: blur(120px); pointer-events: none; position: absolute; border-radius: 50%; }
        .tapf-gradient-text {
          background: linear-gradient(135deg, #AEC6FF 0%, #0070F3 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        input:focus { outline: none; border-color: #AEC6FF !important; box-shadow: 0 0 0 3px rgba(174,198,255,.12); }
        @media (max-width: 768px) {
          .tapf-hero-grid { grid-template-columns: 1fr !important; }
          .tapf-nfc-visual { display: none !important; }
          .tapf-stats { gap: 20px !important; }
          .tapf-nav { padding: 12px 20px !important; }
          .tapf-section { padding: 60px 20px !important; }
        }
      `}</style>

      <main style={{ background: S.base, color: S.text, fontFamily: "'Inter', sans-serif", overflowX: "hidden", minHeight: "100vh" }}>

        {/* ─── CONTACT MODAL ─── */}
        {contactOpen && (
          <div onClick={e => { if (e.target === e.currentTarget) closeContact(); }}
            style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,.75)", backdropFilter: "blur(8px)", padding: "0 16px" }}>
            <div style={{ width: "100%", maxWidth: 440, borderRadius: 20, overflow: "hidden", background: "rgba(25,28,32,.95)", backdropFilter: "blur(20px)", border: "1px solid rgba(65,71,84,.2)", boxShadow: "0 0 80px rgba(174,198,255,.05)" }}>
              <div style={{ padding: "22px 24px 16px", borderBottom: "1px solid rgba(65,71,84,.15)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 16 }}>Contact Us</p>
                  <p style={{ fontSize: 12, color: S.muted, marginTop: 2 }}>We&apos;ll reach out to set up Tapfinity for your campus</p>
                </div>
                <button onClick={closeContact} style={{ color: S.dim, fontSize: 22, lineHeight: 1, cursor: "pointer", background: "none", border: "none", padding: "2px 6px" }}>×</button>
              </div>

              {contactSent ? (
                <div style={{ padding: "48px 24px", textAlign: "center" }}>
                  <div style={{ width: 54, height: 54, borderRadius: "50%", background: "rgba(0,218,243,.08)", border: "1px solid rgba(0,218,243,.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={S.teal} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <p style={{ fontWeight: 700 }}>Thanks, {contactForm.name.split(" ")[0]}!</p>
                  <p style={{ fontSize: 13, color: S.muted, marginTop: 4 }}>We&apos;ll be in touch at {contactForm.email}</p>
                </div>
              ) : (
                <div style={{ padding: "20px 24px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
                  {[
                    { key: "name",     label: "Full Name",      placeholder: "Your name",          type: "text"  },
                    { key: "phone",    label: "Phone Number",   placeholder: "+91 98765 43210",     type: "tel"   },
                    { key: "email",    label: "Email",          placeholder: "you@college.edu",     type: "email" },
                    { key: "location", label: "College / City", placeholder: "e.g. NITK Surathkal", type: "text"  },
                  ].map(({ key, label, placeholder, type }) => (
                    <div key={key}>
                      <p style={{ fontSize: 11, color: S.muted, marginBottom: 6, fontFamily: "'Space Grotesk',sans-serif", letterSpacing: "0.07em", textTransform: "uppercase" }}>{label}</p>
                      <input
                        type={type}
                        placeholder={placeholder}
                        value={contactForm[key as keyof typeof contactForm]}
                        onChange={e => setContactForm(f => ({ ...f, [key]: e.target.value }))}
                        style={{ width: "100%", padding: "10px 14px", borderRadius: 10, background: S.high, border: "1px solid rgba(65,71,84,.35)", color: S.text, fontSize: 14, transition: "border-color .15s, box-shadow .15s" }}
                      />
                    </div>
                  ))}
                  {contactError && <p style={{ fontSize: 12, color: "#FFB4AB" }}>{contactError}</p>}
                  <button onClick={handleContactSubmit} disabled={contactLoading} className="tapf-btn-primary"
                    style={{ padding: "12px", borderRadius: 12, color: "#002E6B", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: contactLoading ? .6 : 1 }}>
                    {contactLoading
                      ? <><svg className="tapf-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 1s linear infinite" }}><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity=".25"/><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" opacity=".75"/></svg>Sending…</>
                      : "Send Message"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── NAVBAR ─── */}
        <header className="tapf-nav" style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 40px", background: "rgba(11,14,19,.88)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid rgba(65,71,84,.12)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg,#AEC6FF,#0070F3)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 24px rgba(174,198,255,.25)" }}>
              <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
                <rect x="2" y="7" width="28" height="18" rx="3" stroke="white" strokeWidth="2"/>
                <path d="M21 16a5 5 0 0 1-10 0" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: "-0.02em" }}>Tap<span style={{ color: S.primary }}>finity</span></span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Link href="/login" style={{ fontSize: 13, color: S.muted, padding: "8px 16px", textDecoration: "none" }}>Sign In</Link>
            <button onClick={() => setContactOpen(true)} className="tapf-btn-primary"
              style={{ padding: "8px 20px", borderRadius: 12, color: "#002E6B", fontWeight: 700, fontSize: 13 }}>
              Contact Us
            </button>
          </div>
        </header>

        {/* ─── HERO ─── */}
        <section className="tapf-section" style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", padding: "100px 40px 60px", overflow: "hidden" }}>
          <div className="tapf-glow" style={{ width: 600, height: 600, background: "rgba(0,112,243,.1)", top: -150, left: -150 }} />
          <div className="tapf-glow" style={{ width: 400, height: 400, background: "rgba(0,218,243,.06)", bottom: -100, right: -100 }} />

          <div className="tapf-hero-grid" style={{ maxWidth: 1100, margin: "0 auto", width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 14px", borderRadius: 99, background: "rgba(0,218,243,.07)", border: "1px solid rgba(0,218,243,.18)", marginBottom: 28 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: S.teal, display: "inline-block" }} />
                <span style={{ fontSize: 11, color: S.teal, fontFamily: "'Space Grotesk',sans-serif", letterSpacing: "0.1em", textTransform: "uppercase" }}>Live across campuses</span>
              </div>

              <h1 style={{ fontSize: "clamp(38px,5.5vw,66px)", fontWeight: 900, lineHeight: 1.04, letterSpacing: "-0.03em", marginBottom: 20 }}>
                The Future of<br />
                <span className="tapf-gradient-text">Campus Payments</span>
              </h1>
              <p style={{ fontSize: 16, color: S.muted, lineHeight: 1.7, maxWidth: 440, marginBottom: 36 }}>
                Atomic NFC transactions on a sovereign ledger. Fast, secure, and entirely cashless infrastructure for modern educational ecosystems.
              </p>

              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <Link href="/login" style={{ textDecoration: "none" }}>
                  <button className="tapf-btn-primary" style={{ padding: "13px 26px", borderRadius: 14, color: "#002E6B", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
                    Sign In to Dashboard
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </button>
                </Link>
                <a href="#how-it-works" style={{ fontSize: 14, color: S.muted, textDecoration: "none", padding: "13px 18px" }}>See how it works</a>
              </div>

              <div className="tapf-stats" style={{ display: "flex", gap: 36, marginTop: 52 }}>
                {[
                  { val: "< 50ms", label: "Latency" },
                  { val: "0 Cash", label: "In Circulation" },
                  { val: "100%",   label: "Atomic Success" },
                ].map(s => (
                  <div key={s.label}>
                    <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 22, color: S.primary, letterSpacing: "-0.02em" }}>{s.val}</p>
                    <p style={{ fontSize: 11, color: S.dim, fontFamily: "'Space Grotesk',sans-serif", letterSpacing: "0.09em", textTransform: "uppercase", marginTop: 3 }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="tapf-nfc-visual tapf-float" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ position: "relative", width: 280, height: 280 }}>
                <div className="tapf-ping"    style={{ position: "absolute", inset: 0,   borderRadius: "50%", border: "1px solid rgba(0,218,243,.12)" }} />
                <div className="tapf-ping-d1" style={{ position: "absolute", inset: 22,  borderRadius: "50%", border: "1px solid rgba(174,198,255,.08)" }} />
                <div className="tapf-ping-d2" style={{ position: "absolute", inset: 44,  borderRadius: "50%", border: "1px solid rgba(0,112,243,.07)" }} />
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 116, height: 116, borderRadius: 28, background: "linear-gradient(135deg,#191C20,#272A2F)", border: "1px solid rgba(174,198,255,.1)", boxShadow: "0 0 60px rgba(0,112,243,.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke={S.primary} strokeWidth="1.4" opacity=".85">
                    <rect x="2" y="5" width="20" height="14" rx="2"/>
                    <path d="M16 12a4 4 0 0 1-8 0"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── HOW IT WORKS ─── */}
        <section id="how-it-works" className="tapf-section" style={{ padding: "80px 40px", maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 11, color: S.muted, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12 }}>Protocol Workflow</p>
            <h2 style={{ fontSize: "clamp(26px,4vw,42px)", fontWeight: 900, letterSpacing: "-0.02em" }}>Three steps to payment</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}>
            {[
              { step: "01", title: "Merchant Initiation",  desc: "Merchant enters the amount and taps Charge. A payment request is created server-side with a 2-minute expiry." },
              { step: "02", title: "Near-Field Exchange",  desc: "Student holds their NFC card to the merchant's phone. The secret is read in under 100ms — phone vibrates." },
              { step: "03", title: "Atomic Confirmation",  desc: "Server verifies, debits atomically, and both parties see instant confirmation. Zero partial states possible." },
            ].map(s => (
              <div key={s.step} style={{ background: S.low, borderRadius: 18, padding: 28, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, right: 0, width: 90, height: 90, background: "radial-gradient(circle,rgba(174,198,255,.04) 0%,transparent 70%)" }} />
                <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 11, color: S.dim, letterSpacing: "0.12em", marginBottom: 16 }}>{s.step}</p>
                <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 10, letterSpacing: "-0.01em" }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: S.muted, lineHeight: 1.65 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── FEATURES ─── */}
        <section className="tapf-section" style={{ padding: "80px 40px", maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 11, color: S.muted, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12 }}>Engineered for Scale</p>
            <h2 style={{ fontSize: "clamp(26px,4vw,42px)", fontWeight: 900, letterSpacing: "-0.02em" }}>Everything you need</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(290px,1fr))", gap: 14 }}>
            {[
              { tag: "SHA", title: "Secret Hashing",       desc: "A random UUID is written to each card. Only its SHA-256+salt hash is stored — card cloning is useless.", color: S.primary },
              { tag: "ATM", title: "Atomic Transactions",  desc: "Balance deduction, transaction record, and merchant link happen atomically via prisma.$transaction().", color: S.teal   },
              { tag: "RLT", title: "Rate Limiting",        desc: "IP-based rate limiting on the NFC authorize endpoint — 5 attempts per 5 seconds. Brute force blocked.", color: S.purple  },
              { tag: "ADM", title: "Admin Control Panel",  desc: "Create accounts, assign NFC cards, block/unblock users, top-up wallets, and export full audit logs.", color: S.primary },
              { tag: "CHT", title: "Live Analytics",       desc: "Real-time transaction charts, spending trends, and merchant performance in the admin dashboard.", color: S.teal   },
              { tag: "CSV", title: "Audit Export",         desc: "Download filtered CSV and PDF reports by date range, merchant, user, or status. Full compliance trail.", color: S.purple  },
            ].map(f => (
              <div key={f.title} style={{ background: S.low, borderRadius: 18, padding: 24 }}>
                <div style={{ display: "inline-flex", padding: "3px 10px", borderRadius: 7, background: `${f.color}12`, marginBottom: 14 }}>
                  <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 11, fontWeight: 700, color: f.color, letterSpacing: "0.08em" }}>{f.tag}</span>
                </div>
                <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 7, letterSpacing: "-0.01em" }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: S.muted, lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── ROLES ─── */}
        <section className="tapf-section" style={{ padding: "80px 40px", maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 11, color: S.muted, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12 }}>Ecosystem Roles</p>
            <h2 style={{ fontSize: "clamp(26px,4vw,42px)", fontWeight: 900, letterSpacing: "-0.02em" }}>Three roles, one platform</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 14 }}>
            {[
              { label: "The Controller", role: "Administrator", color: S.primary, bg: "rgba(174,198,255,.05)", perms: ["Provision new merchant IDs", "Direct balance top-ups", "Instant security blocking", "Export audit logs"] },
              { label: "The Node",       role: "Merchant",      color: S.teal,    bg: "rgba(0,218,243,.05)",   perms: ["Accept NFC payments", "View settlement history", "Daily revenue tracking", "Real-time payment status"] },
              { label: "The Participant",role: "End User",      color: S.purple,  bg: "rgba(208,188,255,.05)", perms: ["Tap to pay anywhere", "Real-time balance check", "Block lost cards instantly", "View spending history"] },
            ].map(r => (
              <div key={r.role} style={{ background: r.bg, borderRadius: 18, padding: 28, border: "1px solid rgba(65,71,84,.1)" }}>
                <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 10, color: r.color, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>{r.label}</p>
                <h3 style={{ fontWeight: 800, fontSize: 22, letterSpacing: "-0.02em", marginBottom: 20 }}>{r.role}</h3>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                  {r.perms.map(p => (
                    <li key={p} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#C1C6D7" }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: r.color, flexShrink: 0, opacity: .6 }} />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* ─── CTA ─── */}
        <section className="tapf-section" style={{ padding: "80px 40px", maxWidth: 820, margin: "0 auto", textAlign: "center" }}>
          <div style={{ borderRadius: 24, padding: "64px 40px", overflow: "hidden", background: S.low, position: "relative" }}>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 0%,rgba(0,112,243,.12),transparent 65%)", pointerEvents: "none" }} />
            <div style={{ position: "relative" }}>
              <h2 style={{ fontSize: "clamp(30px,5vw,52px)", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 16 }}>Ready to go cashless?</h2>
              <p style={{ fontSize: 16, color: S.muted, maxWidth: 420, margin: "0 auto 36px", lineHeight: 1.6 }}>
                Join campuses transforming physical currency into high-velocity digital assets.
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <button onClick={() => setContactOpen(true)} className="tapf-btn-primary" style={{ padding: "13px 32px", borderRadius: 14, color: "#002E6B", fontWeight: 700, fontSize: 14 }}>
                  Get Started Today
                </button>
                <button onClick={() => setContactOpen(true)} className="tapf-btn-ghost" style={{ padding: "13px 32px", borderRadius: 14, fontWeight: 600, fontSize: 14 }}>
                  Contact Sales
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ─── FOOTER ─── */}
        <footer style={{ borderTop: "1px solid rgba(65,71,84,.12)", padding: "24px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: 7, background: "linear-gradient(135deg,#AEC6FF,#0070F3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="12" height="12" viewBox="0 0 32 32" fill="none"><rect x="2" y="7" width="28" height="18" rx="3" stroke="white" strokeWidth="2.5"/><path d="M21 16a5 5 0 0 1-10 0" stroke="white" strokeWidth="2.5" strokeLinecap="round"/></svg>
            </div>
            <span style={{ fontWeight: 700, fontSize: 14 }}>Tap<span style={{ color: S.primary }}>finity</span></span>
          </div>
          <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 12, color: S.dim }}>© {new Date().getFullYear()} Tapfinity · Obsidian Kinetic Design</p>
          <button onClick={() => setContactOpen(true)} style={{ fontSize: 12, color: S.muted, background: "none", border: "none", cursor: "pointer" }}>Contact us →</button>
        </footer>

      </main>
    </>
  );
}
