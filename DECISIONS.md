# 🧠 DECISIONS.md — Splitwise Clone

## Engineering & Product Decisions

This document records the major technical and product decisions made during the design and development of Splitwise Clone. Each entry follows a consistent structure: the problem being solved, the options considered, the chosen approach, and the rationale.

---

### 1. Backend Framework — Django + DRF vs Node.js (Express)

**Problem:**
Choose a backend framework capable of supporting REST APIs, a relational data model with complex relationships, JWT authentication, and WebSocket connections — all within a tight college project timeline.

**Options considered:**

| Option | Pros | Cons |
|---|---|---|
| Django + DRF | Mature ORM, built-in admin, excellent ecosystem, DRF handles serialization cleanly | Slightly more verbose setup than Express |
| Node.js + Express | Fast prototyping, same language as frontend | No built-in ORM, manual validation, WebSocket setup more fragmented |
| FastAPI | Modern, async-first, automatic OpenAPI docs | Smaller ecosystem, less auth tooling out of the box |

**Chosen approach:** Django 5 + Django REST Framework

**Why:**
Django's ORM made defining the relational schema (Users, Groups, GroupMembers, Expenses, ExpenseParticipants, Settlements) straightforward and safe with migrations. DRF's serializer and view layers handled validation and API design with minimal boilerplate. Django Channels integrated naturally for WebSocket support without adding a separate service. The built-in admin interface was also useful for data inspection during development.

---

### 2. Database — PostgreSQL vs NoSQL (MongoDB)

**Problem:**
Select a database that fits the relational, transactional nature of expense splitting and balance tracking.

**Options considered:**

| Option | Pros | Cons |
|---|---|---|
| PostgreSQL | ACID transactions, strong FK enforcement, decimal precision | Requires schema migrations |
| MongoDB | Flexible schema, easy horizontal scaling | Poor fit for relational data, no FK constraints, harder to ensure financial consistency |
| SQLite | Zero setup for local dev | Not suitable for concurrent production use |

**Chosen approach:** PostgreSQL (local and Railway-hosted production)

**Why:**
Expense splitting is inherently transactional. A settlement that updates two members' balances must either fully commit or fully roll back — PostgreSQL's ACID guarantees make this safe. `DecimalField(max_digits=12, decimal_places=2)` in Django maps to PostgreSQL's `NUMERIC` type, which avoids floating-point rounding errors that are unacceptable in financial calculations. Django's `transaction.atomic()` is used in `ExpenseService.create_expense` and `SettlementService.create_settlement` to ensure consistency. SQLite was kept as a local fallback via the `DB_*` → `DATABASE_URL` → SQLite priority chain in settings.

---

### 3. Authentication — JWT vs Session-Based Auth

**Problem:**
Select an authentication strategy that works cleanly with a decoupled React SPA frontend and a stateless Django backend, including WebSocket authentication.

**Options considered:**

| Option | Pros | Cons |
|---|---|---|
| JWT (Simple JWT) | Stateless, works naturally with SPA, token passed in WS URL | Token revocation requires additional infrastructure |
| Django Session Auth | Built-in, secure cookies | Requires cookie sharing across domains; complex with Vercel + Railway |
| OAuth2 / Social Login | Better UX for end users | Overkill for college project; complex setup |

**Chosen approach:** JWT via `djangorestframework-simplejwt`

**Why:**
The frontend (Vercel) and backend (Railway) run on separate domains. Session cookies would require careful `SameSite` and `CORS` configuration that is error-prone. JWT tokens are stored in `localStorage`, attached to every Axios request via an interceptor, and passed as a query parameter (`?token=`) for the WebSocket handshake — a pattern that Simple JWT supports cleanly. Access token refresh is handled silently via Axios response interceptors.

---

### 4. Frontend Stack — React + Vite vs Next.js

**Problem:**
Choose a frontend framework that enables a fast, reactive SPA with minimal configuration.

**Options considered:**

| Option | Pros | Cons |
|---|---|---|
| React + Vite | Extremely fast HMR, minimal config, SPA model fits the app | No SSR (not needed for this app) |
| Next.js | SSR/SSG, file-based routing | SSR adds complexity not needed for an auth-gated SPA |
| Vue + Vite | Simpler syntax | React was the preferred learning target |

**Chosen approach:** React 18 + Vite + Tailwind CSS

**Why:**
The entire application is behind an authentication gate — there is no public-facing page that requires SSR for SEO. Vite's Hot Module Replacement made iterative UI development fast. Tailwind CSS with utility classes kept the styling consistent without a CSS-in-JS overhead. React Router v6 handled client-side routing. The combination is industry-standard and directly relevant to internship-level frontend work.

---

### 5. Backend Deployment — Railway vs Render vs Heroku

**Problem:**
Deploy a Django ASGI application that supports both HTTP REST and persistent WebSocket connections, with a managed PostgreSQL instance.

**Options considered:**

| Option | Pros | Cons |
|---|---|---|
| Railway | Native ASGI support, PostgreSQL add-on, simple env vars, generous free tier | Newer platform, fewer tutorials |
| Render | Well-documented, free tier | WebSocket support on free tier can be inconsistent; sleep on inactivity |
| Heroku | Most tutorials available | Free tier removed; costs add up |
| Fly.io | Good performance | More complex Docker-based config |

**Chosen approach:** Railway

