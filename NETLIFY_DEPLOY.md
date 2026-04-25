# Deploying NPL Cricket Tournament to Netlify

Netlify runs your Next.js app on serverless functions. The bundled SQLite DB **will not work in production** because each function call gets a fresh, read-only file system. You'll use a hosted Postgres instead. The free tiers are fine for this app.

---

## 1. Provision a Postgres database

Pick one of (free, ~2 minutes each):

- **Neon** — https://neon.tech → New Project → copy the *pooled* connection string ending in `?sslmode=require`.
- **Supabase** — https://supabase.com → New Project → Settings → Database → use the **Connection pooling** URI (port 6543).
- **Railway** — https://railway.app → New → Database → PostgreSQL → copy `DATABASE_URL`.

Save the connection string — you'll paste it into Netlify in step 4.

---

## 2. Switch Prisma from SQLite to Postgres

Edit `prisma/schema.prisma` and change the datasource block:

```diff
 datasource db {
-  provider = "sqlite"
+  provider = "postgresql"
   url      = env("DATABASE_URL")
 }
```

Then delete the existing migrations (they were generated for SQLite) and create a fresh one against your Postgres URL:

```bash
rm -rf prisma/migrations
DATABASE_URL="<your postgres url>" npx prisma migrate dev --name init
```

Commit the new `prisma/migrations/` folder.

> If you'd rather skip generating a fresh migration locally, you can also use `prisma db push` once on the live DB, but a real migration is cleaner for production.

---

## 3. Push the project to GitHub / GitLab / Bitbucket

Netlify deploys from a Git repo. Either use the existing one (`Ishtiakahamed/npl-cricket-tournament`) or create a new one and push.

---

## 4. Connect to Netlify

1. Go to https://app.netlify.com → **Add new site** → **Import from Git**.
2. Pick your repo and the branch you want to deploy from.
3. Netlify auto-detects Next.js. The `netlify.toml` shipped with this project sets:
   - **Build command**: `npx prisma generate && npx prisma migrate deploy && npm run build`
   - **Publish directory**: `.next`
   - Plugin: `@netlify/plugin-nextjs`

   You can leave these as-is.
4. **Environment variables** — add these on the "Configure project" screen (or later under *Site settings → Environment variables*):

   | Key | Value |
   |---|---|
   | `DATABASE_URL` | the Postgres URL from step 1 |
   | `NEXTAUTH_SECRET` | output of `openssl rand -base64 32` |
   | `NEXTAUTH_URL` | `https://<your-site>.netlify.app` (update once you know your subdomain) |

5. Click **Deploy site**. First build takes ~2–3 minutes.

---

## 5. Seed demo data on the live DB (one-time)

After the first successful deploy, the schema is on Postgres but it's empty. Run the seed locally **against your live DB**:

```bash
DATABASE_URL="<your postgres url>" npx prisma db seed
```

This creates 8 teams, 4 venues, 12 fixtures (6 completed, 1 LIVE, 5 upcoming), the admin account (`admin@npl.com / Admin@12345`) and two scorer accounts (`scorer@npl.com` and `scorer2@npl.com`, both with password `Scorer@12345`). **Change the demo passwords from the admin panel before going public.**

---

## 6. Verify

- Open `https://<your-site>.netlify.app` — you should see the home page with live + upcoming + recent matches.
- Sign in at `/login?role=admin` as `admin@npl.com / Admin@12345`.
- Go to `/admin/scorers` and immediately rotate the demo passwords.
- Open the LIVE match's public page in one tab and `/scorer/match/<id>` in another (signed in as the assigned scorer) and confirm SSE updates flow through.

---

## Caveats on serverless realtime

The realtime layer uses an in-process Server-Sent Events bus (`src/lib/events.ts`). On Netlify Functions that means:

- **Heartbeats / connection lifetime**: Netlify Functions have a max execution time (10s on free, 26s on Pro, 15min on Background Functions). The SSE response is wrapped to send a heartbeat every 25s, so on free-tier the connection will reset frequently — the browser auto-reconnects, so updates still flow but with brief gaps.
- **Multi-instance broadcasting**: each function invocation has its own memory, so a publish from one function won't reach subscribers attached to a different function. For one or two concurrent viewers this is usually invisible, but for production-grade fan-out swap the bus for **Supabase Realtime** / **Pusher** / **Ably** / **Redis pub-sub** (all drop-in replacements for `src/lib/events.ts`).

If you expect more than a handful of concurrent viewers on the live page, consider deploying to a long-lived Node host instead — **Fly.io**, **Railway**, or a small VPS — where SSE just works and a single SQLite file is even sufficient.

---

## Common gotchas

- **`PrismaClientInitializationError: Can't reach database server`** at build time → `DATABASE_URL` env var isn't set on Netlify, or the connection string is the wrong (un-pooled) variant. Use the pooled URL.
- **`NEXTAUTH_URL` mismatch** → after Netlify gives you a final domain, update `NEXTAUTH_URL` and redeploy.
- **Login redirects fail** → ensure cookies are sent over HTTPS only on production (NextAuth handles this automatically when `NEXTAUTH_URL` is `https://`).
- **Old SQLite dev DB committed** → delete any `prisma/dev.db*` files before pushing; they're already in `.gitignore`.
