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

Required for team invitation emails (server-only):

- `SUPABASE_SERVICE_ROLE_KEY` — Supabase Dashboard → Project Settings → API → `service_role` key. Add to `.env.local` locally and to Vercel environment variables in production. Never use a `NEXT_PUBLIC_` prefix.

## Team invitation emails

When you invite someone from **Settings → Team**, the app saves the invitation and sends an email via Supabase Auth (`inviteUserByEmail`).

1. Set `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` (and in Vercel for production).
2. In Supabase Dashboard → **Authentication → URL configuration**, add your callback URL(s) (see section below).
3. For reliable delivery in production, configure **Authentication → SMTP** (Resend, SendGrid, Google Workspace, etc.). Without custom SMTP, Supabase sends from its default address with rate limits; messages may land in spam.
4. Local dev: run `npm run db:local` and `npm run env:local`, then open **Mailpit** at [http://127.0.0.1:54324](http://127.0.0.1:54324) to see test invitation emails.

If `SUPABASE_SERVICE_ROLE_KEY` is missing, the invite is still saved in the database but no email is sent (toast: “Invitation saved” instead of “Invitation sent”).

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
   - `NEXT_PUBLIC_SITE_URL` = your production URL (for example `https://your-app.vercel.app`)
   - `SUPABASE_SERVICE_ROLE_KEY` = service role key (for invitation emails)
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
