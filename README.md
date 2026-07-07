# Archiviio

Next.js 16 app with Archiviio design system (Tailwind 4, App Router, TypeScript) and Supabase (auth, database, storage).

## Local setup

```bash
cp .env.local.example .env.local
npm install
npm run db:migrate
npm run test:supabase
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

Use `.env.local.example` as reference.

Required for app runtime:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL` (required in Vercel/production, optional locally)

Optional for DB scripts:

- `SUPABASE_DB_PASSWORD` (or `DATABASE_URL`)
- `SUPABASE_DB_REGION`

Optional for uploads:

- `NEXT_PUBLIC_DOCUMENT_MAX_FILE_SIZE_MB`

Required for team invitations (server-only):

- `SUPABASE_SERVICE_ROLE_KEY` — Supabase Dashboard → Project Settings → API → `service_role` key. Add to `.env.local` locally and to Vercel environment variables in production. Never use a `NEXT_PUBLIC_` prefix.

Optional for automatic invitation emails (use SMTP or Resend):

- `SMTP_HOST` — e.g. `smtps.aruba.it`
- `SMTP_PORT` — e.g. `465`
- `SMTP_USER` — full email address (e.g. `info@tuodominio.it`)
- `SMTP_PASS` — mailbox password
- `SMTP_FROM` — sender header (e.g. `Archiviio <info@tuodominio.it>`)
- `SMTP_SECURE` — `true` for port 465 (optional; defaults to true on port 465)
- `RESEND_API_KEY` — alternative to SMTP
- `RESEND_FROM_EMAIL` — verified Resend sender

Production URL for invite links:

- `NEXT_PUBLIC_SITE_URL` — e.g. `https://archiviio.vercel.app` (set on Vercel)

## Team invitations

When you invite someone from **Settings → Team**, the app saves the invitation and sends a link to `/invite/{token}`.

Your colleague opens that page, sees **“Unisciti allo spazio di {workspace}”**, enters the invited email and a password, then clicks **Entra** to join your shared workspace.

1. Apply migrations: `npm run db:migrate` (includes invitation token migrations).
2. Set `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` (and in Vercel for production).
3. Set `NEXT_PUBLIC_SITE_URL` to your Vercel URL so invite links point to production.
4. For automatic emails, add the **same Aruba SMTP credentials** used in Supabase to Vercel env vars (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`).
5. If email is not configured, the invite link is shown in the UI so you can share it manually.

## Supabase auth redirects (local + production)

In Supabase Dashboard, go to **Authentication → URL configuration** and set:

- **Site URL**: your live domain (for example `https://your-app.vercel.app`)
- **Additional Redirect URLs**:
  - `http://localhost:3000/auth/callback`
  - `http://127.0.0.1:3000/auth/callback`
  - `https://your-app.vercel.app/auth/callback`
  - `https://your-custom-domain.com/auth/callback` (if configured)

The signup flow uses `emailRedirectTo` and sends users to `${NEXT_PUBLIC_SITE_URL}/auth/callback` in production.

## Deploy to Vercel

1. Push project to GitHub.
2. In Vercel: **Add New → Project → Import Git Repository**.
3. Keep default framework (`Next.js`) and build command (`npm run build`).
4. In **Environment Variables** set at least:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` = your production URL (for example `https://archiviio.vercel.app`)
   - `SUPABASE_SERVICE_ROLE_KEY` = service role key
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` = Aruba SMTP (same as Supabase Auth SMTP)
5. Deploy.
6. After first deploy, add final production callback URLs in Supabase (see section above).

## Build check

```bash
npm run build
```

Build must complete without errors before deploying.

## Database notes

- Migrations: `supabase/migrations/`
- Full schema bundle: `npm run db:schema-bundle` -> `supabase/full_schema.sql`
- Local Supabase: `npm run db:local` then `npm run env:local`
