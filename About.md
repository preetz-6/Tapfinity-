# Tapfinity — Complete Knowledge Base
## For RAG Pipeline & Chatbot

---

## 1. PROJECT OVERVIEW

Tapfinity is a closed-loop NFC-based digital payment platform built for college campuses. It replaces cash and UPI at campus facilities — canteens, bookshops, hostel messes, events — with a single physical NFC card per student. The student taps their card at a merchant's phone and payment completes in under one second.

**Closed-loop** means money only moves within the Tapfinity system. It is not connected to any bank or external payment rail. An admin loads money into student wallets. Students spend at campus merchants. Nothing leaves the system unless an admin exports a report.

**Repository:** github.com/preetz-6/Tapfinity-

**Deployment:** Vercel (production), Supabase PostgreSQL (database)

**Live URL:** tapfinityapp.vercel.app

---

## 2. CORE CONCEPT

### The problem Tapfinity solves
- Cash handling at campus canteens creates queues, change errors, and hygiene concerns
- UPI requires both parties to have phones, enter amounts, and wait for bank confirmation — slow at peak hours
- No unified system across different campus vendors
- No audit trail for campus administration
- Lost cash or UPI fraud has no recourse

### The solution
Each student gets one NFC card. The card holds a cryptographic secret UUID. Payment is one physical tap — under a second from tap to confirmation. The merchant sees the student's name and the transaction confirms. No phone needed on the student side.

---

## 3. THE THREE ROLES

### Admin
- Full control of the entire platform
- Creates and manages student accounts
- Creates and manages merchant accounts
- Provisions NFC cards by physically tapping them with a phone
- Tops up student wallets
- Blocks and unblocks accounts
- Views full payment attempt logs
- Exports transaction reports as CSV or PDF
- Manages a 6-digit PIN as a second authentication factor for sensitive actions
- Dashboard auto-refreshes every 30 seconds
- Access path: /admin

### Merchant
- Campus vendors — canteen, bookshop, hostel mess, stationery store
- Logs in on an Android phone using Chrome
- Opens /merchant/receive, enters amount, taps Charge
- Holds phone near student's NFC card
- Payment completes — sees student's name on success screen
- Views their own revenue stats and transaction history
- No app installation required — browser only
- Android Chrome only (iOS not supported due to Web NFC API limitation)
- Access path: /merchant

### User (Student)
- Carries one physical NFC card
- No phone required to make payments
- Can log into dashboard to check balance
- Can view transaction history
- Can block their own card if lost
- Can set a daily spending limit
- Access path: /dashboard

---

## 4. COMPLETE TECH STACK

### Frontend
- **Next.js 14** with App Router
- **React 19** with hooks (useState, useEffect, useCallback, useRef)
- **TypeScript** — entire codebase is typed
- **Tailwind CSS** — utility-first styling
- **Google Fonts** — Inter (headlines) and Space Grotesk (numbers, data, labels)

### Backend
- **Next.js API Routes** — serverless functions, no separate backend server
- **Node.js** runtime
- **Prisma ORM** — type-safe database access, handles migrations

### Database
- **PostgreSQL** hosted on **Supabase**
- Connection pooling via PgBouncer (essential for serverless)
- 13 database models

### Authentication
- **NextAuth.js** with JWT strategy
- Three separate credential providers (Admin, Merchant, User)
- bcrypt password hashing
- JWT tokens with 24-hour expiry stored as httpOnly cookies
- Role-based middleware on every route

### NFC
- **Web NFC API** — W3C browser standard
- Available on Android Chrome only
- Used for card read (payment) and card write (provisioning)
- NTAG213 cards — NXP, ISO 14443-3A, NFC Forum Type 2, 180 bytes NDEF memory
- MIME type records (application/json) — not text records

### Security
- SHA-256 + server-side salt for card secret hashing
- bcrypt for passwords and admin PIN
- Prisma atomic transactions for double-spend prevention
- In-memory rate limiting (5 attempts / 5 seconds / IP)
- Origin header CSRF protection on payment endpoints
- Role-based middleware on every route
- Admin PIN as second factor for sensitive actions
- httpOnly JWT cookies

### Deployment
- **Vercel** — serverless, auto-scaling, GitHub CI/CD
- **Supabase** — managed PostgreSQL
- **GitHub** — version control and deployment trigger
- **Environment variables** — validated at server startup via instrumentation.ts

---

## 5. DATABASE SCHEMA (13 MODELS)

