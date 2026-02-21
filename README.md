## BAPF Customer Portal

This repository contains the BAPF Customer Portal — a Next.js 16 application (React 19, TypeScript) for customers to view policies, renewals and manage their profile.

## Quick start (local)

1. Install dependencies

```bash
npm ci
```

2. Start development server (runs on port 3001)

```bash
npm run dev
```

Open http://localhost:3001 in your browser.

## Environment variables

Create a `.env.local` in the project root with the following (development) variables. DO NOT commit this file.

- Client (public) Firebase config (required for client auth and Firestore reads):
  - `NEXT_PUBLIC_FIREBASE_API_KEY`
  - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
  - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
  - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
  - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
  - `NEXT_PUBLIC_FIREBASE_APP_ID`

- Server (admin) Firebase credentials (required for server API routes):
  - `FIREBASE_ADMIN_PROJECT_ID`
  - `FIREBASE_ADMIN_CLIENT_EMAIL`
  - `FIREBASE_ADMIN_PRIVATE_KEY` (multiline private key — preserve newlines or use `\\n` sequences)

- Optional (email delivery)
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`

The project already replaces `\\n` with `\n` when loading `FIREBASE_ADMIN_PRIVATE_KEY` in `src/lib/firebase/admin.ts`.

## Build & deploy

Build locally:

```bash
npm run build
```

This project is configured to deploy on Vercel. Recommended Vercel settings when importing the repository:

- Framework preset: **Next.js**
- Install command: `npm ci`
- Build command: `npm run build`
- Environment variables: add the same variables listed above (client variables should be prefixed with `NEXT_PUBLIC_` — admin variables must NOT be prefixed)

For multi-line service account keys, add the private key through the Vercel dashboard (it supports newlines) or encode the service account as base64 and decode on the server.

### Vercel CLI (optional)

Install and link the project:

```bash
npm i -g vercel
vercel login
vercel --prod
```

To add env vars via CLI:

```bash
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY production
```

For long multiline secrets use the Vercel web UI.

## Notes and gotchas

- Keep admin credentials server-side only — never prefix them with `NEXT_PUBLIC_`.
- Serverless function cold starts are normal on Vercel; your `src/lib/firebase/admin.ts` caches the initialized admin app which mitigates repeated initialization.
- If you rely on long-running background tasks, consider moving heavy work off serverless functions.
- Dev server runs on port `3001` by default (`npm run dev`). Vercel will ignore the port and handle routing automatically.

## Useful scripts

- `npm run dev` — local development
- `npm run build` — build for production
- `npm start` — start production server (after build)
- `npm run lint` — run ESLint

## Contributing / push to GitHub

1. Initialize git (if not already):

```bash
git init
git add .
git commit -m "Initial commit"
```

2. Create a GitHub repo and push:

```bash
git remote add origin git@github.com:YOUR_ORG/YOUR_REPO.git
git branch -M main
git push -u origin main
```

After pushing, import the repo in Vercel and configure environment variables.

---
If you want, I can: add a `vercel.json` with a caching policy and recommended headers, or update `package.json` to pin a Node engine. Which would you like next?
