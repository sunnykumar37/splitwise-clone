# 📐 SCOPE.md — Splitwise Clone

## Project Scope

This document defines the implemented scope of the Splitwise Clone project, covering all features delivered in the final deployed version, the database schema, and a detailed anomaly log mapping the CSV import requirements to the application's detection and handling strategy.

---

## ✅ Implemented Features

| # | Feature | Status |
|---|---|---|
| 1 | User Registration | ✅ Implemented |
| 2 | User Login | ✅ Implemented |
| 3 | JWT Authentication (access + refresh tokens) | ✅ Implemented |
| 4 | Dashboard with balance summary | ✅ Implemented |
| 5 | Create and manage groups | ✅ Implemented |
| 6 | Add and remove group members | ✅ Implemented |
| 7 | Member roles (ADMIN / MEMBER) | ✅ Implemented |
| 8 | Create expenses with split logic | ✅ Implemented |
| 9 | Equal split | ✅ Implemented |
| 10 | Unequal (exact) split | ✅ Implemented |
| 11 | Percentage split | ✅ Implemented |
| 12 | Shares-based split | ✅ Implemented |
| 13 | Per-group balance tracking | ✅ Implemented |
| 14 | Global balance summary (you owe / you are owed / net) | ✅ Implemented |
| 15 | Record settlements between members | ✅ Implemented |
| 16 | Settlement balance impact calculation | ✅ Implemented |
| 17 | Real-time expense chat via WebSockets | ✅ Implemented |
| 18 | Chat access restricted to expense participants | ✅ Implemented |
| 19 | Responsive UI (Tailwind CSS) | ✅ Implemented |
| 20 | Frontend deployed on Vercel | ✅ Deployed |
| 21 | Backend deployed on Railway (ASGI + WebSocket) | ✅ Deployed |
| 22 | PostgreSQL database on Railway | ✅ Deployed |

### Out of Scope (Original CSV Assignment — Not Implemented)

The original assignment specification included a CSV import feature with anomaly detection. The deployed version delivers the complete shared expenses workflow instead. The anomaly log below documents how each CSV anomaly type **would be** detected, surfaced, and handled if the importer were built, based on the existing model and service layer.

---

## 🗄 Database Schema

All models are defined in Django's ORM. The schema below reflects the actual production models.

---

### `accounts_user` (Custom User)

Extends Django's `AbstractUser`.

| Column | Type | Constraints |
|---|---|---|
| `id` | integer | PK, auto-increment |
| `username` | varchar(150) | unique, not null |
| `email` | varchar(254) | unique, not null |
| `password` | varchar(128) | not null (hashed) |
| `is_active` | boolean | default true |
| `date_joined` | timestamptz | auto |

---

### `groups_group`

| Column | Type | Constraints |
|---|---|---|
| `id` | integer | PK, auto-increment |
| `name` | varchar(255) | not null |
| `description` | text | blank allowed |
| `created_by_id` | integer | FK → `accounts_user` |
| `created_at` | timestamptz | auto |
| `updated_at` | timestamptz | auto |

---

### `groups_groupmember`

Tracks group membership with a `joined_at` timestamp — this is the key field used for membership timeline validation.

| Column | Type | Constraints |
|---|---|---|
| `id` | integer | PK, auto-increment |
| `group_id` | integer | FK → `groups_group` |
| `user_id` | integer | FK → `accounts_user` |
| `role` | varchar(20) | `ADMIN` or `MEMBER` |
| `joined_at` | timestamptz | auto |
| — | — | UNIQUE(`group_id`, `user_id`) |

---

### `expenses_expense`

| Column | Type | Constraints |
|---|---|---|
| `id` | integer | PK, auto-increment |
| `group_id` | integer | FK → `groups_group` |
| `description` | varchar(255) | not null |
| `amount` | decimal(12,2) | not null |
| `paid_by_id` | integer | FK → `accounts_user` |
| `split_type` | varchar(20) | `EQUAL`, `UNEQUAL`, `PERCENTAGE`, `SHARES` |
| `created_by_id` | integer | FK → `accounts_user` |
| `created_at` | timestamptz | auto |

---

### `expenses_expenseparticipant`

Stores the per-user split breakdown for each expense.

| Column | Type | Constraints |
|---|---|---|
| `id` | integer | PK, auto-increment |
| `expense_id` | integer | FK → `expenses_expense` |
| `user_id` | integer | FK → `accounts_user` |
| `amount_owed` | decimal(12,2) | not null |
| `percentage` | decimal(8,4) | nullable |
| `shares` | decimal(12,4) | nullable |
| — | — | UNIQUE(`expense_id`, `user_id`) |

---

### `settlements_settlement`

