# Crick Auction Project Documentation

This document explains the Crick Auction application, its technology stack,
runtime architecture, environment configuration, local development workflow,
database setup, deployment process, and troubleshooting steps.

## 1. Project overview

Crick Auction is a React single-page application for hosting multiplayer
cricket-player auctions. A host creates a room, players select franchises,
and the auction synchronizes budgets, bids, timers, chat, squad limits, and
player ownership.

The application supports two operating modes:

| Mode | Purpose | External services |
|---|---|---|
| Cloud | Multiplayer rooms shared over the internet | Firebase Realtime Database; Supabase is recommended for the directory and history |
| Offline / Hotspot | Local play and development fallback | Browser storage and the local auction engine; no cloud credentials required |

The player-facing flow uses a manager name instead of a mandatory account
login. Firebase Authentication remains available in the codebase for
deployments that want authenticated users and for protected administration.

## 2. Technology stack

### Frontend

| Technology | Role |
|---|---|
| React 19 | Component-based user interface |
| React DOM | Browser rendering |
| React Router 7 | Client-side routes such as `/lobby/:id` and `/auction/:id` |
| Vite 6 | Development server, module bundler, and production build |
| Tailwind CSS 4 | Utility-first styling and responsive layouts |
| Framer Motion | Page transitions and interface animation |
| Lucide React | Interface icons |
| canvas-confetti | Auction celebration effects |
| html-to-image | Exporting squad/auction visuals |

### Cloud and data services

| Technology | Role |
|---|---|
| Firebase Realtime Database | Live room state, bids, timers, participants, and chat |
| Firebase Authentication | Optional Google and anonymous authentication |
| Firebase Firestore | Supporting application/admin data |
| Supabase PostgreSQL | Public auction directory, teams, history, and fantasy data |
| Supabase JavaScript client | Browser access to Supabase through the publishable key |

### Tooling and scripts

| Tool | Role |
|---|---|
| Node.js and npm | Package installation and scripts |
| ESLint | JavaScript/JSX linting |
| Node test runner | Unit and business-logic tests |
| Firebase CLI | Deploying Firebase database and Firestore rules |
| Vercel | Hosting the Vite single-page application |

## 3. Application architecture

```text
Browser
  |
  +-- React application
  |     +-- Routes and pages
  |     +-- AuthContext
  |     +-- AuctionContext
  |     +-- Local auction engine
  |     +-- Bot bidding engine
  |     +-- Responsive UI components
  |
  +-- Firebase Realtime Database
  |     +-- Live auction room state
  |     +-- Bids, timers, teams, chat
  |
  +-- Supabase PostgreSQL
        +-- Auction directory
        +-- Teams and completed auction history
        +-- Fantasy configuration and squads
```

### Important source locations

| Path | Responsibility |
|---|---|
| `src/App.jsx` | Router and application providers |
| `src/pages/` | Landing, lobby, auction, summary, guide, legal, and admin pages |
| `src/components/` | Reusable visual components and modals |
| `src/contexts/AuthContext.jsx` | Authentication and local manager identity |
| `src/contexts/AuctionContext.jsx` | Cloud auction orchestration |
| `src/lib/localAuctionEngine.js` | Offline/hotspot auction behavior |
| `src/lib/firebase.js` | Firebase initialization and RTDB server selection |
| `src/lib/supabase.js` | Supabase client initialization |
| `src/lib/auctionServerDirectory.js` | Supabase auction directory operations |
| `src/lib/botEngine.js` | Automated franchise bidding |
| `src/data/players.js` | Player data |
| `src/data/teams.js` | Franchise data |
| `scripts/supabase_schema.sql` | Supabase tables and policies |
| `database.rules.json` | Firebase Realtime Database rules |
| `firestore.rules` | Firebase Firestore rules |
| `vercel.json` | Vercel SPA route rewrite |

## 4. Prerequisites

Install:

- Node.js 20 or newer
- npm
- A modern browser
- Git

Docker is not required. Firebase and Supabase are optional for offline mode,
but required for internet multiplayer and cloud persistence.

## 5. Install and run locally

From the project directory:

```powershell
cd "C:\Users\NagendraKumarIka\Downloads\ipl-auction-main\ipl-auction-main"
npm install
npm run dev -- --host
```

Open the local address printed by Vite:

```text
http://localhost:5173/
```

To open the app from another device on the same Wi-Fi, use the Vite network
address, for example:

```text
http://192.168.1.5:5173/
```

Keep the terminal running while using the app.

## 6. Environment variables

Create a local environment file:

```powershell
Copy-Item .env.example .env
```

The `.env` file is ignored by Git and must never be committed.

### Firebase variables

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
```

These values come from Firebase Console → Project settings → Your apps →
Web app.

### Supabase variables

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=...
```

Use the Supabase Project URL and the current publishable key from Project
Settings → API. Do not use a PostgreSQL connection string in the frontend.
Do not use a Supabase service-role key in `VITE_*` variables.

### Application administration

```env
VITE_ADMIN_EMAIL=admin@example.com
```

Set this to the administrator email allowed to access the protected admin
interface. This is only a frontend email gate and does not replace Firebase
security rules.

### Optional integrations

```env
VITE_GEMINI_API_KEY=...
VITE_AGORA_APP_ID=...
VITE_GIPHY_API_KEY=...
VITE_ADSENSE_CLIENT_ID=...
VITE_ADSENSE_LANDING_FOOTER_SLOT=...
CRICKET_API_KEY=...
```

Restart Vite after changing `.env` because environment variables are embedded
during startup/build.

## 7. Firebase setup