**Why:**
Railway provisions both the Django service and PostgreSQL in the same project, making `DATABASE_URL` injection automatic. The start command (`gunicorn` with `uvicorn.workers.UvicornWorker`) runs the ASGI application cleanly, supporting both DRF REST endpoints and Django Channels WebSocket consumers on the same port. Railway does not sleep the service on inactivity (unlike Render's free tier), which is important for WebSocket connection stability.

---

### 6. Frontend Deployment — Vercel vs Netlify

**Problem:**
Host the Vite-built React SPA with fast global CDN delivery and environment variable injection at build time.

**Options considered:**

| Option | Pros | Cons |
|---|---|---|
| Vercel | Native Vite support, automatic preview deployments, `VITE_*` env vars | None significant for this use case |
| Netlify | Also supports Vite, similar feature set | Slightly more manual redirect config for SPA routing |
| GitHub Pages | Free, simple | No env var injection, no HTTPS custom domain on free tier |

**Chosen approach:** Vercel

**Why:**
Vercel detects Vite automatically and configures the build (`npm run build`, output `dist/`) with zero additional settings. Environment variables prefixed `VITE_` are injected at build time, making `VITE_API_BASE_URL` available in the React app without any build script changes. SPA client-side routing (React Router) works without a manual redirect rule because Vercel handles it by default.

---

### 7. Dynamic Group Membership Handling

**Problem:**
When a member is removed from a group, decide what happens to their existing expense participations and balances.

**Options considered:**

- **Hard delete membership and cascade-delete all expense participations** — destroys historical data, creates accounting gaps.
- **Soft delete with `is_active` flag** — preserves history but adds complexity to every query.
- **Retain membership history, block new expense additions** — keeps existing records intact, prevents future additions.

**Chosen approach:** Retain all historical `ExpenseParticipant` records on member removal; block removed members from being added to new expenses.

**Why:**
`GroupMember.remove_member` (in `GroupService`) deletes the `GroupMember` row, but `ExpenseParticipant` rows are not cascaded — they reference `accounts_user` directly. This preserves historical balance calculations. The `ExpenseService.create_expense` method validates that all participants are current `GroupMember` records, so removed members cannot be included in new expenses. This approach is financially correct and matches how real expense-sharing apps handle departures.

---

### 8. Duplicate Detection — Manual Approval vs Automatic Deletion

**Problem:**
When a CSV importer detects a potential duplicate expense, decide whether to auto-delete the duplicate or require human approval.

**Options considered:**

- **Automatic deletion** — simpler code, no admin queue needed.
- **Automatic import (allow duplicates)** — safest from a data-loss perspective but creates incorrect balances.
- **Manual approval queue** — requires more UI work but is the only safe option.

**Chosen approach:** Manual approval required for all flagged duplicates.

**Why:**
Two genuinely identical expenses can be legitimate (e.g., the same grocery run split twice on the same day for different people). Automatically deleting a record that turns out to be a real expense would corrupt balances and violate user trust. The approval queue puts the decision with the person who has context — the group admin. This aligns with the assignment's Meera requirement: no automatic deletion without explicit approval.

---

### 9. Explicit Settlements vs Automatic Balance Clearing

**Problem:**
Decide whether to automatically zero out balances when they cancel or require users to explicitly record a settlement.

**Options considered:**

- **Automatic clearing** — balances zero out silently when they cancel each other. Simple but lacks an audit trail.
- **Explicit settlement records** — every payment is recorded as a `Settlement` with payer, receiver, amount, and timestamp.

**Chosen approach:** Explicit settlements via `Settlement` model.

**Why:**
Users need to know *when* and *how much* was paid. The `Settlement` model stores `paid_by`, `paid_to`, `amount`, `note`, and `created_at`. `SettlementService.settlement_balance_impact` calculates the delta for both parties, which is surfaced in the Settlement Details page. This creates a complete audit trail and matches the mental model users bring from real-world payment apps.

---

### 10. Currency Normalization Strategy

**Problem:**
The application stores all amounts in a single `DecimalField` without a currency column. If CSV data contains mixed currencies (USD and INR), a normalization strategy is needed.

**Options considered:**

- **Reject all non-USD rows** — simple but loses data.
- **Auto-convert using a live exchange rate API** — risk of rate inconsistency; requires an external service dependency.
- **Hold for manual conversion** — admin enters the rate; conversion is explicit and auditable.
- **Store currency per expense** — requires schema change and UI updates across the entire app.

**Chosen approach:** Hold mixed-currency rows for manual admin review. The admin provides a conversion rate; the importer applies it before writing to the database. All stored amounts are in USD.

**Why:**
Exchange rates change daily. Automatically applying today's rate to an expense that occurred 6 months ago would produce an incorrect amount. Manual entry forces the user to confirm the rate they intend to use. Storing currency per expense was considered but would require changes to the balance calculation engine, the dashboard summary, and the group balance API — a disproportionate change for a feature that is out of scope in the current version.

---

### 11. AI-Assisted Development with Human Review

**Problem:**
Determine how to use AI coding tools (ChatGPT, GitHub Copilot) responsibly in a project that will be submitted for academic evaluation and used in interviews.

**Options considered:**

- **No AI usage** — ensures full human ownership but misses efficiency gains.
- **AI writes all code, human reviews** — fast but risky; AI makes systematic errors in domain-specific logic.
- **AI as a pair programmer** — AI proposes code, human reviews, tests, and corrects before committing.

**Chosen approach:** AI as a pair programmer with mandatory human review and testing of all AI-generated code.

**Why:**
AI tools are most useful for scaffolding, boilerplate, and reminding developers of syntax. They are unreliable for domain-specific logic such as split calculations with decimal precision, membership timeline validation, and WebSocket authentication. Every AI suggestion was reviewed against the actual Django/DRF documentation, tested against the running application, and corrected where needed. This is documented in detail in `AI_USAGE.md`. The approach was disclosed to the university evaluator per the academic integrity policy.
