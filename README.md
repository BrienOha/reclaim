# ⚡ Reclaim — Anti-Addiction & Productivity App

A full-stack, cross-platform personal application built to break dopamine-heavy addictions (doomscrolling, compulsive video loops, late-night triggers) and replace lost hours with creative mastery, intentional habits, and deep focus.

Designed with a playful, high-contrast **Neo-Brutalist** aesthetic (thick 3.5px solid borders, zero-blur hard offset shadows, vibrant flat color blocks, tactile 3D press-down buttons, and responsive desktop sidebar / mobile bottom navigation).

---

## 📱 Cross-Platform Architecture
- **Web:** Full-height responsive layout with desktop sidebar, swipeable intro on mobile browsers, static export ready for Vercel/Netlify.
- **iOS:** Native gesture animations, haptic feedback, bottom navigation bar, safe-area adaptation.
- **Android:** Native gesture animations, adaptive icons, edge-to-edge support, predictive back gesture support.

---

## 🛠️ Technology Stack
- **Framework:** Expo SDK 58 (React Native 0.88 + React 19) with file-based **Expo Router**.
- **Backend & Auth:** Supabase (PostgreSQL, Real Authentication, Row Level Security, Storage Buckets).
- **Route Protection:** Expo Router Route Groups:
  - `(public)`: Public Landing Page, Sign Up, Log In, Forgot Password, Reset Password.
  - `(app)`: Protected application tabs guarded by session check and onboarding status.
- **State & Data:** TanStack Query (`@tanstack/react-query`) + Zustand + User-Scoped `@react-native-async-storage/async-storage` for offline-first caching and optimistic UI updates.
- **Validation:** Zod for inline schema validation and user-friendly error banners.
- **Styling:** Custom Neo-Brutalist design tokens (`src/constants/theme.ts`) with Light (Cream) and Dark (Obsidian) modes.
- **Charts:** Scalable vector charts powered by `react-native-svg`.
- **Canvas / Journal:** `expo-image-picker`, `react-native-view-shot` for image exports.
- **Haptics:** `expo-haptics` with cross-platform safety wrappers.
- **Typography:** 15 curated Google fonts with live typography preview in the journal canvas.

---

## 🔐 Real Authentication & Route Architecture

Reclaim uses a real production authentication system:
- **No Mock/Dummy Accounts:** Queries and mutations use the real authenticated user's ID (`user.id`) from the active Supabase session.
- **User-Scoped Local Storage:** All cached offline entities are isolated per user (`reclaim_u_${userId}_${entity}`), ensuring multiple users on the same device or browser never see each other's data.
- **Session Persistence & Auto-Refresh:** Sessions persist across native secure storage and web `localStorage` with automatic token refresh.
- **Branded Splash Screen:** A Neo-Brutalist loading screen displays during auth initialization, preventing any flashing of unauthenticated content.
- **Clean Logout:** Logging out purges the TanStack Query cache, clears user local state, and invalidates the session, returning the visitor to the public landing page.

### Route Breakdown

```
src/app/
├── _layout.tsx               # Root layout: QueryClient, Theme, Auth initialization, Splash
├── (public)/                 # Logged-out visitor routes
│   ├── _layout.tsx           # Public route guard (redirects authenticated users to /)
│   ├── landing.tsx           # Neo-brutalist landing page (Hero, 6 animated feature cards, 3 steps, CTA)
│   ├── login.tsx             # Real Email + Password login with show/hide password
│   ├── sign-up.tsx           # Account registration with password strength meter
│   ├── forgot-password.tsx   # Request password recovery email
│   └── reset-password.tsx    # Set new password from recovery link
└── (app)/                    # Protected routes (requires valid session)
    ├── _layout.tsx           # Protected guard (checks session & onboarding status) + Navigation bar
    ├── onboarding.tsx        # First-run setup wizard (Currency, Bad habits, Hobbies, Budget)
    ├── index.tsx             # 🏠 Dashboard / Daily Overview & Urge Rescue trigger
    ├── hobbies.tsx           # 🎨 Free Time Engine & Creative Craft Timers
    ├── todos.tsx             # ✅ Notion-style To-Do list & Priorities
    ├── journal.tsx           # 📖 Canvas Journal with 15 Google Fonts & Sticker Pack
    ├── finance.tsx           # 💰 Weekly Budget, Expenses, SVG Daily Chart & Wishlist
    ├── goals.tsx             # 🏆 3-Tier Goal Roadmap & Weekly Spotlight
    ├── urge.tsx              # ⚡ 10-Minute Urge Surfing & Box Breathing
    └── settings.tsx          # ⚙️ Profile, Theme, Currency & Sign Out
```

