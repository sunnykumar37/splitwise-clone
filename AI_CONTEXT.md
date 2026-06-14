# AI Context

## Database

Local development uses **PostgreSQL 18** (verified June 2026):

- Database: `splitwise_db`
- Host: `localhost`, Port: `5433`
- Credentials: `DB_*` variables in `backend/.env`

Configuration priority in `settings.py`:

1. `DATABASE_URL` (production / Neon)
2. `DB_*` PostgreSQL variables (local)
3. SQLite fallback (`backend/db.sqlite3`) if PostgreSQL is unreachable

Migration process: create `splitwise_db` → set `DB_*` in `.env` → `python manage.py migrate` → verify engine is `django.db.backends.postgresql`.

## Backend Completion Summary

Authentication:
- JWT using SimpleJWT

Groups:
- CRUD + membership management

Expenses:
- Equal, Unequal, Percentage, Shares

Balances:
- Derived dynamically from expenses and settlements

Settlements:
- Payment recording and balance adjustment

Expense Chat:
- Django Channels
- JWT-authenticated WebSockets
- Participant-only access
- Persistent messaging

Trade-offs:
- No notifications
- No typing indicators
- No Splitwise Pro features