| Column | Type | Constraints |
|---|---|---|
| `id` | integer | PK, auto-increment |
| `group_id` | integer | FK → `groups_group` |
| `paid_by_id` | integer | FK → `accounts_user` (payer) |
| `paid_to_id` | integer | FK → `accounts_user` (receiver) |
| `amount` | decimal(12,2) | not null |
| `note` | varchar(255) | blank allowed |
| `created_by_id` | integer | FK → `accounts_user` |
| `created_at` | timestamptz | auto |

---

### `chat_expensemessage`

| Column | Type | Constraints |
|---|---|---|
| `id` | integer | PK, auto-increment |
| `expense_id` | integer | FK → `expenses_expense` |
| `sender_id` | integer | FK → `accounts_user` |
| `content` | text | not null |
| `created_at` | timestamptz | auto, ordered ascending |

---

## 🚨 Anomaly Log

This section documents all CSV anomaly types from the original assignment specification. For each type, it explains how the existing model/service layer would detect it, how it would be surfaced to the user, and the handling policy chosen.

---

### 1. Duplicate Expenses

**Detection:**
Query `Expense` for matching `(group_id, description, amount, paid_by_id)` within a narrow time window (e.g., same calendar day). A composite similarity score would flag rows where all four fields match an existing record.

**Surfaced to user:**
Flagged in the import review UI as `DUPLICATE — Requires Approval`. The row is held in a pending state and displayed to the group admin with both the existing and incoming record side by side.

**Handling policy:**
The duplicate is **not automatically deleted or imported**. The group admin must explicitly approve (import) or reject (discard) it. Automatic deletion was rejected because it assumes intent — two identical meals on the same day are possible and legitimate.

---

### 2. Settlement Logged as Expense

**Detection:**
During CSV parsing, if a row's `description` matches patterns such as `"paid back"`, `"settled"`, `"transfer"`, `"reimbursement"`, or if the `split_type` field is absent and `paid_to` is populated, the row is classified as a settlement candidate rather than an expense.

**Surfaced to user:**
Flagged as `MISCLASSIFIED — Possible Settlement`. The import report lists the row description, amount, and a suggested reclassification to the `settlements_settlement` table.

**Handling policy:**
The row is **skipped from expense import** and placed in a separate settlement review queue. The admin can confirm reclassification or override and import as an expense.

---

### 3. Negative Amounts / Refunds

**Detection:**
The `Expense.amount` field is a `decimal(12,2)`. During CSV row parsing, any row where `amount <= 0` fails a pre-import validation check before hitting the model layer. The existing `ExpenseService.create_expense` would also raise a `ValueError` on negative amounts.

**Surfaced to user:**
Flagged as `INVALID AMOUNT — Negative or Zero`. The row is listed in the anomaly report with the raw value and rejected from import.

**Handling policy:**
**Rows with negative amounts are skipped entirely.** Refunds are a separate workflow — they would require a dedicated `Refund` model or a negative-amount settlement, which is out of scope for the current importer.

---

### 4. Currency Mismatches (USD vs INR)

**Detection:**
If the CSV includes a `currency` column, a pre-import pass checks all rows for consistency against the group's configured base currency (defaulting to `USD`). Any row with `currency = INR` (or any non-USD value) is flagged.

**Surfaced to user:**
Flagged as `CURRENCY MISMATCH — Expected USD, found INR`. The anomaly report lists the row, the detected currency, and the group's base currency.

**Handling policy:**
**Mismatched rows are held for review.** The admin can either apply a conversion rate (entered manually) or skip the row. Automatic conversion is not applied because exchange rates are time-sensitive and the importer cannot assume a rate without an explicit source.

---

### 5. Invalid Date Formats

**Detection:**
The CSV parser attempts to parse each `date` or `created_at` field using a set of accepted formats (`YYYY-MM-DD`, `DD/MM/YYYY`, `MM-DD-YYYY`). Rows that fail all format patterns are flagged before any model interaction.

**Surfaced to user:**
Flagged as `INVALID DATE FORMAT` with the raw unparseable string shown alongside the expected format. Listed in the anomaly report under the date validation section.

**Handling policy:**
**Rows with unparseable dates are skipped.** The import continues for valid rows. The anomaly report includes a count and full list of affected rows so the user can fix and re-import.

---

### 6. Missing Participants

**Detection:**
After parsing expense rows, the importer verifies that the `participants` list is non-empty and that every listed participant email resolves to a registered `User` who is an active `GroupMember`. Rows where the participant list is empty or all participants are unresolvable are flagged.

**Surfaced to user:**
Flagged as `MISSING PARTICIPANTS — No valid participants found`. The anomaly report lists the expense description, amount, and which participant identifiers (emails or usernames) could not be resolved.

**Handling policy:**
**Rows with no resolvable participants are skipped.** Partial participant lists (some valid, some unresolvable) are flagged for review — the admin can confirm import with only the resolved participants or skip.

