# Testing the NPL Cricket auth + login menu

This app uses **Next.js 14 + Prisma + NextAuth (credentials)** with role-based redirects (`ADMIN` → `/admin`, `SCORER` → `/scorer`). Tests usually focus on the header `LoginMenu` (`src/components/LoginMenu.tsx`), the role-aware `/login` page (`src/app/login/page.tsx`), and the protected `/admin` and `/scorer` layouts.

## Local setup (one-shot)

```bash
cd ~/repos/npl-cricket-tournament
npm install
npx prisma migrate reset --force   # rebuilds SQLite DB and runs prisma/seed.ts
npm run dev                        # serves on http://localhost:3000
```

`prisma migrate reset --force` is the fastest way to guarantee the seed re-runs (`prisma db seed` alone may skip if already applied). The seed prints the demo credentials at the end — sanity check that they match the spec before testing.

No external services needed for local testing — the project ships with SQLite for dev. Production swaps in Postgres via `DATABASE_URL` (see `NETLIFY_DEPLOY.md`).

## Demo credentials (current spec)

- Admin: `admin@npl.com` / `Admin@12345`
- Scorer: `scorer@npl.com` / `Scorer@12345`
- Second scorer (assigned to a different match): `scorer2@npl.com` / `Scorer@12345`

If future PRs change credentials, update both `prisma/seed.ts` and `src/app/login/page.tsx` (the `DEMO_CREDENTIALS` constant) — they are the two sources of truth surfaced to the user.

## Test the login menu (UI)

Key selectors / strings to assert against (these are stable identifiers, not styling):

| Surface | Assertable element |
|---|---|
| Header button (unauthenticated) | `<button aria-label="Login menu">Login</button>` |
| Dropdown items | `<a href="/login?role=admin">Admin Login</a>`, `<a href="/login?role=scorer">Scorer Login</a>` |
| `/login?role=admin` heading | "Admin sign in" |
| `/login?role=scorer` heading | "Scorer sign in" |
| Auto-fill button | text "Auto-fill demo credentials" |
| Submit buttons | "Sign in as Admin" / "Sign in as Scorer" |
| Failure | text "Invalid username or password" stays on `/login?role=...` |
| Admin sidebar (proves real ADMIN session) | nav link "Teams & Players" (only rendered behind `requireRole("ADMIN")`) |
| Scorer page heading | "Scorer" |
| Authenticated header | text "Admin: admin@npl.com" or "Scorer: scorer@npl.com" |

## Adversarial design tip

Always include a **negative** test (e.g. submit the previous credentials `admin / admin123`) — this is what catches a regressed seed. A login flow that only tests the happy path will silently pass even if seed.ts was reverted.

## Mobile vs desktop

The header `LoginMenu` is rendered desktop-only (`hidden sm:inline-flex` wrapper in `layout.tsx`); on mobile the same admin/scorer split lives inside `MobileNav.tsx` under a hamburger menu. If testing mobile, switch the viewport to ~390px and use the hamburger drawer.

## Recording / browser tooling notes

At the time of writing, `recording_start` returned "No registry found" — fall back to per-step screenshots stored under `~/screenshots/` and reference them from the test report. The browser action `record_start` is **not** valid (the help text references it but it is rejected). If you need a video, prefer Playwright via the CDP endpoint at `http://localhost:29229` and write the run to a file.

## Devin secrets needed

None for local testing. For production parity testing you would need:

- `DATABASE_URL` — Postgres connection string
- `NEXTAUTH_SECRET` — any 32+ char random string
- `NEXTAUTH_URL` — the deployed origin