### User
Fields: id, name, email, passwordHash, cardSecretHash (unique), rfidUid, balance (integer paise), dailySpendingLimit, status (ACTIVE/BLOCKED), createdAt, updatedAt
Relations: transactions, paymentAttempts, provisionRequests, pendingTopUps
Key: cardSecretHash is unique-indexed for O(1) lookup during payment

### Merchant
Fields: id, name, email, passwordHash, status, createdAt, updatedAt
Relations: paymentRequests, merchantTransactions, paymentAttempts

### Admin
Fields: id, name, email, passwordHash, createdAt

### PaymentRequest
Fields: id, merchantId, amount (integer), status (PENDING/USED/EXPIRED), expiresAt (2 minutes from creation), createdAt
Purpose: Created fresh per transaction. Single-use. Race condition guard.

### Transaction
Fields: id, userId, amount, type (DEBIT/CREDIT), status (SUCCESS/FAILED), clientTxId (unique idempotency key), createdAt
Purpose: Immutable payment record. DEBIT for purchases, CREDIT for top-ups.

### MerchantTransaction
Fields: id, merchantId, txId, createdAt
Purpose: Junction table linking Transaction to Merchant for merchant-side queries.

### PaymentAttemptLog
Fields: id, status (SUCCESS/FAILED), failureReason, ipAddress, merchantId, userId, paymentRequestId, amount, createdAt
Purpose: Full audit trail. Success logged inside atomic transaction. Failures logged outside so rollback doesn't erase them.

### AdminPin
Fields: id, adminId, pinHash, failedAttempts, lockedAt, createdAt
Purpose: bcrypt-hashed 6-digit PIN. Separate from login password. Locks after 5 wrong attempts.

### AdminActionLog
Fields: id, adminId, actionType, targetType, targetIdentifier, createdAt
Purpose: Audit trail for every sensitive admin action (CREATE_USER, TOP_UP, BLOCK_USER, DELETE_USER, etc.)

### ProvisionCardRequest
Fields: id, userId, adminId, status (PENDING/COMPLETED/EXPIRED), expiresAt (60 seconds), createdAt
Purpose: 60-second session for NFC card write. Ties a provisioning attempt to the specific admin who initiated it.

### ContactSubmission
Fields: id, name, phone, email, location, createdAt
Purpose: Stores enquiries from homepage contact form.

### PendingTopUp
Fields: id, orderId (unique, Razorpay order ID), userId, amount, createdAt, expiresAt
Purpose: Created when a Razorpay order is initiated. Webhook looks up userId from here, not from Razorpay payload (security fix TAP-004).

### AdminPinLock (part of AdminPin)
Lockout mechanism built into AdminPin model via failedAttempts and lockedAt fields.

---

## 6. COMPLETE PAYMENT FLOW

### Step 1 — Merchant creates payment request
- Merchant opens /merchant/receive
- Enters amount (must be positive integer, min ₹1, max ₹1,00,000)
- Taps Charge button
- Browser calls POST /api/merchant/payment-request
- Server: verifies merchant JWT, validates origin header (CSRF check), validates amount
- Server: creates PaymentRequest record (status: PENDING, expiresAt: 2 minutes)
- Returns requestId to browser

### Step 2 — NFC scanner initialises
- Browser calls ndef.scan() — triggers Android NFC permission dialog if needed
- 20-second countdown starts (countdown is UI only, server window is 2 minutes)
- If scan() throws: categorises error (not supported / disabled / permission denied)

### Step 3 — Student taps card
- Student holds NFC card to back of merchant's phone
- Phone vibrates — this is the READ completing, not the write
- onreading event fires with NDEF message
- Handler checks record.recordType:
  - If "text" (legacy cards): strips status byte + language code prefix before parsing
  - If "mime" (current format): decodes raw bytes directly
- Extracts parsed.secret (UUID)

### Step 4 — Authorize call
- Browser calls POST /api/nfc/authorize
- Payload: { requestId, cardSecret }
- Server validates origin header, rate limits by IP, checks cardSecret length (min 32 chars)