---

### 7. Invalid Split Types

**Detection:**
The `Expense.SplitType` model field accepts only `EQUAL`, `UNEQUAL`, `PERCENTAGE`, and `SHARES`. Any CSV row with a `split_type` value outside this set (e.g., `"HALF"`, `"CUSTOM"`, `""`) is caught during row validation before service layer execution.

**Surfaced to user:**
Flagged as `INVALID SPLIT TYPE — Value not recognised`. The anomaly report lists the raw value and the accepted options.

**Handling policy:**
**Rows with invalid split types are skipped.** If the split type is missing entirely, the importer attempts to infer it (`EQUAL` if no per-participant amounts are provided, `UNEQUAL` if exact amounts are given). The inference is noted in the report.

---

### 8. Expenses After a Member Left

**Detection:**
`GroupMember` records store a `joined_at` timestamp. When a member is removed, the removal timestamp is either stored in a soft-delete field or inferred from the absence of an active membership record. During import, each expense row's `date` is compared against the removal date for each listed participant. Rows where any participant's expense date is after their departure are flagged.

**Surfaced to user:**
Flagged as `MEMBERSHIP VIOLATION — Participant not a member at expense date`. The report identifies the specific participant and the dates involved.

**Handling policy:**
**The flagged participant is removed from the split** and the expense is re-calculated for remaining valid participants. If no valid participants remain, the row is skipped. The admin is notified so they can verify the re-calculated amounts.

---

### 9. Expenses Before a Member Joined

**Detection:**
Using the same `GroupMember.joined_at` field, the importer checks whether the expense `date` predates any participant's `joined_at`. This catches back-dated imports where a user is charged for an expense before they were part of the group.

**Surfaced to user:**
Flagged as `MEMBERSHIP VIOLATION — Participant not yet a member at expense date`. The report lists the participant, their join date, and the expense date.

**Handling policy:**
Same policy as post-departure expenses — the participant is excluded from the split and the remainder is re-calculated. A note is appended to the import report indicating the adjustment.

---

### 10. Conflicting Duplicate Entries

**Detection:**
A conflicting duplicate is defined as two rows with the same `description`, `group`, and `date` but differing `amount` or `paid_by`. This is more subtle than an exact duplicate — it suggests data entry error. Detection uses a fuzzy match on description (Levenshtein distance ≤ 2) combined with exact date and group match.

**Surfaced to user:**
Flagged as `CONFLICTING DUPLICATE — Similar expense with different amount or payer`. Both the existing record and the incoming row are shown for comparison.

**Handling policy:**
**Both rows are held for admin review.** Neither is auto-imported. The admin selects which version is correct or imports both if they are genuinely separate expenses.

---

### 11. Missing Payer Information

**Detection:**
Every `Expense` requires a `paid_by_id` FK. If the CSV row's `paid_by` field is blank, null, or resolves to a user who is not a group member, the row fails validation before the service layer.

**Surfaced to user:**
Flagged as `MISSING PAYER — No valid payer identified`. The anomaly report lists the row and the unresolvable payer value.

**Handling policy:**
**Rows with missing or invalid payers are skipped entirely.** An expense cannot be created without a known payer — splitting logic and balance calculations both depend on it.

---

### 12. Invalid Amounts

**Detection:**
Beyond negative values (covered above), invalid amounts include non-numeric strings, values exceeding `decimal(12,2)` precision, and amounts of exactly `0.00`. All are caught during CSV row normalisation before any database write.

**Surfaced to user:**
Flagged as `INVALID AMOUNT — Non-numeric, zero, or out of range`. The raw value is shown in the anomaly report.

**Handling policy:**
**All rows with invalid amounts are skipped.** Correct data must be re-submitted. Zero-amount expenses are also skipped because they have no financial effect and are likely data entry errors.

---

## 📊 Anomaly Handling Summary

| Anomaly Type | Detection Method | Handling |
|---|---|---|
| Duplicate expense | Field match + time window | Hold for admin approval |
| Settlement as expense | Description pattern match | Reclassify to settlement queue |
| Negative / zero amount | Pre-import validation | Skip row |
| Currency mismatch | Currency field check | Hold for admin + manual rate |
| Invalid date format | Multi-format parse attempt | Skip row |
| Missing participants | User + membership lookup | Skip or partial import |
| Invalid split type | Enum validation | Skip or infer |
| Expense after leaving | `joined_at` + removal date | Remove participant, recalculate |
| Expense before joining | `joined_at` comparison | Remove participant, recalculate |
| Conflicting duplicate | Fuzzy match + date/group | Hold both for admin review |
| Missing payer | User + membership lookup | Skip row |
| Invalid amount | Numeric + range validation | Skip row |