---

## 🌟 First-Run Onboarding Flow (`/onboarding`)

When a visitor creates a fresh account, the database trigger automatically creates their `profiles` row with `has_completed_onboarding = false`. The app smoothly guides them through a 4-step wizard before entering the workspace:
1. **Welcome & Currency:** Choose your active currency symbol (Default: **Philippine Peso ₱**).
2. **Bad Habits to Quit:** Define the habits you want to break (e.g. Doomscrolling, Late-night snacking) to initialize clean streak counters.
3. **Creative Hobbies:** Pick or confirm your crafts (Preselected: Drawing, Film/Videography, Editing, Graphic Design, Music).
4. **Weekly Budget & Savings:** Set your weekly allowance and creative gear savings allocation.
5. **Launch Workspace:** Lands directly on the Home dashboard with empty states ready for real data.

---

## ⚙️ Supabase Configuration Guide

### 1. Dashboard URL Configuration
In your Supabase project dashboard, navigate to **Authentication** → **URL Configuration**:
- **Site URL:**
  - Local Dev: `http://localhost:8081`
  - Production: `https://your-production-domain.com`
- **Redirect URLs:**
  - `http://localhost:8081/**`
  - `https://your-production-domain.com/**`
  - `exp://*` (for Expo Go / Development Builds)

### 2. Email Confirmation Settings (Testing vs Production)
- **During Local Testing:** Go to **Authentication** → **Providers** → **Email** and temporarily toggle **"Confirm email"** to **OFF**. This allows new test accounts to log in immediately upon sign-up without waiting for confirmation emails.
- **For Production Deployment:** Turn **"Confirm email"** back **ON** and configure your custom SMTP provider (e.g. Resend, SendGrid).

### 3. Database Schema & Migrations
In the Supabase **SQL Editor**:
- **Full Database Setup:** Run [`supabase/migrations/20261023_init_reclaim.sql`](supabase/migrations/20261023_init_reclaim.sql).
- **Onboarding Migration Only (if updating existing DB):** Run [`supabase/migrations/20261023_add_onboarding.sql`](supabase/migrations/20261023_add_onboarding.sql).
- **Wipe Test / Dummy Data:** Run [`supabase/wipe_test_data.sql`](supabase/wipe_test_data.sql) to remove all leftover rows tied to test dummy accounts.

### 4. Row Level Security (RLS) Verification
All tables have RLS enabled with strict policies:
```sql
create policy "Users can manage their own data"
  on public.<table_name>
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```
Unauthenticated requests are completely rejected by PostgreSQL.

---

## 🧪 Optional Developer Seeding Script

Seed data never runs automatically and never runs in production. If you want sample data for development:
```bash
# Provide your real user UUID from Supabase Auth:
npm run seed:dev -- --user-id=YOUR_USER_UUID
```
This populates sample creative hobbies, starter tasks, finance budget, and goal roadmaps strictly for that single user ID.

---

## 🏃 Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Run web development server
npm run web
# Opens on http://localhost:8081

# 3. Type check & Lint
npx tsc --noEmit
npx expo lint
```

---

## 🩺 Clinical Support Disclaimer
Reclaim is a personal self-management, productivity, and urge-surfing support tool. It is not a substitute for clinical psychiatric care, medical advice, or certified addiction recovery therapy. If you are experiencing severe dependencies or mental distress, please reach out to licensed healthcare professionals.