### Step 5 — Atomic database transaction
Inside prisma.$transaction():
1. Find PaymentRequest WHERE id = requestId — verify PENDING and not expired
2. Hash cardSecret with SHA-256 + CARD_SECRET_SALT
3. Find User WHERE cardSecretHash = hash — if not found: CARD_NOT_PROVISIONED
4. Check user status is ACTIVE — if not: USER_BLOCKED
5. Check user balance >= amount — if not: INSUFFICIENT_BALANCE
6. Check daily spending limit — sum today's DEBITs, compare — if exceeded: DAILY_LIMIT_EXCEEDED
7. updateMany PaymentRequest WHERE id = requestId AND status = PENDING → USED (race condition guard — only one concurrent request can win this)
8. Update user balance: balance - amount (SQL-level atomic decrement)
9. Create Transaction record (type: DEBIT, status: SUCCESS)
10. Create MerchantTransaction record
11. Log SUCCESS to PaymentAttemptLog

If any step fails: entire transaction rolls back
After rollback: separate prisma call logs FAILED to PaymentAttemptLog with reason code

### Step 6 — Response
- Server returns { ok: true, user: { name }, balance: newBalance }
- API returns generic error "PAYMENT_FAILED" publicly, specific code internally (TAP-005 fix)
- Merchant sees success screen with student's name
- Auto-resets after 5 seconds

### Failure reason codes
- CARD_NOT_PROVISIONED — no matching hash in DB
- USER_BLOCKED — account suspended
- INSUFFICIENT_BALANCE — not enough funds
- DAILY_LIMIT_EXCEEDED — hit daily cap
- REQUEST_ALREADY_PROCESSED — race condition caught or replay attempt
- DEFAULT — catch-all for unexpected errors

---

## 7. CARD PROVISIONING FLOW

### What provisioning does
Writes a cryptographic secret to a physical NFC card and stores its hash in the database against a user account.

### Step by step
1. Admin navigates to user profile, clicks Card button
2. Enters 6-digit PIN (bcrypt-verified, locks after 5 wrong attempts)
3. Browser calls POST /api/admin/provision-card
4. Server: verifies admin JWT, verifies PIN, creates ProvisionCardRequest (status: PENDING, expiresAt: 60 seconds)
5. Browser: generates random UUID secret via crypto.randomUUID()
6. Encodes JSON { "tpf": "1", "secret": "<uuid>" } using TextEncoder
7. Calls ndef.write() with recordType: "mime", mediaType: "application/json", data: payload.buffer
8. Waits 600ms after write resolves (flush delay — ensures physical commit to NTAG213 memory)
9. Calls POST /api/admin/provision-card/confirm
10. Server: verifies admin JWT, verifies calling admin matches request creator, verifies request still PENDING and not expired
11. Inside atomic transaction: nulls out cardSecretHash on any other user with same hash (re-provisioning invalidates old cards), sets new hash on target user, marks request COMPLETED
12. Poll loop (every 1.5s) on frontend sees COMPLETED, shows success screen

### Why MIME not TEXT record type
Text records prepend a status byte (encoding) + language code bytes before the payload.
Example: \x02en{"tpf":"1","secret":"..."}
This corrupts JSON.parse() because of the prefix bytes.
MIME records store raw bytes with no prefix — decode directly.

### Why 600ms flush delay
ndef.write() promise resolves when NFC controller sends data, but NTAG213 needs time to physically commit bytes to memory. Moving the card during this window results in a blank card but the DB thinks it's provisioned. 600ms ensures physical commit before confirm call.

### Backward compatibility
The read handler on the merchant page handles both old text records and new mime records:
- recordType === "text": strips bytes[0] & 0x3F (language code length) + 1 (status byte)
- Otherwise: decode raw bytes directly

---

## 8. SECURITY ARCHITECTURE

### Card secret design
- Secret: crypto.randomUUID() — 128-bit random UUID, 2^122 possible values
- Storage: SHA-256(secret + CARD_SECRET_SALT) — never raw secret
- Salt: environment variable, never in codebase
- DB breach: hashes are useless without the salt
- Minimum length check: cardSecret must be >= 32 chars at authorize endpoint

### Double-spend prevention
updateMany WHERE status = PENDING is the atomic guard. Two simultaneous requests for the same PaymentRequest: one updateMany succeeds (count: 1), one fails (count: 0). The one that gets count:0 returns REQUEST_ALREADY_PROCESSED. Money moves exactly once.

### CSRF protection
Origin header validated on payment-request and authorize endpoints. Requests not matching NEXTAUTH_URL rejected with 403. Prevents cross-site request forgery using merchant's session cookie.

### Rate limiting
In-memory rate limiter on /api/nfc/authorize: 5 attempts per 5 seconds per IP. Blocks brute force card secret enumeration.

