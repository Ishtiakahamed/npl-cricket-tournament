# NPL Cricket Tournament

A full-stack, mobile-responsive cricket tournament website with:

- **Public live scoreboard** — auto-updates ball-by-ball via Server-Sent Events (no page refresh).
- **Home / Fixtures / Points table / Teams & Squads / Venues** public pages.
- **Admin panel** — CRUD for teams, players, venues, groups, fixtures, and scorer accounts. Assign scorers to matches, edit toss, correct scores, abandon matches.
- **Scorer panel** — mobile-friendly ball-by-ball entry with big run buttons, extras (wide / no-ball / bye / leg-bye), wickets (with batter & type), undo, bowler changes, innings start/end, and short commentary.
- **ICC-style points table** with Net Run Rate (NRR).
- **Role-based auth** (Admin vs Scorer) via NextAuth (credentials).

## Tech stack

| Layer | Choice |
|---|---|
| Frontend + Backend | Next.js 14 (App Router, TypeScript) |
| Styling | Tailwind CSS |
| Database | SQLite (local) via Prisma — swap to Postgres by changing `DATABASE_URL` and `provider = "postgresql"` in `prisma/schema.prisma` |
| Auth | NextAuth.js (credentials + JWT sessions) |
| Realtime | In-process Pub/Sub + Server-Sent Events (`/api/live/[matchId]`) |
| Passwords | `bcryptjs` |

## Quick start (local development)

Requirements: **Node.js 20 or 22**, npm 10+.

```bash
# 1. Install deps
npm install

# 2. Set up env
cp .env.example .env
#    (optional) edit NEXTAUTH_SECRET to a long random string

# 3. Initialise DB and generate Prisma client
npx prisma migrate dev --name init

# 4. Seed demo data (teams, players, venues, fixtures, sample results + one live match)
npx prisma db seed

# 5. Start dev server
npm run dev
```

Open http://localhost:3000.

### Demo accounts

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `admin123` |
| Scorer | `scorer1` | `scorer123` |
| Scorer | `scorer2` | `scorer123` |

The seed creates **12 fixtures** across 8 teams in 2 groups:

- 6 completed matches (with populated 1st/2nd innings for points-table demo)
- 1 live match (RAJ vs RAN, `scorer1` assigned) with a partial innings already in progress
- 5 upcoming fixtures

## How to score a match (end-to-end)

1. **Admin:** go to `/admin/fixtures`, create a fixture, assign a **Scorer** and choose a **date/time**, **overs** and **venue**.
2. **Scorer** signs in at `/login`, sees the match under `/scorer`, and clicks in.
3. Record the **toss** (winner + bat/bowl decision).
4. **Start innings:** pick a batting XI (in batting order), bowling XI, striker, non-striker, and opening bowler. Click **Start innings**.
5. Score ball by ball:
   - Tap the **delivery type** (default: Legal).
   - Tap **0 / 1 / 2 / 3 / 4 / 6** to record runs.
   - Tap **WICKET** to open the wicket dialog (select out-batter, wicket type, new batter).
   - Tap **Wide / No Ball / Bye / Leg Bye** then a run number to record extras.
   - Tap **UNDO LAST BALL** to revert the last entry. Innings totals, scorecards, and strike rotation are recalculated from the event log.
   - Change bowler at the end of the over via **Change bowler**.
   - Add optional commentary text to any ball.
6. Innings ends automatically when: **10 wickets fall**, **overs exhausted**, or (in innings 2) **target reached**. You can also manually **End innings**.
7. After innings 1, click **Start innings** again to set the openers & bowler for innings 2.
8. When innings 2 ends, the match auto-completes with a generated result (e.g. "Dhaka Dynamos won by 5 wickets"). Points table updates immediately.

### Cricket rules implemented

