<div align="center">

# MedicoHub

[![Node](https://img.shields.io/badge/node-20%2B-3c873a?style=flat-square)](https://nodejs.org)
[![Vite](https://img.shields.io/badge/vite-7-646cff?style=flat-square)](https://vitejs.dev)
[![Express](https://img.shields.io/badge/express-4-000000?style=flat-square)](https://expressjs.com)

Three apps in one repo: user frontend, admin frontend, and backend API.

</div>

## What Lives Where

- `user` - User-facing web app.
- `admin` - Admin web app.
- `backend` - Express API server.

## Auth Setup

Auth is now handled by `Auth.js` in the backend. Firebase auth is no longer used in source code.

The backend owns:

- Google sign-in
- Email/password sign-in
- JWT session cookies
- Email verification links
- Password reset links

The frontends just talk to the backend over HTTP and use cookies for sessions.

## Requirements

- Node.js 20+
- pnpm 9+
- MongoDB
- Google OAuth client credentials
- An email provider for verification and password reset mail

## Install

Run installs separately in each app folder:

```bash
pnpm --dir backend install
pnpm --dir user install
pnpm --dir admin install
```

If you are setting this up after the Auth.js migration, make sure the backend install includes:

```bash
pnpm --dir backend add @auth/core @auth/express
```

## Environment Files

Create these files:

- `backend/.env`
- `user/.env`
- `admin/.env`

Example templates are included at:

- `backend/.env.example`
- `user/.env.example`
- `admin/.env.example`

### `backend/.env`

Use this for Auth.js, MongoDB, Google OAuth, and email delivery.

```env
NODE_ENV=development
PORT=5000
API_URL=http://localhost:5000
MONGODB_URI=your-mongodb-connection-string
MAX_UPLOAD_SIZE_MB=25

BETTER_AUTH_SECRET=replace-with-a-long-random-secret

GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret

FRONTEND_URL=http://localhost:3000
ADMIN_FRONTEND_URL=http://localhost:5173

EMAIL_PROVIDER=resend
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=MedicoHub <no-reply@your-domain.com>

ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=strong-admin-password
ADMIN_SECRET=optional-admin-bypass-secret

PAYSTACK_SECRET_KEY=your-paystack-secret-key
IMAGEKIT_PUBLIC_KEY=your-imagekit-public-key
IMAGEKIT_PRIVATE_KEY=your-imagekit-private-key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your-imagekit-id
```

### `user/.env`

```env
VITE_API_URL=http://localhost:5000
VITE_GROQ_API_KEY=your-groq-api-key
VITE_PAYSTACK_PUBLIC_KEY=your-paystack-public-key
```

### `admin/.env`

```env
VITE_API_URL=http://localhost:5000
VITE_API_BASE_URL=http://localhost:5000
```

If you deploy to production, update the URLs to your live domains.

## Run Locally

Use three terminals, one for each app:

```bash
pnpm --dir backend run dev
pnpm --dir user run dev
pnpm --dir admin run dev
```

Default local ports:

- Backend: `http://localhost:5000`
- User app: `http://localhost:3000`
- Admin app: `http://localhost:5173`

## Build

```bash
pnpm --dir backend run build
pnpm --dir user run build
pnpm --dir admin run build
```

## Production Launch

### Backend

Build the server, then start the compiled app:

```bash
pnpm --dir backend run build
pnpm --dir backend run start
```

### User App

Build the Vite app and deploy the `dist` output to your static host:

```bash
pnpm --dir user run build
```

### Admin App

Build the Vite app and deploy the `dist` output to your static host:

```bash
pnpm --dir admin run build
```

## How Auth Works

- Login and signup go through the backend.
- Google sign-in redirects through Auth.js and stores a session cookie.
- The cookie is HTTP-only, so the browser keeps the session without storing tokens in localStorage.
- Password reset and email verification are handled by backend routes that send links with signed tokens.

## Common Setup Notes

- Put the backend `.env` in `backend/.env`.
- Put the user app `.env` in `user/.env`.
- Put the admin app `.env` in `admin/.env`.
- Restart the dev server after changing any `.env` file.
- Keep `AUTH_SECRET` and `NEXTAUTH_SECRET` identical.
- Set your Google OAuth redirect URL to the backend Auth.js callback path for your deployment domain.

## Troubleshooting

### Session does not persist

- Check that the backend and frontend URLs match your local or deployed domain.
- Make sure the browser is accepting cookies.
- Confirm `AUTH_SECRET` is set and unchanged between restarts.

### Google login fails

- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
- Make sure your Google OAuth app allows the correct callback URL.

### Password reset or verification email does not arrive

- Check `RESEND_API_KEY` and `EMAIL_FROM`.
- Confirm your backend email service is configured for the provider you selected.

### App loads but API calls fail

- Confirm `VITE_API_URL` points to the backend.
- Make sure the backend is running before opening the frontends.

## Notes

- This repo is a monorepo, but each app is run independently.
- The backend now owns authentication state.
- Firebase auth has been removed from the codebase.
