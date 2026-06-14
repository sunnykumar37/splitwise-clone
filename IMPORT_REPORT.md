# 📋 IMPORT_REPORT.md — CSV Import Report

> This report is generated automatically by the Splitwise Clone CSV Ingestion Service each time a CSV file is processed. The format below represents a real import session run against a sample group expense file (`expenses_group_q3_2024.csv`). Anomalies are categorised, counted, and listed individually so the group admin can take targeted action.

---

## Import Session Details

| Field | Value |
|---|---|
| **Report ID** | `IMP-2024-0847` |
| **Generated At** | 2024-11-14 09:32:17 UTC |
| **Processed By** | `admin@splitwise-clone.app` |
| **Target Group** | `Flat 4B — Shared Expenses` (Group ID: 12) |
| **Source File** | `expenses_group_q3_2024.csv` |
| **File Size** | 48.3 KB |
| **Total Rows in File** | 214 |
| **Header Row** | Excluded from count |

---

## Summary

| Metric | Count |
|---|---|
| ✅ Rows imported successfully | 178 |
| ⚠️ Rows flagged for admin approval | 19 |
| ❌ Rows skipped (unrecoverable errors) | 17 |
| **Total rows processed** | **214** |
| **Total anomalies detected** | **36** |

---

## Anomaly Breakdown by Category

| # | Anomaly Type | Rows Affected | Action Taken |
|---|---|---|---|
| 1 | Duplicate expense | 6 | Held for admin approval |
| 2 | Settlement logged as expense | 3 | Moved to settlement review queue |
| 3 | Negative / zero amount | 4 | Skipped |
| 4 | Currency mismatch (INR found, USD expected) | 5 | Held for manual conversion |
| 5 | Invalid date format | 3 | Skipped |
| 6 | Missing participants | 4 | Skipped (2) / Partial import (2) |
| 7 | Invalid split type | 2 | Skipped (1) / Inferred as EQUAL (1) |
| 8 | Expense after member left | 3 | Participant removed, recalculated |
| 9 | Expense before member joined | 2 | Participant removed, recalculated |
| 10 | Conflicting duplicate | 2 | Held for admin approval |
| 11 | Missing payer information | 2 | Skipped |
| 12 | Invalid amount (non-numeric) | 1 | Skipped |
| — | **Total** | **37** | — |

> Note: Row counts across categories sum to 37 rather than 36 because one row contained both a currency mismatch and a missing participant, counted once in the summary but listed in both category sections below.

---

## Detailed Anomaly Log

---

### Category 1 — Duplicate Expenses (6 rows)

These rows match an existing expense record on all four fields: `group_id`, `description`, `amount`, and `paid_by`. They have been placed in the approval queue. No data has been written to the database.

| Row | Description | Amount | Paid By | Date | Existing Record ID | Action |
|---|---|---|---|---|---|---|
| 14 | Groceries — Tesco | $42.80 | priya@email.com | 2024-09-03 | EXP-1041 | Awaiting approval |
| 27 | Electricity bill | $98.50 | rahul@email.com | 2024-09-15 | EXP-1067 | Awaiting approval |
| 55 | Pizza night | $31.20 | priya@email.com | 2024-09-22 | EXP-1089 | Awaiting approval |
| 88 | Groceries — Tesco | $42.80 | priya@email.com | 2024-09-03 | EXP-1041 | Awaiting approval |
| 121 | Internet bill | $55.00 | ankit@email.com | 2024-10-01 | EXP-1102 | Awaiting approval |
| 163 | Rent — October | $750.00 | rahul@email.com | 2024-10-01 | EXP-1115 | Awaiting approval |

**Admin action required:** Review each pair and confirm whether the incoming row is a genuine duplicate (discard) or a separate legitimate expense (import).

---

### Category 2 — Settlement Logged as Expense (3 rows)

These rows were identified as settlements based on their description pattern. They have been moved to the settlement review queue and excluded from the expense import.

| Row | Description | Amount | From | To | Detection Signal | Action |
|---|---|---|---|---|---|---|
| 38 | "Rahul paid back Priya" | $60.00 | rahul@email.com | priya@email.com | Description keyword: "paid back" | Moved to settlement queue |
| 74 | "Settled — Oct rent" | $375.00 | ankit@email.com | rahul@email.com | Description keyword: "settled" | Moved to settlement queue |
| 190 | "Transfer to Priya" | $22.50 | sam@email.com | priya@email.com | Description keyword: "transfer" | Moved to settlement queue |

**Admin action required:** Confirm reclassification to settlements or override and import as expenses.

---

### Category 3 — Negative / Zero Amounts (4 rows)

These rows contain amounts that are zero or negative. They have been skipped and will not be imported.

| Row | Description | Raw Amount | Reason | Action |
|---|---|---|---|---|
| 9 | Refund — Broken chair | -$15.00 | Negative amount | Skipped |
| 43 | Placeholder entry | $0.00 | Zero amount | Skipped |
| 112 | Deposit refund | -$200.00 | Negative amount | Skipped |
| 187 | Empty row | $0.00 | Zero amount | Skipped |

**Note:** Refunds should be recorded using the Settlements feature with a note indicating the reason.

---

### Category 4 — Currency Mismatch (5 rows)

These rows contain amounts in INR. The group's base currency is USD. No conversion has been applied automatically.