### Admin PIN
Second factor for: provisioning cards, topping up wallets, blocking users, deactivating accounts. bcrypt-hashed separately from password. Locks after 5 wrong attempts. Requires database-level reset to unlock.

### No public registration
/api/register returns 410 Gone. Only admins can create accounts.

### Role isolation
Next.js middleware checks JWT role on every request. Merchant token cannot reach /admin. User token cannot reach /merchant. Admin token has full access.

### Security headers (next.config.ts)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Strict-Transport-Security: max-age=63072000
- Content-Security-Policy: restricts scripts, styles, connections

### Pentest findings and fixes (TAP-001 through TAP-009)
- TAP-001: provision-card/confirm had no auth — fixed, now requires admin JWT + adminId match + rate limit
- TAP-002: SHA-256 used instead of bcrypt for card secrets — flagged, migration pending
- TAP-003: cardSecretHash was exposed in users API response — fixed, now returns hasCard: boolean
- TAP-004: Razorpay webhook trusted receipt field for userId — fixed, uses PendingTopUp DB lookup
- TAP-005: Authorize returned specific error codes publicly — fixed, generic error + internal code
- TAP-006: Contact form had no rate limiting — fixed, 5 per minute per IP
- TAP-007: Deactivate user had no PIN, no refund record — fixed
- TAP-008: No security headers — fixed in next.config.ts
- TAP-009: Daily spending limit allowed zero — fixed, min ₹1 max ₹1,00,000

---

## 9. ALL API ENDPOINTS

### Public
POST /api/contact — Save contact form submission. Rate limited 5/min. Phone + email validation.

### Auth
POST /api/auth/callback/admin-credentials — Admin login
POST /api/auth/callback/merchant-credentials — Merchant login
POST /api/auth/callback/user-credentials — User login
POST /api/auth/signout — Sign out

### NFC Payment
POST /api/merchant/payment-request — Create payment request. Auth: merchant. Origin required.
POST /api/nfc/authorize — Process NFC payment. No session auth (card secret IS the credential). Rate limited. Origin required.
DELETE /api/merchant/payment-request/[id] — Cancel pending request.

### Admin — Users
GET /api/admin/users — List users (returns hasCard boolean, never cardSecretHash)
POST /api/admin/users — Create user
PATCH /api/admin/users — Update user (block/unblock, top up)

### Admin — Merchants
GET /api/admin/merchants — List merchants
POST /api/admin/merchants — Create merchant
GET /api/admin/merchants/[id]/transactions — Merchant transaction history (admin-scoped)

### Admin — Cards
POST /api/admin/provision-card — Create provisioning session. Auth: admin + PIN.
POST /api/admin/provision-card/confirm — Store card hash. Auth: admin + adminId match.
GET /api/admin/provision-card/confirm — Poll provisioning status.

### Admin — Data
GET /api/admin/dashboard — KPI data for dashboard
GET /api/admin/payment-logs — Paginated attempt logs. Filter by status/merchant.
GET /api/admin/export — CSV transaction export. Max 31 days.
GET /api/admin/export/pdf — Styled HTML audit report with auto-print.
POST /api/admin/pin — Set or rotate admin PIN.
POST /api/admin/deactivate-user — Deactivate user. Requires PIN. Creates refund record.

### Merchant
GET /api/merchant/stats — Revenue stats (today, week, month, all-time)
GET /api/merchant/transactions — Merchant's own transaction history

### User
GET /api/user/me — Current user profile and balance
GET/POST /api/user/settings — Get or set daily spending limit
GET /api/dashboard/transactions — User's own transaction history

### Webhooks
POST /api/webhooks/razorpay — Razorpay payment capture. Verifies HMAC signature. Looks up userId from PendingTopUp.

---

## 10. ADMIN DASHBOARD FEATURES

### KPI Overview (auto-refreshes every 30 seconds)
- Total users, active users, blocked users
- Total wallet pool balance (sum of all student balances)
- Total merchants, active merchants
- Recent transaction count and failed attempt count
- Manual refresh button with spinning animation

### User Management (/admin/users)
- Search by name or email
- Create new user (name, email, password, optional daily limit)
- View balance and card status (Provisioned / None)
- Top up wallet (requires PIN)
- Block / unblock account (requires PIN)
- Provision NFC card (requires PIN, opens ProvisionCardModal)

