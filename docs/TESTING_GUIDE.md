
# Medico V3 - Testing Guide

Follow these steps to test all the new systems implemented.

## 1. Prerequisites (Check these are running)
Ensure you have 3 separate terminals running:
1.  **User Frontend**: `npm run dev` (Root folder) -> `http://localhost:3000` (or `3333`)
2.  **Backend API**: `npm run dev` (Backend folder) -> `http://localhost:5000`
3.  **Admin Panel**: `npm run dev` (Admin Panel folder) -> `http://localhost:5173`

---

## 2. Test User Frontend & System Fixes
**Goal:** Verify Login, Email Banner, and MCAMP Dashboard.
1.  Open `http://localhost:3333`.
2.  **Login**: Use an existing account (or create one).
    *   *Verification*: You should be redirected to the Dashboard.
3.  **Email Banner**:
    *   If your email is not verified in Firebase, you will see a **Yellow Warning Banner**.
    *   Click "Send Verification Email".

---

## 3. Test MCAMP Dashboard (Refactored)
**Goal:** Verify the exclusive 90-Day Challenge logic.
1.  **Navigate**: Go to the sidebar and click **"Study"** (or navigate to `#/mcamp`).
2.  **Enrollment Flow**:
    *   If you see the "Landing Page" (Distinction Masterclass), click **Enroll Now**.
    *   **Payment**: Click through the mock payment screens (Pay with Card).
    *   **Form**: Fill out your Medical School details (e.g., "UNILAG") and submit.
3.  **Dashboard View**:
    *   You should now see the **Dark Mode Dashboard**.
    *   **Timer**: Check the "Day 1 / 90" counter.
    *   **Weeks**: Verify that Week 1 is unlocked and Week 2 is locked.
4.  **Quiz Engine**:
    *   Click **"Start Quiz"** on the right side card.
    *   Complete the 5-question mock quiz.
    *   Upon completion, verify you see the "Submitted" success modal.

---

## 4. Test Admin Resource Management
**Goal:** Verify Admin can create resources that appear in the app.
1.  Open Admin Panel: `http://localhost:5173/`.
2.  **Login**:
    *   Email: `medicohub2024@gmail.com` (Pre-filled)
    *   Password: `Admin@2025` (Pre-filled)
    *   **Click Sign In**: If the account doesn't exist, it will accept this password and create it. If it does exist but the password is wrong, it will warn you.
3.  **Navigate**: Click **"Resources"** in the sidebar.
4.  **Create**:
    *   Click **"Add Resource"**.
    *   Fill in details: 
        *   Title: "Test MCAMP Video"
        *   Type: "Video"
        *   Tags: "MCAMP, Week 1"
        *   **Check "MCAMP Only"**.
    *   Click **Publish**.
5.  **Verify**:
    *   The resource should appear in the Admin Table immediately.
6.  **Check User App**:
    *   Go back to the User Frontend (`#/mcamp`).
    *   Reload. The new "Test MCAMP Video" should (ideally) appear in the list if the tagging matches the fetch logic.

---

## 5. Test Profile & Account Deletion
**Goal:** Verify Profile Persistence and Delete Confirmation.
1.  **Navigate**: Go to `#/profile`.
2.  **Edit**: Change your "Current Academic Year" or add a "Focus Area".
3.  **Save**: Click "Save Changes". Reload to verify persistence.
4.  **Delete Account**:
    *   Click **"Delete Account"** at the bottom.
    *   **Modal**: verify the Red Warning Modal appears.
    *   Click "Cancel" (unless you want to actually delete the user!).

---

## 6. Backend API & Swagger
**Goal:** Verify the API is running and documented.
1.  Open `http://localhost:5000/api-docs`.
2.  Explore the `POST /api/v3/resources` and `GET /api/v3/resources` endpoints.
