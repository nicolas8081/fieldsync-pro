# How to run FieldSync Pro (end to end)

This project has a **FastAPI backend** (talks to **Supabase**), an **Expo / React Native mobile app**, and optional **local ML assets** for diagnosis. Follow the steps in order the first time you set up a machine.

---

## 0. Prerequisites

- **Node.js** 18+ and **npm** (or yarn/pnpm).
- **Python** 3.10+.
- A **Supabase** project (free tier is fine).
- For iOS simulator: **Xcode**. For Android: **Android Studio** / emulator. For a **physical phone**: your computer and phone on the **same Wi‑Fi** (you will use the computer’s **LAN IP**, not `localhost`, in the mobile app).

---

## 1. Supabase: database tables

1. Open the [Supabase Dashboard](https://supabase.com/dashboard) → your project → **SQL Editor**.
2. Open the file **`backend/sql/schema.sql`** in this repo, copy its full contents, paste into the SQL editor, and **Run** once.
3. Confirm tables exist: **Table Editor** should show at least **`customers`**, **`technicians`**, **`tickets`**, **`ticket_messages`**.  
   (The diagnosis feature also expects existing training-related tables such as **`common_issues`** if you use `/api/diagnose` and `/health` as wired today.)

---

## 2. Supabase: API keys for the backend

1. In Supabase: **Project Settings** → **API**.
2. Copy **Project URL** → this is `SUPABASE_URL`.
3. Copy the **`service_role`** **secret** key (Dashboard → **Project Settings** → **API**). Put it in **`SUPABASE_KEY`** for the Python backend only. **Do not use the `anon` / public key here** — RLS will block inserts (e.g. creating technicians) and you will see `42501` / row-level security errors. Never put `service_role` in the Expo app.

---

## 3. Backend environment and dependencies

1. In a terminal:

   ```bash
   cd backend
   python3 -m venv .venv
   source .venv/bin/activate    # Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. Create **`backend/.env`** (do not commit real secrets to git):

   ```env
   SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   SUPABASE_KEY=your_service_role_or_backend_key
   ```

3. **Optional — admin API protection**  
   If you set:

   ```env
   ADMIN_API_KEY=some-long-random-string
   ```

   then every **`/admin/*`** request must send header **`X-Admin-Key: some-long-random-string`**.  
   If `ADMIN_API_KEY` is **unset**, admin routes stay open (fine for **local dev only**).

4. Start the API:

   ```bash
   cd backend
   source .venv/bin/activate
   python main.py
   ```

   Default URL: **`http://0.0.0.0:8000`** (same machine: **`http://localhost:8000`**).

5. Quick checks in a browser or curl:
   - **`http://localhost:8000/`** — API metadata.
   - **`http://localhost:8000/docs`** — Swagger UI for all routes.
   - **`http://localhost:8000/health`** — should report healthy if Supabase + expected tables respond.

---

## 4. Seed data you need for a full demo

Do this via **Swagger** (`/docs`) or any HTTP client.

1. **Create a technician** (needed for technician login and job assignment):

   - **`POST /admin/technicians`**  
     Body (JSON): `email`, `full_name`, `password` (min 8 chars), optional `phone`.  
     If `ADMIN_API_KEY` is set: in **`/docs`** click **Authorize** (lock icon), choose **AdminApiKey**, paste the same value as `ADMIN_API_KEY` in `backend/.env`, then **Authorize** — Swagger sends **`X-Admin-Key`** on admin requests. You can also type the header in **Try it out** if it appears there. (Avoid stray spaces in `.env`; values are compared trimmed.)

2. **Optional — verify lists**:
   - **`GET /admin/technicians`**
   - After customers/tickets exist: **`GET /admin/tickets?scope=all`**

All customer/ticket/message rows created from the **mobile app** will appear in Supabase **Table Editor** for `customers`, `tickets`, and `ticket_messages`.

---

## 5. Mobile app (Expo)

1. Install dependencies:

   ```bash
   cd mobile
   npm install
   ```

2. Configure the API base URL the app will call:
   - Copy **`mobile/.env.example`** to **`mobile/.env`**.
   - Set **`EXPO_PUBLIC_API_URL`**:
     - **Simulator on the same Mac as the backend:**  
       `http://localhost:8000`
     - **Physical device:**  
       `http://YOUR_COMPUTER_LAN_IP:8000`  
       (example: `http://192.168.1.12:8000` — find IP in macOS **System Settings → Network**, or `ipconfig` on Windows.)

3. If the backend has **`ADMIN_API_KEY`** set, set in **`mobile/.env`**:

   ```env
   EXPO_PUBLIC_ADMIN_API_KEY=the_same_value_as_ADMIN_API_KEY
   ```

4. Start Expo:

   ```bash
   cd mobile
   npm start
   ```

5. **Open the actual UI** (Expo only starts Metro; it does not open a window by itself):
   - Press **`w`** — runs the app in your **web browser** (quickest check).
   - Press **`i`** / **`a`** — iOS / Android **simulator** (requires Xcode / Android Studio).
   - Or scan the **QR code** with **Expo Go** on a **phone** (same Wi‑Fi; set `EXPO_PUBLIC_API_URL` to your computer’s LAN IP, not `localhost`).

   The line **“Web is waiting on http://localhost:8081”** is the **dev tools / Metro** page, not the FieldSync screens — use **`w`** for the real app in the browser.

   **If Expo Go stays on “Opening project”:** the phone usually **cannot reach** the URL in the QR code (wrong network, VPN, or Metro bound to an address like `10.0.2.163` that only works on an Android emulator). Try, in order: **`npm run start:web`** to confirm the app loads in a browser; **`npm run start:lan`** then scan again on the same Wi‑Fi; **`npm run start:tunnel`** (slower but works across networks). **`npm run start:clear`** clears Metro cache if the bundle is stuck building.

   **Expo Web + API on localhost:** in **`mobile/.env`** use `EXPO_PUBLIC_API_URL=http://localhost:8000` (same machine as the browser). Restart Expo after changing `.env`. If the UI loads but **“Network request failed”** or no Supabase rows appear, restart the backend after pulling the latest code — CORS was fixed so browsers are not blocked on `allow_origins: *` + credentials.

6. **Sign-in tips (connected mode)**  
   - **Customer:** any email; after the first **Report problem** ticket, the app stores your Supabase **customer id**. Data shows under **My tickets** and in Supabase.  
   - **Admin:** use email/name as you like; if `EXPO_PUBLIC_ADMIN_API_KEY` is required, it must match the backend.  
   - **Technician:** use the **exact email + password** you created with **`POST /admin/technicians`**.

---

## 6. Typical “everything running” checklist

| Step | What “good” looks like |
|------|-------------------------|
| Backend terminal | Uvicorn running, no crash on startup. |
| `/docs` | Opens, lists routes. |
| Supabase | Tables from `schema.sql` exist; rows appear when you use the app. |
| Mobile `.env` | `EXPO_PUBLIC_API_URL` points to a host the **phone/emulator** can reach. |
| Customer flow | Submit ticket → new row in **`tickets`** / **`customers`**. |
| Admin flow | See tickets, assign tech, reply → updates in Supabase. |
| Technician flow | Jobs and stats load; status changes / unassign hit **`/technician/*`**. |

---

## 7. Common problems

- **`new row violates row-level security policy` (Postgres `42501`)**  
  Your `SUPABASE_KEY` is almost certainly the **`anon`** key. Change **`backend/.env`** to use the **`service_role`** secret instead, restart the API, and try again.  
  If you must keep `anon` for some reason, run the **`ALTER TABLE … DISABLE ROW LEVEL SECURITY`** block at the bottom of **`backend/sql/schema.sql`** in the SQL Editor (or add equivalent RLS policies).


- **`Network request failed` / timeouts on the phone**  
  Almost always wrong **`EXPO_PUBLIC_API_URL`** (use LAN IP, not `localhost`), or a firewall blocking port **8000**.

- **Admin actions return 401**  
  Backend has **`ADMIN_API_KEY`** set but the app is missing or wrong **`EXPO_PUBLIC_ADMIN_API_KEY`**.

- **Technician jobs empty**  
  Sign in with the **technician** email/password from **`POST /admin/technicians`**, and ensure an admin has **assigned** a ticket to that technician.

- **Health or diagnosis errors**  
  Supabase URL/key wrong, or missing tables the feature expects (see `/health` and diagnosis setup in the backend).

---

## 8. Stop and start again

- **Backend:** `Ctrl+C` in the terminal; start again with `python main.py` from `backend/` with venv activated.  
- **Mobile:** `Ctrl+C` in the Expo terminal; run `npm start` again from `mobile/`.

For a deeper **route and body reference**, see **`backend/API.md`**.
