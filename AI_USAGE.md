# 🤖 AI_USAGE.md — AI Assistance Disclosure

## Overview

This document provides a complete and honest account of how AI tools were used during the development of Splitwise Clone. It covers the tools used, the nature of their contributions, key prompts, and — critically — the concrete cases where AI produced incorrect or unsafe output that required human identification and correction.

This disclosure is provided in accordance with the university's academic integrity policy and is intended to demonstrate that AI was used as a productivity tool under continuous human review, not as a substitute for understanding.

---

## Tools Used

| Tool | How It Was Used |
|---|---|
| **ChatGPT (GPT-4)** | Architecture planning, boilerplate generation, debugging assistance, documentation drafting |
| **GitHub Copilot** | Inline code suggestions while writing serializers, service methods, and React components |
| **Blackbox AI** | Occasional alternative suggestions for specific Django ORM queries and Tailwind class combinations |

---

## How AI Was Used

AI assistance was used in three categories:

**1. Scaffolding and boilerplate**
Setting up the Django project structure, configuring CORS headers, writing the base Axios interceptor, and generating the initial Tailwind layout structure. These are areas where AI is reliable because they follow documented patterns.

**2. Problem-solving prompts**
When stuck on a specific issue (e.g., WebSocket token authentication, Railway deployment config), AI was prompted with a description of the problem to get candidate solutions. These were always verified against the official documentation and tested before committing.

**3. Documentation**
AI was used to draft initial versions of README, SCOPE.md, DECISIONS.md, IMPORT_REPORT.md, and this file. All content was reviewed, corrected for factual accuracy against the actual codebase, and rewritten where necessary.

---

## Key Prompts Used

Below are representative prompts used during development, along with what was taken, modified, or rejected from the response.

---

**Prompt 1 — Django Channels WebSocket authentication**
```
How do I authenticate a WebSocket connection in Django Channels using a JWT token passed
as a query parameter? The token should be validated before the consumer connects.
```
*Outcome:* The suggested middleware pattern was structurally correct but used `database_sync_to_async` incorrectly, blocking the event loop. Corrected to use `sync_to_async` with the right wrapper around the ORM call in `chat/middleware.py`.

---

**Prompt 2 — Decimal split with rounding**
```
Write a Python function that splits a decimal amount evenly among N participants
and ensures the total always equals the original amount (no rounding gaps).
```
*Outcome:* The initial response used Python's `float` division, which introduced floating-point errors. Replaced with `Decimal` arithmetic throughout, using `quantize` with `ROUND_HALF_UP`. The `split_evenly` utility in `common/utils.py` distributes the rounding remainder to the last participant.

---

**Prompt 3 — Railway deployment with Gunicorn + Daphne**
```
How do I deploy a Django Channels application on Railway using Gunicorn?
What start command should I use?
```
*Outcome:* AI suggested `daphne splitwise_backend.asgi:application` as the start command. While Daphne works, the final deployment uses `gunicorn` with `uvicorn.workers.UvicornWorker` because Railway's health check system works more reliably with Gunicorn's process model. See Case Study 4 below.

---

**Prompt 4 — React Axios interceptor for JWT refresh**
```
Write an Axios interceptor for a React app that automatically refreshes a JWT access token
when a 401 response is received, using a refresh token stored in localStorage.
```
*Outcome:* The generated interceptor had a race condition — if two requests fired simultaneously and both received a 401, both would attempt a token refresh independently, causing the second refresh to fail. Fixed by adding a `isRefreshing` flag and a queue of pending requests that resolve after the single refresh completes.

---

**Prompt 5 — Group balance calculation query**
```
Write a Django ORM query to calculate the net balance for each member in a group,
considering both expenses paid and amounts owed across all group expenses.
```
*Outcome:* The AI query used `annotate` with `Sum` but did not account for the `ExpenseParticipant` relationship correctly — it was summing `amount_owed` from the wrong direction. Rewritten manually to aggregate separately: (1) total paid by user across group expenses, (2) total owed by user across `ExpenseParticipant` records, then subtracted.

---

## Case Studies — Where AI Was Wrong and How It Was Caught

---

### Case Study 1 — AI Suggested Automatic Duplicate Deletion

**What AI suggested:**
When prompted to handle CSV duplicate detection, ChatGPT proposed:

```python
# If a duplicate is found, delete the existing record and import the new one
existing = Expense.objects.filter(
    group=group, description=description, amount=amount, paid_by=paid_by
).first()
if existing:
    existing.delete()
Expense.objects.create(...)
```

**Why it was wrong:**
This approach unconditionally deletes existing expense records that match the incoming CSV row. The assignment explicitly required Meera's approval before any duplicate is deleted. Automatic deletion would:
- Corrupt balances if the existing record was correct and the CSV row was stale data.
- Remove audit history for expenses that had already been settled.
- Violate user trust by silently deleting financial records.

**How it was caught:**
Re-reading the assignment specification revealed the explicit requirement: *"duplicates must be flagged and held for manual review — no automatic deletion"*. The code was rejected entirely.

**What was implemented instead:**
Duplicate rows are placed in a pending import queue. A review UI shows both the existing record and the incoming row. The admin explicitly selects "Discard duplicate" or "Import anyway" for each flagged row.

---

### Case Study 2 — AI Assumed USD Equals INR

