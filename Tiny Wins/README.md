# TinyWins — Graceful Microhabits Companion

> **TinyWins helps you grow quietly, consistently, and kindly — with grace.**

TinyWins is a personalized, privacy-first, mobile-first microhabits application. It is designed to be installed as a PWA, featuring a sunset-inspired theme that is warm, non-judgmental, and emotionally safe.

---

## 🌅 Tech Stack

* **Frontend**: React + Vite + TypeScript
* **Styling**: Tailwind CSS
* **Backend**: Node.js + Express
* **Database**: PostgreSQL (Supabase-compatible)
  * *Fallback*: Local JSON Database (`local_store.json`) for zero-setup instant development.
* **Authentication**: JWT-based session auth.
* **AI Engine**: OpenAI GPT-4o-mini
  * *Fallback*: Dynamic rule-based mock engine if API key is not supplied.
* **Security & PWA**: 4/6 digit hashed PIN app lock, activity timers, passkeys ready, offline caching, installable.

---

## 📂 Project Structure

```
tinywins/
├── backend/
│   ├── src/
│   │   ├── controllers/      # Route logic (Auth, Habits, Coach, Privacy)
│   │   ├── db/               # PostgreSQL schema & local JSON fallbacks
│   │   ├── middleware/       # JWT auth & security audit logging
│   │   ├── services/         # Tiny Coach advice generator
│   │   └── server.ts         # Server entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
└── frontend/
    ├── src/
    │   ├── components/       # Reusable components (SunsetButton, PinInput)
    │   ├── context/          # Auth, Theme, and AppLock states
    │   ├── pages/            # All 25 MVP views (Today dashboard, Timeline)
    │   ├── App.tsx           # Router configuration & guard locks
    │   └── main.tsx          # React mounter & PWA Service worker mounter
    ├── vite.config.ts        # PWA manifest and icons config
    ├── tailwind.config.js    # Sunset palette overrides
    └── package.json
```

---

## 🚀 Getting Started

### 1. Backend Setup

1. Open your terminal in `backend/`.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Initialize the environment variables by copying `.env.example`:
   ```bash
   cp .env.example .env
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
   *Note: If `DATABASE_URL` is omitted, the backend automatically sets up a local database file `src/db/local_store.json`. No PostgreSQL installation is required to start developing immediately!*

### 2. Frontend Setup

1. Open your terminal in `frontend/`.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the Vite development server:
   ```bash
   npm run dev
   ```
4. Open the link in your browser (usually `http://localhost:3000`).

---

## 🔒 Security & Privacy-First Blueprints

1. **Row-Level Security (RLS)**: Included inside the `schema.sql` file. Ensures users can only query rows where `user_id = authenticated_user`.
2. **App PIN Lock**: Hashes PIN passcodes on creation. Locks the user interface after inactivity timeouts (1m, 5m, 15m, 30m).
3. **Failed Attempt Lockout**: Temporarily locks the app for 5 minutes after 5 failed PIN attempts. Logs audit entries for security analysis.
4. **AI Data Minimization**: Sends only category tags and completion metrics to OpenAI. Excludes passwords, phone numbers, and full profile tables. Requires opt-in consent before reading logs.
5. **Data Control Dashboard**: Provides GDPR actions to export files as JSON or CSV, delete reflections diaries, purge logs, or close accounts completely.

---

## 📦 PWA Offline Installation

TinyWins is configured with `vite-plugin-pwa`. When built (`npm run build`), Vite compiles a Service Worker that handles:
* Caching stylesheet icons and assets.
* Allowing the application to load completely offline.
* Presenting an "Install app on device" banner in browsers.

---

## 📄 Deployment Guidelines

### Database Setup (Supabase)
1. Create a new project on [Supabase](https://supabase.com/).
2. Navigate to the **SQL Editor** in the Supabase Dashboard.
3. Copy the contents of `backend/src/db/schema.sql` and run it to initialize all tables, row-level security (RLS) policies, and indexes.

### Backend (Render / Railway)
1. Link your GitHub repository to Render and create a new **Web Service**.
2. Set the following configurations:
   * **Root Directory**: `backend`
   * **Build Command**: `npm run build`
   * **Start Command**: `npm run start`
3. Set the following environment variables:
   * `NODE_ENV=production`
   * `JWT_SECRET=your_production_secret` (a secure random string)
   * `DATABASE_URL=your_supabase_postgres_connection_string` (find this in Supabase under Project Settings > Database)
   * `ANTHROPIC_API_KEY=your_anthropic_api_key` (if using Claude)
   * `OPENAI_API_KEY=your_openai_api_key` (if using ChatGPT instead of Claude)
   * `ENABLE_MOCK_COACH=false` (to enable live AI coach advice)

### Frontend (Vercel / Netlify)
1. Link your GitHub repository to Vercel and import the project.
2. Set the following configurations:
   * **Root Directory**: `frontend`
   * **Framework Preset**: `Vite`
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
3. Configure URL rewrite redirects in `vercel.json` to route `/api/*` requests to your hosted backend server (e.g. `https://your-backend.onrender.com/api/:path*`).