1. Create a Firebase project at <https://console.firebase.google.com>.
2. Register a Web App and copy its SDK configuration.
3. Enable Realtime Database.
4. Enable Google and/or Anonymous Authentication if those features are needed.
5. Add `localhost`, your LAN hostname/IP, and the Vercel hostname to
   Authentication → Settings → Authorized domains.
6. Put the Firebase values in `.env`.
7. Deploy the repository rules:

```powershell
npm install -g firebase-tools
firebase login
firebase use --add
firebase deploy --only database,firestore
```

The selected Firebase project must match the project ID in `.env`.

## 8. Supabase setup

1. Create or open the Supabase project.
2. Copy the Project URL and publishable key into `.env`.
3. Open Supabase SQL Editor.
4. Copy and run [`scripts/supabase_schema.sql`](./scripts/supabase_schema.sql).
5. Verify that `auctions`, `teams`, `user_squads`, and `fantasy_config` exist.
6. Confirm the policies match the intended security model before production.

The current schema is designed for the browser client and includes public
read/insert/update policies for auction gameplay. Review and tighten those
policies before exposing sensitive administrative data.

To verify the schema from the Supabase SQL Editor, run:

```sql
select table_schema, table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('auctions', 'teams', 'user_squads', 'fantasy_config')
order by table_name;
```

The result must contain all four tables. A request to `/rest/v1/` by itself
may return `401`; that endpoint is not a reliable application health check.
Test a known table instead, for example:

```text
https://your-project-ref.supabase.co/rest/v1/auctions?select=id&limit=1
```

Before the schema is applied, the expected response is PostgREST error
`PGRST205` stating that `public.auctions` cannot be found. After applying the
schema, the response should be HTTP 200 with an empty JSON array when no
auctions exist.

## 9. Run modes

### Name-based local play

Use **Enter Your Name & Play** and provide a manager name. This works without
Firebase credentials and uses the local auction engine when cloud servers are
not configured.

### Cloud multiplayer

Configure Firebase Realtime Database, use Cloud mode, and create a room. Share
the generated room URL or code with other players. Cloud mode requires valid
Firebase configuration and deployed RTDB rules.

### Hotspot/Wi-Fi play

Start Vite with `--host`, make sure players are on the same network, and use
Offline / Hotspot Mode. This is intended for local play and development.

## 10. Production build and validation

Run the standard checks:

```powershell
npm run lint
npm test
npm run build
```

Preview the production bundle:

```powershell
npm run preview -- --host
```

The automated suite currently covers auction display helpers, server
selection, room-code handling, and local auction lifecycle behavior.

## 11. Deploy to Vercel

1. Import `tdnk3101-spec/ipl` into Vercel.
2. Select the Vite framework preset.
3. Use:

```text
Build command: npm run build
Output directory: dist
```

4. Add the required `VITE_*` variables under Vercel Project Settings →
   Environment Variables. At minimum, add verified Firebase variables for
   cloud multiplayer and the Supabase URL plus publishable/anon key for
   persistence.
5. Add `VITE_ADMIN_EMAIL` if the admin interface is needed.
6. Select Production, Preview, and Development environments as appropriate.
7. Deploy or redeploy after saving variables.
8. Add the Vercel hostname to Firebase Authorized domains.

Vercel does not read your local `.env` file. Values must be entered in the
Vercel dashboard (or configured through the Vercel CLI), then a new deployment
must be created. Never commit `.env` to GitHub to make deployment work.

For a safe first deployment, configure only Firebase and Supabase variables
that have been copied and verified from their respective dashboards. Leave
optional integrations unset until their credentials are available. The
application still supports name-based offline play without cloud credentials.

[`vercel.json`](./vercel.json) rewrites client-side routes to `index.html`, so
refreshing `/lobby/ROOMCODE` or `/auction/ROOMCODE` works correctly.

## 12. Git workflow

```powershell
git status
git add .
git commit -m "Describe the change"
git push origin main
```

Before pushing, confirm that `.env` is ignored:

```powershell
git check-ignore .env
```

Never commit Firebase Admin credentials, Supabase service-role keys, database
passwords, or private API keys.

## 13. Troubleshooting

### Blank page

1. Open browser developer tools and inspect Console.
2. Check for invalid Firebase URLs or placeholder environment values.
3. Confirm `.env` exists in the project root.
4. Restart Vite.
5. Force refresh with `Ctrl + Shift + R`.

The application validates Firebase configuration and falls back to local mode
when credentials are missing or invalid.

### Google login unavailable

Google login requires valid Firebase Auth configuration and an enabled Google
provider. The normal player flow uses a manager name and does not require
Google login.

### Supabase 401 Unauthorized

First test `/auth/v1/settings` and a known table endpoint. If
`/auth/v1/settings` returns HTTP 200, the URL and publishable key are valid.
If the table endpoint returns `PGRST205`, the connection is working and only
the schema is missing; run `scripts/supabase_schema.sql` in the SQL Editor.
Only replace the key if `/auth/v1/settings` also returns 401. Do not use a
database connection string, password, or service-role key in the browser.
After changing `.env`, restart Vite and rebuild the Vercel deployment.

### Cloud auction server capacity error

Confirm that `VITE_FIREBASE_DATABASE_URL` is a valid Firebase RTDB URL and that
the database exists. Without a valid RTDB, switch to Offline / Hotspot Mode.

### Deep-link 404 on Vercel

Confirm that [`vercel.json`](./vercel.json) is present and that the deployment
was rebuilt after the file was pushed.

## 14. Project ownership and footer

The application footer identifies the project owner as:

```text
MR.NAGENDRA KUMAR
```

## 15. License

See [`LICENSE`](./LICENSE) for the project license.