**What AI suggested:**
When generating the CSV import validator, GitHub Copilot auto-completed:

```python
# Normalize currency — treat all amounts as USD
amount = Decimal(str(row.get("amount", 0)))
```

The generated code silently stripped the currency field and treated every amount as USD regardless of its labeled currency.

**Why it was wrong:**
A CSV row containing `₹840` (INR) and a row containing `$840` (USD) are not financially equivalent — at the time of development, 1 USD ≈ 84 INR. Silently treating them as equal would import INR amounts as USD values, inflating balances by a factor of ~84x for affected rows.

**How it was caught:**
During manual testing, a test CSV containing both USD and INR rows was run through the importer. The balance summary showed an absurd net balance (over $3,000 from a ₹2,200 train ticket). Inspecting the imported records revealed the currency field had been ignored.

**What was implemented instead:**
A pre-import currency validation pass checks every row's `currency` field. Rows with a non-base currency are held in the anomaly queue with the raw amount and currency code visible. The admin enters a conversion rate; the importer multiplies and stores the converted USD amount before writing to the database. The conversion rate and original amount are stored in an import log for auditability.

---

### Case Study 3 — AI Ignored Membership Timelines

**What AI suggested:**
When generating the expense creation service, ChatGPT's initial version validated participants only by checking whether their user IDs existed in the system:

```python
# Validate participants exist
for p in participants:
    if not User.objects.filter(id=p["user_id"]).exists():
        raise ValueError(f"User {p['user_id']} not found")
```

**Why it was wrong:**
This only verifies the user exists in the system — it does not verify they are a *current* member of the *specific group*. This meant:
1. A user who had been removed from the group could still be added as an expense participant.
2. In the CSV import context, expenses could be imported for users before they joined or after they left, producing incorrect balance calculations.

**How it was caught:**
A manual test added a user to a group, created an expense, removed the user, then attempted to add another expense with the removed user as a participant. The first implementation allowed it, creating a participant record for a non-member and corrupting the group balance.

**What was implemented instead:**
`ExpenseService.create_expense` cross-references participants against current `GroupMember` records:

```python
member_ids = set(
    GroupMember.objects.filter(group=group, user__in=participant_users)
    .values_list("user_id", flat=True)
)
if member_ids != {user.id for user in participant_users}:
    raise ValueError("All expense participants must be group members")
```

For the CSV importer, membership timeline validation additionally checks `GroupMember.joined_at` against the expense date, excluding participants who were not members at that point and recalculating the split for remaining valid members.

---

### Case Study 4 — Railway Deployment — Gunicorn vs Daphne Confusion

**What AI suggested:**
Multiple prompts about Railway deployment returned:

```bash
# Start command
daphne -b 0.0.0.0 -p $PORT splitwise_backend.asgi:application
```

**Why it was wrong:**
Daphne is a valid ASGI server but Railway's health check system sends an HTTP probe to the service shortly after startup. Daphne's process model occasionally failed to respond to Railway's TCP health check within the timeout window, causing Railway to mark the deployment as unhealthy and restart it in a loop. The logs showed the application starting successfully and accepting WebSocket connections, but Railway's orchestration layer was killing it before it could stabilise.

**How it was caught:**
Railway deployment logs showed repeated `Health check failed` messages followed by container restarts. The application itself was working — the Railway dashboard was the tell. Switching to Gunicorn with Uvicorn workers resolved the health check timing issue because Gunicorn's pre-fork model binds the port synchronously before accepting the first request.

**What was implemented instead:**

```bash
gunicorn splitwise_backend.asgi:application \
  -w 4 \
  -k uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:$PORT
```

This start command was verified against Railway's official Django Channels deployment guide and confirmed stable across multiple redeployments.

---

### Case Study 5 — Incorrect API Response Shape Assumption

**What AI suggested:**
When generating the React service layer for group balances, Copilot assumed the API returned:

```js
// Assumed shape
const { you_owe, you_are_owed, net } = await api.get(`/groups/${id}/balances/`);
```

**Why it was wrong:**
The actual Django API returns `net_balance` (not `net`), `you_owe`, and `you_are_owed` nested inside a `data` wrapper via the custom `common/responses.py` response class. The Copilot-generated code destructured `net` which was `undefined`, causing the balance display to show `$NaN` in the UI.

**How it was caught:**
Opening the browser's network tab during development showed the actual response shape. `net` was absent; the correct field was `net_balance`. Additionally, the Axios instance wraps responses so the data was accessible at `response.data` not directly.

**What was implemented instead:**
All API response shapes were verified against the actual running backend using the browser DevTools network inspector before writing the service layer. The `groupService.js` file uses the correct field names (`net_balance`, `you_owe`, `you_are_owed`) and accesses data through the Axios response object properly.

---

## Summary Assessment

| Aspect | Assessment |
|---|---|
| AI usefulness for boilerplate | High — saved significant time on setup and configuration |
| AI usefulness for domain logic | Low — required correction in nearly every finance-related case |
| AI usefulness for debugging | Medium — useful for narrowing hypotheses, not for definitive answers |
| AI usefulness for documentation | High — good at structure and phrasing; required factual correction |
| Overall approach | AI as first draft; human review and testing as the authority |

All code in this repository was written, understood, tested, and owned by the author. AI tools accelerated development but did not replace comprehension or decision-making.
