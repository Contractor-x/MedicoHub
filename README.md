<div align="center">

# MedicoHub 

[![Node](https://img.shields.io/badge/node-20%2B-3c873a?style=flat-square)](https://nodejs.org)
[![Vite](https://img.shields.io/badge/vite-7-646cff?style=flat-square)](https://vitejs.dev)
[![Express](https://img.shields.io/badge/express-4-000000?style=flat-square)](https://expressjs.com)

One repository, three apps: user frontend, admin frontend, backend API.

</div>

## What This Repo Contains

- `user` — User-facing web app (Vite + React)
- `admin` — Admin web app (Vite + React)
- `backend` — API server (Express + TypeScript)

## Architecture

```text
Browser
  ├─ User App (Vite + React)  ───────────────┐
  ├─ Admin App (Vite + React) ───────────┐   │
  │                                      │   │
  │   GitHub Pages (static hosting)      │   │
  │                                      │   │
  └──────────────────────────────────────┘   │
                                             │
                         API requests        │
                                             ▼
                    Backend (Express + TS)
                              │
                              ▼
                  MongoDB, Firebase, ImageKit
```

<div align="center">

If you are new to monorepos, read this: each folder is its own app.
You run them separately, and they talk to the backend over HTTP.

</div>

## Requirements

- Node.js 20+
- pnpm 9+

## Install

```bash
pnpm --dir user install
pnpm --dir admin install
pnpm --dir backend install
```

## Run Locally

```bash
pnpm --dir user run dev
pnpm --dir admin run dev
pnpm --dir backend run dev
```

- User app runs on `http://localhost:3000`
- Admin app runs on `http://localhost:5173`
- Backend runs on `http://localhost:5000`

Backend health check:

```bash
curl http://localhost:5000/health
```

## Build

```bash
pnpm --dir user run build
pnpm --dir admin run build
pnpm --dir backend run build
```

## Deployment

### Backend (Railway)

```bash
pnpm --dir backend run build
pnpm --dir backend run start
```

### User (GitHub Pages)

```bash
pnpm --dir user run build
```

### Admin (GitHub Pages)

```bash
pnpm --dir admin run build
```

## Environment

Both frontends use Vite env variables (prefix `VITE_`). Create these in:

- `user/.env`
- `admin/.env`

Common variables:

```
VITE_API_URL=...
VITE_API_BASE_URL=...
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
VITE_GROQ_API_KEY=...
VITE_PAYSTACK_PUBLIC_KEY=...
VITE_ENABLE_DEMO_BYPASS=true
```

## Common Errors and Fixes

### Firebase: Error (auth/invalid-api-key)

Cause: The app did not load your `.env` or the key is wrong.

Fix:

- Confirm the file is `user/.env` or `admin/.env`
- Restart the dev server after changing envs
- Verify the Firebase key from Firebase Console

### Blank page with no UI

Cause: React crashed before rendering.

Fix:

- Open DevTools Console and look for errors
- Common culprit is multiple React versions
- Run a clean install with pnpm and check `pnpm list react`

### No routes matched location `/MedicoHub/admin/`

Cause: Admin routing without the correct base.

Fix:

- Admin uses `BrowserRouter` with `basename="/MedicoHub/admin"`
- Rebuild and redeploy admin

### GitHub Pages shows README instead of the app

Cause: Pages is serving `main` branch, not `gh-pages`.

Fix:

- Settings → Pages → Source → Deploy from a branch
- Branch: `gh-pages`
- Folder: `/ (root)`

### GitHub Pages shows MIME type error for `/src/index.tsx`

Cause: Pages is serving source files, not the build output.

Fix:

- Serve the `gh-pages` branch as above
- Ensure the workflow publishes `user/dist` to `gh-pages` root

## Debugging Tips

- Always check the browser Console first
- Check the Network tab for failed API calls
- Verify the backend is reachable: `curl http://localhost:5000/health`
- Verify the API base URL in the console logs
- If something changes, restart the dev server

## Notes

- This repo is structured as a monorepo, but each app runs independently.
- When in doubt, run each app in its own terminal window.
