<p align="center">
  <img src="public/tapfinity-logo.png" alt="Tapfinity Logo" width="180" />
</p>

<h1 align="center">Tapfinity</h1>

<p align="center">
  <strong>NFC-Powered Campus Payment Platform</strong>
</p>

<p align="center">
  <a href="https://tapfinityapp.vercel.app">Live Demo</a> •
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#architecture">Architecture</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-Supabase-3ECF8E?logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Deployed-Vercel-000?logo=vercel" alt="Vercel" />
</p>

---

## 📋 Overview

**Tapfinity** is a closed-loop, NFC-based digital payment system designed for college campuses. It replaces cash and UPI at campus facilities — canteens, bookshops, hostel messes, events — with a single physical NFC card per student.

**One tap. Under one second. No phone needed on the student side.**

The system operates as a closed loop — money only moves within the Tapfinity ecosystem. An admin loads money into student wallets, students spend at campus merchants, and the institution retains full audit control.

### The Problem

| Pain Point | Impact |
|---|---|
| Cash at campus canteens | Queues, change errors, hygiene concerns |
| UPI payments | Requires both parties to have phones, slow at peak hours |
| No unified system | Disconnected vendors, no oversight |
| No audit trail | Administration has zero visibility |

### The Solution

Each student gets **one NFC card** containing a cryptographic secret. Payment is a single physical tap — the merchant enters the amount, the student taps their card, and the transaction confirms in under a second with the student's name displayed on screen.

---

## ✨ Features

### 🔑 Three Role-Based Portals

<details>
<summary><strong>👨‍💼 Admin Portal</strong> — Full platform control</summary>

- Real-time KPI dashboard (auto-refreshes every 30s)
- Create & manage student and merchant accounts
- Provision NFC cards via physical tap
- Top up student wallets (PIN-protected)
- Block / unblock accounts
- Full payment attempt audit logs with expandable rows
- Export reports as **CSV** or **styled PDF** with date & merchant filters
- 6-digit PIN as second authentication factor for sensitive actions

</details>

<details>
<summary><strong>🏪 Merchant Portal</strong> — Accept payments via NFC</summary>

- Zero-install — works in Android Chrome browser
- Enter amount → Tap Charge → Student taps card → Done
- Animated NFC waiting screen with sonar pulse rings
- Revenue stats: today, this week, this month, all-time
- Full transaction history with status badges

</details>

<details>
<summary><strong>👤 Student Dashboard</strong> — Monitor & control spending</summary>

- Real-time balance display
- Transaction history with debit/credit filters
- Self-service card blocking if lost
- Configurable daily spending limit with progress bar
- 30-day spending summary

</details>

### 🔐 Security

- **SHA-256 + server-side salt** for card secret hashing
- **bcrypt** for passwords and admin PIN
- **Atomic database transactions** preventing double-spend
- **Rate limiting** — 5 attempts / 5 seconds / IP on payment endpoints
- **Origin header CSRF** protection on sensitive endpoints
- **Role-based middleware** on every route
- **httpOnly JWT cookies** with 24-hour expiry
- **Security headers** — HSTS, X-Frame-Options, CSP, and more
- **9 penetration test findings** identified and fixed (TAP-001 through TAP-009)

### 📡 NFC Payments

- **Web NFC API** — W3C browser standard (Android Chrome)
- **NXP NTAG213** cards — ISO 14443-3A, NFC Forum Type 2
- **MIME-type NDEF records** — eliminates JSON parse corruption from text record prefixes
- **600ms flush delay** — ensures physical memory commit before confirmation
- **Dual record support** — handles both legacy text and current MIME formats

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Frontend** | React 19, TypeScript 5, Tailwind CSS 4 |
| **Backend** | Next.js API Routes (serverless) |
| **Database** | PostgreSQL on Supabase (PgBouncer connection pooling) |
| **ORM** | Prisma 6 |
| **Auth** | NextAuth.js (JWT strategy, 3 credential providers) |
| **NFC** | Web NFC API (W3C standard) |
| **Payments** | Razorpay (webhook-based top-up) |
| **Caching** | Upstash Redis (optional) |
| **Deployment** | Vercel (serverless, auto-scaling) |
| **CI/CD** | GitHub Actions + Dependabot |
| **Typography** | Inter + Space Grotesk (Google Fonts) |

---

## 📐 Architecture

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                         │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Admin   │  │   Merchant   │  │   Student    │  │
│  │  Portal  │  │   Portal     │  │  Dashboard   │  │
│  └────┬─────┘  └──────┬───────┘  └──────┬───────┘  │
│       │               │                 │           │
│       └───────────┬────┴─────────────────┘           │
│                   │                                  │
│          Next.js App Router                          │
│          + Role-Based Middleware                     │
└───────────────────┬─────────────────────────────────┘
                    │