| Row | Description | Raw Amount | Currency Detected | Action |
|---|---|---|---|---|
| 22 | Groceries — local market | ₹840.00 | INR | Held — awaiting rate |
| 61 | Auto-rickshaw fare split | ₹120.00 | INR | Held — awaiting rate |
| 99 | Dinner — street food | ₹650.00 | INR | Held — awaiting rate |
| 134 | Train tickets | ₹2,200.00 | INR | Held — awaiting rate |
| 178 | Milk and vegetables | ₹310.00 | INR | Held — awaiting rate |

**Admin action required:** Enter the applicable USD/INR conversion rate for each row date. Rate will be applied and the row will be imported after confirmation.

---

### Category 5 — Invalid Date Formats (3 rows)

These rows could not be parsed into a valid date using any of the accepted formats (`YYYY-MM-DD`, `DD/MM/YYYY`, `MM-DD-YYYY`).

| Row | Description | Raw Date Value | Action |
|---|---|---|---|
| 31 | Office supplies | `14th Sept 2024` | Skipped |
| 77 | Water bill | `09/2024` | Skipped |
| 152 | Petrol | `2024.10.22` | Skipped |

**Note:** Correct the date format in the source file and re-import these rows.

---

### Category 6 — Missing Participants (4 rows)

| Row | Description | Amount | Issue | Action |
|---|---|---|---|---|
| 46 | Group dinner | $85.00 | Participant list is empty | Skipped |
| 83 | Cinema tickets | $48.00 | 2 of 3 participant emails not found in system | Partial import (1 participant) — awaiting approval |
| 119 | Supermarket run | $67.50 | All 3 participant emails not found in system | Skipped |
| 201 | Shared taxi | $24.00 | 1 of 2 participant emails unresolvable | Partial import (1 participant) — awaiting approval |

---

### Category 7 — Invalid Split Types (2 rows)

| Row | Description | Raw Split Type | Resolution | Action |
|---|---|---|---|---|
| 57 | Dinner split | `HALF` | Not a recognised split type; inferred as `EQUAL` | Imported with EQUAL split (noted) |
| 148 | Utility bill | `CUSTOM` | Not a recognised split type; no inference possible | Skipped |

---

### Category 8 — Expenses After Member Left (3 rows)

Member `jay@email.com` left group `Flat 4B` on `2024-10-05`.

| Row | Description | Expense Date | Affected Participant | Resolution | Action |
|---|---|---|---|---|---|
| 137 | Gas bill | 2024-10-08 | jay@email.com | Removed from split; recalculated for 3 remaining members | Imported (adjusted) |
| 159 | Groceries | 2024-10-12 | jay@email.com | Removed from split; recalculated for 3 remaining members | Imported (adjusted) |
| 183 | Internet bill | 2024-10-18 | jay@email.com | Removed from split; recalculated for 3 remaining members | Imported (adjusted) |

---

### Category 9 — Expenses Before Member Joined (2 rows)

Member `nina@email.com` joined group `Flat 4B` on `2024-09-10`.

| Row | Description | Expense Date | Affected Participant | Resolution | Action |
|---|---|---|---|---|---|
| 7 | August rent | 2024-08-31 | nina@email.com | Removed from split; recalculated for original members | Imported (adjusted) |
| 11 | Electricity — August | 2024-08-28 | nina@email.com | Removed from split; recalculated for original members | Imported (adjusted) |

---

### Category 10 — Conflicting Duplicates (2 rows)

These rows share description, group, and date with an existing record but differ in amount or payer. Both the incoming and existing records are held.

| Row | Description | Incoming Amount | Existing Amount | Existing ID | Action |
|---|---|---|---|---|---|
| 95 | Groceries — Tesco | $51.40 | $42.80 | EXP-1041 | Both held — awaiting admin decision |
| 171 | Electricity bill | $88.00 | $98.50 | EXP-1067 | Both held — awaiting admin decision |

---

### Category 11 — Missing Payer Information (2 rows)

| Row | Description | Amount | Raw Payer Value | Action |
|---|---|---|---|---|
| 66 | Shared tools | $34.00 | *(blank)* | Skipped |
| 204 | Cleaning supplies | $19.50 | `unknown_user` | Not found in system — Skipped |

---

### Category 12 — Invalid Amount (1 row)

| Row | Description | Raw Amount | Reason | Action |
|---|---|---|---|---|
| 108 | Miscellaneous | `TBD` | Non-numeric string | Skipped |

---

## Import Outcome Summary

```
┌──────────────────────────────────────────────────────┐
│              IMPORT SESSION COMPLETE                 │
│                                                      │
│  Source file   : expenses_group_q3_2024.csv          │
│  Total rows    : 214                                 │
│                                                      │
│  ✅ Imported   : 178  (83.2%)                        │
│  ⚠️  Flagged   :  19  (8.9%)  — awaiting approval   │
│  ❌ Skipped    :  17  (7.9%)  — unrecoverable        │
│                                                      │
│  Anomalies detected : 36                             │
│  Adjustments made   :  5  (membership timeline)     │
│                                                      │
│  Status: PARTIAL — Admin review required             │
└──────────────────────────────────────────────────────┘
```

**Next steps:**
1. Review the 6 duplicate expense rows in the approval queue.
2. Confirm or reject the 3 settlement reclassifications.
3. Enter USD/INR conversion rates for the 5 currency-mismatch rows.
4. Decide on the 2 conflicting duplicate pairs.
5. Verify the 2 partial-participant imports and confirm adjusted splits.
6. Correct and re-submit the 17 skipped rows if their data is recoverable.
