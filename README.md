# MedicoHub Mono-repo

Clean split into three sections:

- `user`: User-facing frontend (Vite + React). Deploy to GitHub Pages.
- `admin`: Admin frontend (Vite + React). Deploy wherever desired.
- `backend`: API server (Express + TypeScript). Deploy to Railway.

## Quick Start

```bash
npm --prefix user install
npm --prefix admin install
npm --prefix backend install
```

```bash
npm run dev:user
npm run dev:admin
npm run dev:backend
```

## Deploy

**Backend (Railway)**
- Build: `npm --prefix backend run build`
- Start: `npm --prefix backend run start`

**User Frontend (GitHub Pages)**
- Build: `npm --prefix user run build`
- The app uses `HashRouter` and `base: './'` in `user/vite.config.ts` for GitHub Pages.

**Admin Frontend**
- Build: `npm --prefix admin run build`
- Uses `base: './'` in `admin/vite.config.ts` so it can be hosted on GitHub Pages or any static host.
