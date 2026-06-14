# Splitwise Clone

A premium Splitwise clone with group balance tracking, automated settlements, and real-time group chat for expenses.

## Live URLs
- **Live Frontend (Vercel):** `https://splitwise-clone-frontend.vercel.app` (Placeholder)
- **Live Backend (Render):** `https://splitwise-clone-backend.onrender.com` (Placeholder)

---

## 1. Local Setup Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL 18 (local) or SQLite fallback
- Redis (Optional, defaults to InMemory for local dev)

### Backend Setup
1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   # Windows:
   .venv\Scripts\activate
   # macOS/Linux:
   source .venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure local environment variables:
   Create a `.env` file in the `backend/` folder:
   ```env
   SECRET_KEY=django-insecure-local-dev-key
   DEBUG=True

   DB_NAME=splitwise_db
   DB_USER=postgres
   DB_PASSWORD=postgres
   DB_HOST=localhost
   DB_PORT=5433

   CORS_ALLOW_ALL_ORIGINS=True
   CHANNEL_LAYER_BACKEND=channels.layers.InMemoryChannelLayer
   ```
   > **Note:** This project's local PostgreSQL 18 instance runs on port **5433** (not the default 5432). Adjust `DB_PORT` if your installation differs.

5. Create the local PostgreSQL database (if it does not exist):
   ```sql
   CREATE DATABASE splitwise_db;
   ```
6. Run database migrations:
   ```bash
   python manage.py migrate
   ```
7. Verify PostgreSQL is active:
   ```bash
   python manage.py shell -c "from django.db import connection; print(connection.settings_dict['ENGINE'])"
   ```
   Expected output: `django.db.backends.postgresql`
8. Run the local backend server (Daphne for local ASGI/WebSocket testing):
   ```bash
   python manage.py runserver
   ```
   *The server will start on `http://127.0.0.1:8000`.*

### Frontend Setup
1. Navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Configure local environment variables:
   Create a `.env` file in the `frontend/` folder:
   ```env
   VITE_API_BASE_URL=http://localhost:8000
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
   *The frontend will run on `http://localhost:5173`.*

---

## 2. Local Database Configuration (PostgreSQL 18)

The backend selects a database using this priority order:

1. **`DATABASE_URL`** — used for production (e.g. Neon PostgreSQL on Render)
2. **`DB_*` environment variables** — used for local PostgreSQL 18
3. **SQLite fallback** — `backend/db.sqlite3` is used only if PostgreSQL is unreachable

### Local PostgreSQL 18 setup (verified)

| Setting | Value |
|---|---|
| Database | `splitwise_db` |
| User | `postgres` |
| Host | `localhost` |
| Port | `5433` |

### Migration from SQLite to PostgreSQL

1. Ensure PostgreSQL 18 is running (`postgresql-x64-18` service on Windows).
2. Create the database: `CREATE DATABASE splitwise_db;`
3. Set `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, and `DB_PORT` in `backend/.env`.
4. Remove any `DATABASE_ENGINE=django.db.backends.sqlite3` override (no longer needed).
5. Run `python manage.py migrate`.
6. Confirm the engine: `django.db.backends.postgresql`.
7. Smoke-test: register, login, create group/expense/settlement, and expense chat.

The original `backend/db.sqlite3` file is preserved as a revert option. To fall back, unset `DB_*` variables or stop PostgreSQL — the app will reconnect to SQLite automatically.

---

## 3. Database Setup (Neon PostgreSQL)

1. Go to [Neon.tech](https://neon.tech/) and sign up / create a new project.
2. Select **PostgreSQL 16** or above.
3. In the Neon Dashboard, copy the connection string from the **Connection Details** box. It will look like:
   `postgresql://alex:AbCdEf123456@ep-cool-snowflake-123456.us-east-2.aws.neon.tech/neondb?sslmode=require`
4. Use this connection string as the `DATABASE_URL` environment variable in the backend. The backend is configured to automatically parse this URL and require SSL.

---

## 4. Backend Deployment (Render)

Render is used to deploy the Django ASGI application, supporting both standard REST endpoints and Channels WebSockets.

### Render Web Service Setup
1. Create a new **Web Service** on Render and connect your repository.
2. Configure settings:
   - **Environment:** `Python`
   - **Build Command:**
     ```bash
     pip install -r requirements.txt
     python manage.py collectstatic --noinput
     python manage.py migrate
     ```
   - **Start Command:**
     ```bash
     daphne -b 0.0.0.0 -p $PORT splitwise_backend.asgi:application
     ```
3. Add the following **Environment Variables** in Render dashboard:
   - `SECRET_KEY`: *[Insert a secure random string]*
   - `DEBUG`: `False`
   - `ALLOWED_HOSTS`: `splitwise-clone-backend.onrender.com,localhost` *(Replace with your actual Render URL)*
   - `CORS_ALLOW_ALL_ORIGINS`: `True` *(or specify your Vercel frontend domain)*
   - `DATABASE_URL`: *[Insert your Neon PostgreSQL Connection String]*
   - `CHANNEL_LAYER_BACKEND`: `channels.layers.InMemoryChannelLayer` *(or configure `channels_redis.core.RedisChannelLayer` and supply `REDIS_URL` if deploying a managed Redis instance on Render for horizontal scaling)*

---

## 5. Frontend Deployment (Vercel)

Vercel is used to host the static React SPA built with Vite.

### Vercel Project Setup
1. Create a new project on Vercel and import your repository.
2. Configure the directory settings:
   - **Root Directory:** `frontend`
3. Configure Build and Output settings:
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Add the following **Environment Variable** in Vercel dashboard:
   - `VITE_API_BASE_URL`: `https://splitwise-clone-backend.onrender.com` *(Replace with your actual live Render Web Service URL)*
5. Click **Deploy**. Vercel will build the frontend assets and host them on a custom subdomain.

---

## 6. Production Verification Checklist

Follow this checklist to verify the health and functional status of the production environment:

- [ ] **Login/Register:**
  - Create a new account on the register page.
  - Log out and log back in, verifying JWT tokens are generated, stored in `localStorage`, and authorized correctly.
- [ ] **Dashboard:**
  - Verify that summary counters (Total You Owe, Total You Are Owed, Net Balance) render as `$0.00` initially.
- [ ] **Groups:**
  - Create a new Group and verify it appears in the dashboard overview.
  - Add group members using valid user IDs.
- [ ] **Expenses:**
  - Add an expense to a group, selecting split types (equally, exact, percent, or shares).
  - Verify expense entries appear in the group details page.
- [ ] **Balances:**
  - Confirm the debt balances update instantly in the group summary view for all members.
- [ ] **Settlements:**
  - Click the **Settle Up** button, record a settlement between a debtor and a creditor.
  - Verify the settlement is recorded and balances adjust instantly to reflect the payment.
  - Click on the settlement entry in the settlement history and verify it navigates to `/settlements/:settlementId` displaying full detail cards (Payer, Receiver, Amount, Group, Created At, and Balance Impact).
- [ ] **Chat:**
  - Navigate to the **Expense Details** page of any expense.
  - Confirm the connection status indicator changes to **Connected** (green badge).
  - Send messages and confirm they are immediately dispatched over WebSockets and saved.
  - Open the same page in another session, verify real-time chat sync (instant left/right messaging alignment).
  - Verify that a user who is not an expense participant is blocked with an `"Access Denied"` banner and input controls are disabled.
