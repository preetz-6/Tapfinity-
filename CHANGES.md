# Tapfinity v2 — Enhancement Summary

## UI / Design

### Login Page (`app/login/page.tsx`)
- New premium dark fintech aesthetic with ambient gradient blobs
- Role selector now shows icons (👤 🏪 ⚙️) with smooth transitions
- Each role has its own accent color (orange, violet, blue)
- Password show/hide toggle
- Better error display with icon
- Spinner during loading

### Admin Sidebar (`app/admin/AdminShell.tsx`)
- Icons added to all nav items
- Active state with colored dot indicator
- Consistent with new design language
- Mobile hamburger already existed, enhanced styling

### User Shell (`app/dashboard/UserShell.tsx` + `UserSidebar.tsx`)
- **Added mobile hamburger menu** (was missing entirely)
- Mobile overlay with backdrop blur
- Orange-themed sidebar consistent with user dashboard
- Active state with dot indicator + border

### Merchant Shell (`app/merchant/MerchantShell.tsx`)
- **Added mobile hamburger menu** (was missing entirely)
- Violet-themed sidebar consistent with merchant branding
- Mobile overlay with backdrop blur

### Merchant Receive Page (`app/merchant/receive/page.tsx`)
- Quick amount buttons (₹20, ₹50, ₹100, ₹200)
- Custom amount input with ₹ prefix
- Better NFC animation with layered ping rings
- **Progress bar** showing time countdown (turns red at 5s)
- Success screen shows payer's name
- Failure screen with clear retry CTA

### User Dashboard (`app/dashboard/page.tsx`)
- Better stat cards with icons and sub-labels
- Skeleton loading instead of blank space
- Cleaner chart containers

### Transaction History (`app/dashboard/history/page.tsx`)
- Skeleton loading rows
- Better date formatting (Indian locale)
- Empty state with illustration
- Proper color for credit (green) vs debit (red)

### Merchant Transactions (`app/merchant/transactions/page.tsx`)
- Total received summary in header
- Status badges with colored dots
- Skeleton loading rows
- Better date formatting

### PIN Modal (`app/components/PinModal.tsx`)
- Visual PIN dot indicators (fills as you type)
- Auto-focus input on open
- Better animations

## New Components

### Toast Notification (`app/components/Toast.tsx`)
- Global toast system (success, error, info, warning)
- Slide-in animation from right
- Auto-dismisses after 3.5 seconds
- Accessible and non-blocking

### Enhanced `globals.css`
- `animate-slide-in` — for toast notifications
- `animate-fade-up` — for page/modal entrance
- `animate-nfc-ping` — for NFC waiting animation
- `skeleton` — shimmer loading effect
- Custom scrollbar styling
- Removes number input arrows

## Security

### Rate Limiter (`lib/rateLimit.ts`)
- `getClientIp()` helper that prefers `x-real-ip` over `x-forwarded-for`
  (more resistant to header spoofing)
- Sanitizes rate-limit keys to prevent Map-key injection
- Automatic cleanup of stale entries to prevent memory leaks
- Added JSDoc comments explaining serverless limitations

### NFC Authorize Route (`app/api/nfc/authorize/route.ts`)
- Uses new `getClientIp()` for accurate IP
- Input validation: type-checks `requestId` and `cardSecret`
- Length limits on inputs (128/256 chars) to prevent abuse
- Cleaner error handling with `ok: false` format
- Returns user name in success response (used in UI)

## How to Use

```bash
# Copy this folder to replace your existing project files
# Or selectively copy the files you want

npm install
npm run dev
```