┌───────────────────┴─────────────────────────────────┐
│                  API LAYER                           │
│  ┌────────────┐ ┌──────────┐ ┌───────────────────┐  │
│  │ Auth APIs  │ │ NFC APIs │ │  Admin/Merchant   │  │
│  │ (NextAuth) │ │(authorize│ │   CRUD APIs       │  │
│  │            │ │ provision│ │                    │  │
│  └────────────┘ └──────────┘ └───────────────────┘  │
│                                                      │
│  Rate Limiting · CSRF Protection · JWT Validation    │
└───────────────────┬─────────────────────────────────┘
                    │
┌───────────────────┴─────────────────────────────────┐
│               DATA LAYER                             │
│  ┌─────────┐  ┌────────────┐  ┌──────────────────┐  │
│  │ Prisma  │  │ PostgreSQL │  │  Upstash Redis   │  │
│  │  ORM    │──│ (Supabase) │  │   (optional)     │  │
│  └─────────┘  └────────────┘  └──────────────────┘  │
│                                                      │
│  13 Models · Atomic Transactions · Audit Logging     │
└─────────────────────────────────────────────────────┘
```

### Payment Flow

```
Merchant                    Server                     Database
   │                          │                           │
   │ 1. POST /payment-request │                           │
   │────────────────────────►│ Create PaymentRequest      │
   │   ◄─── requestId ──────│ (PENDING, 2min expiry)     │
   │                          │                           │
   │ 2. NFC scan() starts     │                           │
   │    Student taps card     │                           │
   │    Extract card secret   │                           │
   │                          │                           │
   │ 3. POST /nfc/authorize   │                           │
   │    { requestId, secret } │                           │
   │────────────────────────►│ ┌─── $transaction() ────┐  │
   │                          │ │ Verify PaymentRequest │  │
   │                          │ │ Hash secret → lookup  │  │
   │                          │ │ Check balance & limit │  │
   │                          │ │ Mark request USED     │  │
   │                          │ │ Decrement balance     │  │
   │                          │ │ Create Transaction    │  │
   │                          │ │ Log SUCCESS           │  │
   │                          │ └───────────────────────┘  │
   │   ◄─── { ok, name } ───│                            │
   │                          │                           │
   │ 4. Show success screen   │                           │
   │    (student name + ₹)    │                           │
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+
- **npm** or **yarn**
- **PostgreSQL** database (or a [Supabase](https://supabase.com) account)
- **Android phone with Chrome** (for NFC testing)
- **NXP NTAG213 NFC cards** (for card provisioning)

### 1. Clone the repository

```bash
git clone https://github.com/preetz-6/Tapfinity-.git
cd Tapfinity-
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
# ─── Database ───
DATABASE_URL="postgresql://user:password@host:port/database?pgbouncer=true"

# ─── Auth ───
NEXTAUTH_SECRET="your-random-secret-min-32-chars"
NEXTAUTH_URL="http://localhost:3000"

# ─── NFC Payments ───
CARD_SECRET_SALT="your-random-salt-string"

# ─── Razorpay (Optional — for student self-top-up) ───
RAZORPAY_KEY_ID=""
RAZORPAY_KEY_SECRET=""
RAZORPAY_WEBHOOK_SECRET=""

# ─── Redis (Optional — for distributed rate limiting) ───
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""
```

> ⚠️ **Important:** Never change `CARD_SECRET_SALT` after provisioning cards in production. All previously provisioned cards will become invalid.

### 4. Set up the database

```bash
npx prisma generate
npx prisma db push
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
Tapfinity-/
├── app/
│   ├── admin/              # Admin portal (dashboard, users, merchants, logs, export)
│   │   ├── AdminShell.tsx   # Admin sidebar/navigation shell
│   │   ├── users/           # User management pages
│   │   ├── merchants/       # Merchant management pages
│   │   ├── payment-logs/    # Payment attempt audit logs
│   │   ├── export/          # CSV & PDF export
│   │   ├── settings/        # Admin PIN management
│   │   └── staff/           # Staff management
│   ├── merchant/            # Merchant portal
│   │   ├── MerchantShell.tsx
│   │   ├── receive/         # NFC payment receiver
│   │   └── transactions/    # Merchant transaction history
│   ├── dashboard/           # Student dashboard
│   │   ├── UserShell.tsx
│   │   ├── card/            # Card management
│   │   ├── history/         # Transaction history
│   │   └── topup/           # Wallet top-up
│   ├── api/                 # Serverless API routes
│   │   ├── admin/           # Admin APIs (users, merchants, cards, export, PIN)
│   │   ├── merchant/        # Merchant APIs (payment-request, stats)
│   │   ├── nfc/             # NFC authorize endpoint
│   │   ├── user/            # User APIs (profile, settings)
│   │   ├── webhooks/        # Razorpay webhook handler
│   │   └── contact/         # Contact form submission
│   ├── components/          # Shared components (PinModal, Toast, ErrorBoundary)
│   ├── login/               # Login page
│   └── page.tsx             # Landing page (Obsidian Kinetic design)
├── lib/                     # Shared utilities (auth, prisma, validation)
├── prisma/
│   └── schema.prisma        # Database schema (13 models)
├── middleware.ts             # Role-based route protection
├── instrumentation.ts       # Env variable validation at startup
├── public/                  # Static assets (logo, images)
├── types/                   # TypeScript type definitions
└── .github/
    ├── workflows/           # CI pipeline
    └── dependabot.yml       # Automated dependency updates
```

---

## 🗄 Database Schema

The database contains **13 models** managed by Prisma:

| Model | Purpose |
|---|---|
| `User` | Students — balance, card hash, spending limits, status |
| `Merchant` | Campus vendors — credentials, status |
| `Admin` | Platform administrators |
| `PaymentRequest` | Ephemeral per-transaction record (2-min expiry, single-use) |
| `Transaction` | Immutable record of successful money movement |
| `MerchantTransaction` | Links transactions to merchants |
| `PaymentAttemptLog` | Full audit trail (success + failure) |
| `AdminPin` | bcrypt-hashed 6-digit PIN with lockout mechanism |
| `AdminActionLog` | Audit log for every admin action |
| `ProvisionCardRequest` | 60-second NFC card write session |
| `ContactSubmission` | Homepage contact form entries |
| `PendingTopUp` | Razorpay order tracking for wallet top-ups |

---

## 🔌 API Reference

<details>
<summary><strong>Public Endpoints</strong></summary>

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/contact` | Submit contact form (rate limited: 5/min) |

</details>

<details>
<summary><strong>Authentication</strong></summary>

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/callback/admin-credentials` | Admin login |
| `POST` | `/api/auth/callback/merchant-credentials` | Merchant login |
| `POST` | `/api/auth/callback/user-credentials` | Student login |
| `POST` | `/api/auth/signout` | Sign out |

</details>

<details>
<summary><strong>NFC Payment</strong></summary>

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/merchant/payment-request` | Merchant | Create payment request |
| `POST` | `/api/nfc/authorize` | Card secret | Process NFC payment |
| `DELETE` | `/api/merchant/payment-request/[id]` | Merchant | Cancel pending request |

</details>

<details>
<summary><strong>Admin APIs</strong></summary>

| Method | Endpoint | Description |
|---|---|---|
| `GET/POST/PATCH` | `/api/admin/users` | CRUD user accounts |
| `GET/POST` | `/api/admin/merchants` | CRUD merchant accounts |
| `GET` | `/api/admin/merchants/[id]/transactions` | Merchant transaction history |
| `POST` | `/api/admin/provision-card` | Create provisioning session (requires PIN) |
| `POST/GET` | `/api/admin/provision-card/confirm` | Confirm / poll provisioning |
| `GET` | `/api/admin/dashboard` | KPI dashboard data |
| `GET` | `/api/admin/payment-logs` | Paginated audit logs |
| `GET` | `/api/admin/export` | CSV export (max 31 days) |
| `GET` | `/api/admin/export/pdf` | Styled PDF audit report |
| `POST` | `/api/admin/pin` | Set / rotate admin PIN |
| `POST` | `/api/admin/deactivate-user` | Deactivate user (requires PIN) |

</details>

<details>
<summary><strong>Merchant & User APIs</strong></summary>

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/merchant/stats` | Merchant | Revenue stats |
| `GET` | `/api/merchant/transactions` | Merchant | Transaction history |
| `GET` | `/api/user/me` | User | Profile & balance |
| `GET/POST` | `/api/user/settings` | User | Daily spending limit |
| `GET` | `/api/dashboard/transactions` | User | Transaction history |

</details>

---

## 🌐 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the repository in [Vercel](https://vercel.com)
3. Add all environment variables in the Vercel dashboard
4. Deploy — each push to `master` triggers automatic deployment

### Database

1. Create a PostgreSQL database on [Supabase](https://supabase.com)
2. Enable **PgBouncer** connection pooling (required for serverless)
3. Copy the connection string to `DATABASE_URL`
4. Run `npx prisma db push` to create tables

---

## ⚠️ Known Limitations

- **Web NFC** works on **Android Chrome only** — iOS requires a native app
- Student self-top-up UI is not yet wired (Razorpay backend is ready)
- Export is capped at 31 days per request
- Daily spending limit resets at server midnight, not student's local timezone
- No SMS/email receipts after payment
- **RBI PPI licence** required for commercial deployment in India

---

## 🗺 Roadmap

- [ ] Wire Razorpay self-top-up on student dashboard
- [ ] Email notifications via Resend (contact form, low balance alerts)
- [ ] React Native merchant app for iOS NFC support
- [ ] Transaction receipt emails/SMS
- [ ] Lost card replacement flow
- [ ] Multi-tenancy support (multiple campuses)
- [ ] Real-time WebSocket payment notifications
- [ ] Admin-configurable price lists per merchant
- [ ] Redis-based distributed rate limiting

---

## 🧑‍💻 Development

```bash
# Start dev server
npm run dev

# Generate Prisma client after schema changes
npx prisma generate

# Push schema changes to database
npx prisma db push

# Run linter
npm run lint

# Production build
npm run build
```

---

## 📄 License

This project is proprietary. All rights reserved.

---

<p align="center">
  Built with ❤️ for campus communities
</p>