### Merchant Management (/admin/merchants)
- List all merchants with status
- Create new merchant
- Block / unblock
- View individual merchant transaction history

### Payment Logs (/admin/payment-logs)
- Paginated table — 50 records per page, newest first
- Summary strip: success count, failed count, total amount
- Filter by status (All / Success / Failed) and by merchant
- Expandable rows showing Log ID, Request ID, IP address, raw failure code
- Mobile card layout
- Failed rows show reason in plain English, amount struck through

### Export & Audit (/admin/export)
- Date range selector with presets (Today, This Week, This Month, Custom)
- Filter by merchant, user, status
- Download CSV — raw data
- Export PDF — opens styled A4 report in new tab, auto-triggers print dialog
- PDF includes: Tapfinity header + logo, summary stats (total, successful, failed, success rate %), filter chips, full table, confidential footer

### Settings (/admin/settings)
- Set or rotate admin PIN
- Dot indicator UI (shows filled/empty dots)
- PIN is bcrypt-hashed on save

---

## 11. MERCHANT DASHBOARD FEATURES

### Stats Overview
- Today's revenue and transaction count
- This week's revenue
- This month's revenue
- All-time revenue and transaction count

### Receive Payment (/merchant/receive)
- Amount input — integer only, min ₹1, max ₹1,00,000
- States: ENTER → PREPARING → WAITING → SUCCESS / FAILED
- WAITING: concentric pulsing teal rings (sonar animation), 20s countdown
- SUCCESS: student name + amount confirmed, auto-reset after 5s
- FAILED: specific error message, Try Again and Change Amount buttons
- Change Amount preserves the entered amount (doesn't clear it)
- NFC errors categorised: not supported / hardware disabled / permission denied / read error

### Transaction History (/merchant/transactions)
- Full list with amounts, student info, timestamps
- Status badges

---

## 12. USER DASHBOARD FEATURES

### Balance Overview
- Current balance (hero card)
- Card status (active / blocked)
- 30-day total spend
- Daily spending limit with progress bar and glow at fill edge

### Transaction History (/dashboard/history)
- Full payment history
- Filter by DEBIT / CREDIT
- Each item as a card with hover effect

### Card Management
- Block own card instantly
- Unblock own card

### Settings
- Set daily spending limit (₹1 to ₹1,00,000, or remove limit)

---

## 13. NFC TECHNICAL DETAILS

### Hardware
- Card type: NXP NTAG213
- Protocol: ISO 14443-3A (NfcA)
- Technology: MifareUltralight, NDEF
- Memory: 180 bytes / 45 pages / 4 bytes per page
- Data format: NFC Forum Type 2
- Password protection: None (by design — read-only NFC readers can clone card, but secret alone can't authorize payment without a valid PaymentRequest)

### Write (Provisioning)
- API: window.NDEFReader.write()
- Record type: mime
- Media type: application/json
- Data: raw ArrayBuffer from TextEncoder
- Payload: { "tpf": "1", "secret": "<uuid>" }
- Flush delay: 600ms after write promise resolves

### Read (Payment)
- API: window.NDEFReader.scan() + onreading event
- onreadingerror: categorises hardware-level failures
- Dual decode path: text record (legacy) vs mime record (current)
- Text path: strip bytes[0] & 0x3F + 1 from start
- MIME path: TextDecoder().decode(record.data) directly

### Platform constraint
- Web NFC: Android Chrome only
- iOS: CoreNFC via Apple's framework — requires native app
- React Native path for iOS: react-native-nfc-manager library

---

## 14. HOMEPAGE

### Design system
- Obsidian Kinetic — #0B0E13 base, #191C20 cards, no harsh borders
- Primary gradient: #AEC6FF to #0070F3
- Accent: #00DAF3 (teal), #D0BCFF (purple)
- Fonts: Inter 900 headlines, Space Grotesk for data
- Ambient glow blobs, floating NFC visual, sonar ping rings

### Sections
1. Navbar — Logo, Sign In link, Contact Us button
2. Hero — Headline, stats strip (< 50ms / 0 Cash / 100% Atomic Success), CTA buttons, floating NFC card visual
3. How it works — 3-step protocol workflow
4. Features — 6 feature cards (hashing, atomic, rate limiting, admin panel, analytics, export)
5. Ecosystem Roles — Admin / Merchant / End User
6. CTA section — Get Started Today + Contact Sales
7. Footer

### Contact modal
- Fields: name, phone, email, college/city
- Validates all fields, phone regex, email regex
- Rate limited server-side (5/min per IP)
- Saves to ContactSubmission table
- Shows personalised success message with user's first name

---

## 15. DEPLOYMENT AND INFRASTRUCTURE

### Vercel
- Each API route = independent serverless Lambda
- Auto-scales per request
- GitHub push → automatic deploy
- Environment variables stored in Vercel dashboard

### Environment variables required
- DATABASE_URL — Supabase PostgreSQL connection string
- NEXTAUTH_SECRET — JWT signing secret (min 32 random chars)
- NEXTAUTH_URL — exact production URL (no trailing slash)
- CARD_SECRET_SALT — salt for SHA-256 card hashing (never change after first provisioning)
- RAZORPAY_KEY_ID — Razorpay API key
- RAZORPAY_KEY_SECRET — Razorpay secret
- RAZORPAY_WEBHOOK_SECRET — for HMAC webhook verification

### Startup validation
instrumentation.ts + lib/validateEnv.ts checks all required env vars at server startup. Crashes immediately with a clear error if any are missing.

### Database migration
Prisma handles schema migrations. New models (PendingTopUp) require:
- npx prisma generate (regenerates TypeScript types)
- Manual SQL in Supabase (CREATE TABLE statements)

---

## 16. KNOWN LIMITATIONS

- Web NFC = Android Chrome only. iOS not supported without native app.
- Student self-top-up not wired (Razorpay backend ready, frontend not)
- Contact form saves to DB but no email notification triggered
- Export capped at 31 days
- Daily spending limit resets at server midnight not student's local timezone
- No transaction dispute resolution mechanism
- No SMS/email receipts after payment
- No session timeout warning
- RBI Prepaid Payment Instrument licence required for commercial deployment

---

## 17. FUTURE ROADMAP

### Immediate (1-2 weeks)
- Confirm NFC end-to-end in production
- Wire Razorpay self-top-up on user dashboard
- Resend email integration for contact form and low balance alerts
- Contact submissions viewer in admin

### Short-term (1 month)
- React Native merchant app for iOS NFC support
- Transaction receipt emails/SMS
- Lost card replacement flow
- bcrypt migration for card secrets

### Medium-term (3 months)
- Multi-tenancy (collegeId on every table)
- Admin-configurable price lists (prevents merchant amount tampering)
- Real-time WebSocket payment notifications
- Native mobile app (React Native + Expo)
- Redis-based distributed rate limiting

### Long-term (commercial)
- RBI PPI licence for commercial deployment
- Multi-campus tenant isolation
- Enterprise admin features
- Payment analytics and insights
- Parent portal for top-up authorisation

---

## 18. KEY DESIGN DECISIONS AND WHY

### Why Next.js instead of separate frontend + backend
Single deployment, shared TypeScript types, no CORS configuration, API routes co-located with pages. One Vercel project covers everything.

### Why closed-loop instead of UPI
Avoids RBI Payment Aggregator licence requirements for a pilot deployment. Money stays within the institution. Admin has full control.

### Why Web NFC instead of a native app
Zero installation friction for merchants. Any Android Chrome browser becomes a payment terminal. No App Store approval process.

### Why MIME records instead of TEXT records for NFC
Text NDEF records prepend a status byte and language code before the payload bytes. This corrupts JSON.parse() silently — the error is caught, fail("DEFAULT") is called, and the user sees "something went wrong" with no indication of why. MIME records write raw bytes with no prefix.

### Why 600ms flush delay
NTAG213 NFC memory write is not instantaneous after the Web NFC API promise resolves. Moving the card away in the window between promise resolution and physical memory commit results in a blank card that the database thinks is provisioned. The 600ms guard eliminates this race.

### Why failure logs are outside the atomic transaction
If the payment fails for any reason, the database transaction rolls back. A PaymentAttemptLog created inside the transaction would be rolled back too — the failure would be silently lost. By logging failures in a separate prisma call outside the transaction, the audit trail is preserved regardless of what the transaction does.

### Why origin header CSRF protection instead of CSRF tokens
Next.js App Router API routes don't have built-in CSRF token support. The origin header check achieves the same result with less complexity — validate that the request comes from your own domain, reject anything else.

### Why SHA-256 + salt instead of bcrypt for card secrets
Card secrets are looked up by hash on every payment — the database must find the user by their cardSecretHash. bcrypt produces different hashes for the same input (intentionally, using salting) which means you can't do a WHERE cardSecretHash = hash lookup. SHA-256 with a fixed server-side salt is deterministic, enabling direct database lookup while still being cryptographically secure against offline attacks if the salt is kept secret.

---

## 19. COMMON QUESTIONS AND ANSWERS

**Q: Can someone clone an NFC card and use it to pay?**
A: Yes, the card can be physically read by any NFC reader and the secret extracted. But the secret alone is useless — every payment requires a valid, unexpired PaymentRequest created by a logged-in merchant. A cloned card can only be used if there's an active payment request waiting, which requires merchant cooperation. For a campus setting this threat is minimal.

**Q: What happens if the NFC tap happens twice?**
A: The PaymentRequest has status PENDING. After the first successful tap, it's marked USED via atomic updateMany. The second tap finds status = USED, not PENDING, so the updateMany count is 0 and the payment is rejected with REQUEST_ALREADY_PROCESSED. Money moves once.

**Q: What happens if a student has insufficient balance?**
A: The authorize endpoint checks balance inside the atomic transaction before decrementing. If balance < amount, it throws INSUFFICIENT_BALANCE, the transaction rolls back, no money moves, and the merchant sees a failure screen.

**Q: Can a merchant change the amount to charge less?**
A: Yes — this is a known limitation (TAP from the pentest). A dishonest merchant can intercept the POST /api/merchant/payment-request call via browser DevTools and change the amount. The server validates it's a positive integer within bounds but cannot verify the merchant's intended amount. Full mitigation requires an admin-managed price list.

**Q: Why does payment fail even after the phone vibrates?**
A: The phone vibrates on NFC card read, not on write or payment completion. The vibration is just Android's NFC system acknowledging the card was detected. The actual payment processing happens after that. If the card is moved away after vibration, the read data was already captured — vibration doesn't affect whether the payment succeeds or fails.

**Q: What is CARD_SECRET_SALT and can I change it?**
A: It's a server-side secret used to hash card secrets. Never change it after first production provisioning. Every card provisioned with the old salt will fail with CARD_NOT_PROVISIONED because the stored hash won't match. If the salt must be rotated, every card must be re-provisioned.

**Q: Does Tapfinity need an RBI licence?**
A: For a closed pilot within one institution where no money crosses institutional boundaries, no. For commercial deployment to multiple colleges where you collect fees, yes — you'd need a Prepaid Payment Instrument licence from RBI.

**Q: What's the difference between PaymentRequest and Transaction?**
A: PaymentRequest is ephemeral — created per payment attempt, expires in 2 minutes, single-use. Transaction is permanent — created only on success, immutable record of actual money movement. A failed payment creates a PaymentAttemptLog but no Transaction.

---

## 20. PROJECT TIMELINE AND SESSIONS SUMMARY

### What was built
- Full Next.js application with three role-based portals
- NFC card provisioning and payment flow
- Atomic payment processing with double-spend prevention
- Admin dashboard with KPI cards, user/merchant management
- Payment Logs page with filters and expandable rows
- CSV and PDF export with styled audit report
- Security hardening based on penetration test (9 findings fixed)
- Homepage with Obsidian Kinetic design system
- Contact form with DB storage and rate limiting
- Auto-refresh on admin dashboard (30 second interval)
- Merchant transaction viewer (admin-scoped)

### Key bugs fixed
- NFC NDEF text record vs mime record parse corruption
- TypeScript global declaration conflicts (nfc.d.ts)
- ProvisionCardModal ESLint setState-in-effect error
- Provisioning window extended from 20s to 60s
- 600ms NFC flush delay added
- JWT maxAge mismatch (30 days vs intended 1 day)
- Change Amount button preserving entered amount
- NFC scan() failure categorised properly instead of generic DEFAULT
- Merchant transactions page hitting wrong API (merchant vs admin endpoint)
- Wallet Pool card truncating numbers on mobile
- Next.js 16 dynamic params now a Promise (await params)
- Root-level stray files (page.tsx, nfc.d.ts, RfidModal.tsx) deleted

### Security improvements
- provision-card/confirm endpoint auth added
- cardSecretHash removed from API responses
- Razorpay webhook userId DB lookup (not payload)
- Generic public errors + internal codes
- Contact form rate limiting
- Deactivate user requires PIN + creates refund record
- Security headers in next.config.ts
- Daily spending limit bounds validation
- Origin header CSRF protection on payment endpoints
- cardSecret minimum length validation
