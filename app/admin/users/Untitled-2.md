# File Tree: tapfinity

**Generated:** 2/2/2026, 11:26:07 PM
**Root Path:** `c:\Users\Preetam U\tapfinity`

```
├── 📁 app
│   ├── 📁 admin
│   │   ├── 📁 transactions
│   │   │   └── 📄 page.tsx
│   │   ├── 📁 users
│   │   │   ├── 📄 CreateUserModal.tsx
│   │   │   ├── 📄 ProvisionCardModal.tsx
│   │   │   ├── 📄 RfidModal.tsx
│   │   │   ├── 📄 TopUpModal.tsx
│   │   │   └── 📄 page.tsx
│   │   ├── 📄 AdminShell.tsx
│   │   ├── 📄 layout.tsx
│   │   └── 📄 page.tsx
│   ├── 📁 api
│   │   ├── 📁 admin
│   │   │   ├── 📁 dashboard
│   │   │   │   └── 📄 route.ts
│   │   │   ├── 📁 merchants
│   │   │   │   └── 📄 route.ts
│   │   │   ├── 📁 pin
│   │   │   │   └── 📄 route.ts
│   │   │   ├── 📁 provision-card
│   │   │   │   ├── 📁 confirm
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   └── 📄 route.ts
│   │   │   └── 📁 users
│   │   │       └── 📄 route.ts
│   │   ├── 📁 auth
│   │   │   └── 📁 [...nextauth]
│   │   │       └── 📄 route.ts
│   │   ├── 📁 merchant
│   │   │   ├── 📁 payment-request
│   │   │   │   ├── 📁 [id]
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   └── 📄 route.ts
│   │   │   └── 📁 transactions
│   │   │       └── 📄 route.ts
│   │   ├── 📁 nfc
│   │   │   └── 📁 authorize
│   │   │       └── 📄 route.ts
│   │   ├── 📁 register
│   │   │   └── 📄 route.ts
│   │   ├── 📁 transactions
│   │   │   └── 📄 route.ts
│   │   ├── 📁 user
│   │   │   ├── 📁 block-card
│   │   │   │   └── 📄 route.ts
│   │   │   ├── 📁 me
│   │   │   │   └── 📄 route.ts
│   │   │   ├── 📁 topup
│   │   │   │   └── 📁 create-order
│   │   │   │       └── 📄 route.ts
│   │   │   └── 📁 transactions
│   │   │       └── 📄 route.ts
│   │   └── 📁 webhooks
│   │       └── 📁 razorpay
│   │           └── 📄 route.ts
│   ├── 📁 components
│   │   ├── 📄 PaymentFailure.tsx
│   │   ├── 📄 PaymentSuccess.tsx
│   │   └── 📄 PinModal.tsx
│   ├── 📁 dashboard
│   │   ├── 📁 card
│   │   │   └── 📄 page.tsx
│   │   ├── 📁 components
│   │   │   ├── 📄 MerchantChart.tsx
│   │   │   ├── 📄 SpendChart.tsx
│   │   │   └── 📄 UserSidebar.tsx
│   │   ├── 📁 history
│   │   │   └── 📄 page.tsx
│   │   ├── 📁 topup
│   │   │   └── 📄 page.tsx
│   │   ├── 📄 UserShell.tsx
│   │   ├── 📄 layout.tsx
│   │   └── 📄 page.tsx
│   ├── 📁 login
│   │   └── 📄 page.tsx
│   ├── 📁 merchant
│   │   ├── 📁 components
│   │   │   └── 📄 PaymentSuccessCard.tsx
│   │   ├── 📁 receive
│   │   │   └── 📄 page.tsx
│   │   ├── 📁 transactions
│   │   │   └── 📄 page.tsx
│   │   ├── 📄 MerchantShell.tsx
│   │   ├── 📄 layout.tsx
│   │   └── 📄 page.tsx
│   ├── 📄 favicon.ico
│   ├── 🎨 globals.css
│   ├── 📄 layout.tsx
│   ├── 📄 page.tsx
│   └── 📄 providers.tsx
├── 📁 lib
│   ├── 📄 auth.ts
│   ├── 📄 hashCardSecret.ts
│   ├── 📄 prisma.ts
│   ├── 📄 rateLimit.ts
│   └── 📄 verifyAdminPin.ts
├── 📁 prisma
│   ├── 📁 migrations
│   │   ├── 📁 20260122075803_init
│   │   │   └── 📄 migration.sql
│   │   ├── 📁 20260123055205_add_user_password_hash
│   │   │   └── 📄 migration.sql
│   │   ├── 📁 20260129173018_merchant_foundation
│   │   │   └── 📄 migration.sql
│   │   ├── 📁 20260129180125_payment_request
│   │   │   └── 📄 migration.sql
│   │   ├── 📁 20260130061609_add_card_secret_hash
│   │   │   └── 📄 migration.sql
│   │   ├── 📁 20260201164659_add_payment_attempt_logs
│   │   │   └── 📄 migration.sql
│   │   ├── 📁 20260201191839_add_unblock_merchant_action
│   │   │   └── 📄 migration.sql
│   │   ├── 📁 20260202065436_provision_card_requests
│   │   │   └── 📄 migration.sql
│   │   └── ⚙️ migration_lock.toml
│   └── 📄 schema.prisma
├── 📁 public
│   ├── 🖼️ file.svg
│   ├── 🖼️ globe.svg
│   ├── 🖼️ next.svg
│   ├── 🖼️ vercel.svg
│   └── 🖼️ window.svg
├── 📁 tapfinity-bridge
├── 📁 types
│   ├── ⚙️ Untitled-1.json
│   └── 📄 next-auth.d.ts
├── ⚙️ .gitignore
├── 📝 README.md
├── 📄 eslint.config.mjs
├── 📄 middleware.ts
├── 📄 next.config.ts
├── ⚙️ package-lock.json
├── ⚙️ package.json
├── 📄 postcss.config.mjs
├── 📄 prisma.config.ts
└── ⚙️ tsconfig.json
```

---
*Generated by FileTree Pro Extension*