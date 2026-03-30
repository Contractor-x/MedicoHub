# Medico V3 Development Guide

This project has been restructured to follow the "Modular Monolith" architecture plan.

## Structure

1.  **Frontend (User)**: Root directory. The existing React app.
2.  **Backend (Monolith)**: `backend/` directory. Express.js app serving User and Admin APIs.
3.  **Frontend (Admin)**: `admin-panel/` directory. New React app for Admin Dashboard.

## How to Run

### 1. Frontend (User)
```bash
npm run dev
```
Runs at `http://localhost:3000` (or similar).

### 2. Backend (API)
**Requires a new terminal:**
```bash
cd backend
npm install
npm run dev
```
Runs at `http://localhost:5000`.
Swagger Documentation: `http://localhost:5000/api-docs`.

### 3. Frontend (Admin)
**Requires a new terminal:**
```bash
cd admin-panel
npm install
npm run dev
```
Runs at `http://localhost:5173` (default Vite port).

## Setup
- **Environment Variables**:
    - The root `.env` configures the User Frontend.
    - Create `backend/.env` for the Backend (Database credentials, Firebase Admin Service Account).
    - Create `admin-panel/.env` for Admin Frontend.

## Features Added
- **React Query**: Installed in Frontend User for better data fetching.
- **Email Verification**: Added banner in Frontend User to prompt verification.
- **Swagger UI**: Integrated in Backend for API testing.