- **Legal ball counting** — wide and no-ball are **not** legal; bye and leg-bye **are** legal. Penalty runs don't cost a ball.
- **Extras:** wide = 1 + additional wide runs; no-ball = 1 + any runs off the bat (attributed to batter).
- **Strike rotation** — odd runs swap strike, and strike swaps at end of over (XOR logic, so 1 off the last ball keeps strike).
- **Wicket types** — bowled, caught, LBW, run-out, stumped, hit-wicket, retired. Runs that completed *before* a run-out can still be recorded on the same delivery.
- **Over format** — displayed as `O.B` (e.g. `5.3` = 5 overs, 3 legal balls).
- **NRR** — runs/over scored minus runs/over conceded. If a team is bowled out under its full overs, its **full overs quota** is used as the divisor (ICC rule).
- **Points** — Win = 2, Tie = 1, No Result = 1, Loss = 0. Sorted by points, then NRR.

## Realtime updates

The public live scoreboard (`/match/[id]`) subscribes to a Server-Sent Events stream at `/api/live/[matchId]`. Whenever the scorer mutates state (ball, undo, innings change…), the server publishes an event to all connected clients which triggers `router.refresh()` (server-component refetch). Matches on the Home page also show live scores — those currently refresh on natural navigation.

The SSE bus is in-process (a `Map<matchId, Set<Listener>>` in `src/lib/events.ts`). This works for single-instance deploys (Fly.io, Railway, a single Node container, etc.). For multi-instance horizontal scaling, replace the bus with Redis Pub/Sub, Supabase Realtime, or similar.

## Project structure

```
src/
  app/
    page.tsx              Home page
    fixtures/page.tsx
    points/page.tsx
    teams/page.tsx
    venues/page.tsx
    match/[id]/page.tsx   Public live scoreboard
    login/page.tsx
    admin/                Admin panel (teams, players, venues, groups, fixtures, scorers)
    scorer/               Scorer panel (per-match console)
    api/
      auth/[...nextauth]  NextAuth route
      live/[matchId]      SSE live stream
      admin/*             Admin CRUD
      scorer/match/[id]/* Ball-by-ball scoring actions
  lib/
    prisma.ts             Prisma client
    auth.ts               NextAuth options + helpers
    scoring.ts            Core cricket scoring engine
    match-ops.ts          Higher-level match operations (start innings, add ball, undo, complete)
    points-table.ts       NRR + standings calculation
    events.ts             In-process SSE pub/sub
  components/
    Providers.tsx         Session provider
    LiveRefresher.tsx     Client SSE listener → router.refresh()
prisma/
  schema.prisma
  seed.ts                 Demo data generator
```

## Deployment

### Option 1 — Vercel / Netlify (Postgres)

SQLite doesn't work on serverless file systems. Use a hosted Postgres (Neon, Supabase, Railway, RDS).

1. In `prisma/schema.prisma`, change the datasource provider to `postgresql`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Set env vars on your provider:
   - `DATABASE_URL` — Postgres connection string
   - `NEXTAUTH_SECRET` — `openssl rand -base64 32`
   - `NEXTAUTH_URL` — e.g. `https://your-domain.com`
3. Add a build step that runs migrations: `npx prisma migrate deploy && next build`.
4. (Optional) Run the seed once after first deploy: `npx prisma db seed`.
5. Deploy.

> ⚠️ **SSE on serverless:** Vercel/Netlify do support SSE on their Node runtimes, but each invocation has a timeout (e.g. Vercel 300s for Pro). For robust realtime at scale, host on a long-lived Node environment (Fly.io, Railway, a VM) or swap the in-process bus for Supabase Realtime / Pusher / Ably.

### Option 2 — Fly.io / Railway / VPS (single instance)

SQLite is fine on a single-instance host with a mounted volume.

```bash
# Production-like run
NEXTAUTH_URL=https://your.domain \
NEXTAUTH_SECRET=$(openssl rand -base64 32) \
DATABASE_URL="file:./prod.db" \
npm run build && npm start
```

## Scripts

```bash
npm run dev      # dev server (http://localhost:3000)
npm run build    # production build
npm run start    # production server
npm run lint     # ESLint

npx prisma studio         # browse DB visually
npx prisma migrate dev    # create + apply a migration
npx prisma db seed        # run seed.ts
```

## License

MIT
