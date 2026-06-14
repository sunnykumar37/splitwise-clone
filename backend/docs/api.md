# Splitwise Clone API

Base URL: `/api`

## Authentication

### `POST /api/auth/register/`
Register a new user.

Request
```json
{
  "username": "alice",
  "email": "alice@example.com",
  "password": "StrongPass123!",
  "first_name": "Alice",
  "last_name": "Doe"
}
```

Response
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {"id": 1, "username": "alice", "email": "alice@example.com"},
    "refresh": "...",
    "access": "..."
  }
}
```

### `POST /api/auth/login/`
Login with username or email.

Request
```json
{
  "login": "alice@example.com",
  "password": "StrongPass123!"
}
```

### `GET /api/auth/me/`
Returns the current user.

## Groups

### `GET /api/groups/`
List groups for the authenticated user.

### `POST /api/groups/`
Create a group.

Request
```json
{
  "name": "Goa Trip",
  "description": "Vacation expenses"
}
```

### `POST /api/groups/{id}/add-member/`
Add an existing user to a group.

Request
```json
{ "user_id": 2, "role": "MEMBER" }
```

### `POST /api/groups/{id}/remove-member/`
Remove a user from a group.

### `GET /api/groups/{id}/balance-summary/`
Group-level dynamic balance summary.

### `GET /api/groups/{group_id}/balances/`
Group balance summary for the authenticated user.

Response
```json
{
  "success": true,
  "message": "Group balance summary",
  "data": {
    "you_owe": "300.00",
    "you_are_owed": "800.00",
    "net_balance": "500.00",
    "member_balances": [
      {"user_id": 2, "username": "rahul", "balance": "-400.00"},
      {"user_id": 3, "username": "aman", "balance": "-400.00"}
    ]
  }
}
```

### `GET /api/dashboard/summary/`
Dashboard-wide summary for the authenticated user.

Response
```json
{
  "success": true,
  "message": "Dashboard summary",
  "data": {
    "total_you_owe": "1000.00",
    "total_you_are_owed": "2500.00",
    "net_balance": "1500.00"
  }
}
```

## Expenses

### `POST /api/groups/{group_id}/expenses/`
Create an expense within a group.

### `GET /api/groups/{group_id}/expenses/`
List expenses for a group.

Request
```json
{
  "description": "Dinner",
  "amount": "120.00",
  "paid_by": 1,
  "split_type": "EQUAL",
  "participants": [{"user_id": 1}, {"user_id": 2}, {"user_id": 3}]
}
```

### `GET /api/expenses/{expense_id}/`
Retrieve expense details.

### `DELETE /api/expenses/{expense_id}/`
Delete an expense as the creator.

Sample response
```json
{
  "success": true,
  "message": "Expense fetched",
  "data": {
    "id": 12,
    "group": {"id": 1, "name": "Goa Trip"},
    "description": "Dinner",
    "amount": "120.00",
    "paid_by": {"id": 1, "username": "alice", "email": "alice@example.com"},
    "split_type": "EQUAL",
    "created_by": {"id": 1, "username": "alice", "email": "alice@example.com"},
    "created_at": "2026-06-12T10:00:00Z",
    "participants": [
      {"id": 1, "user": {"id": 1, "username": "alice", "email": "alice@example.com"}, "amount_owed": "40.00", "percentage": null, "shares": "1.0000"}
    ],
    "split_breakdown": [
      {"user": 1, "amount_owed": "40.00", "percentage": null, "shares": "1.0000"}
    ]
  }
}
```

### Split type examples

EQUAL
```json
{
  "description": "Dinner",
  "amount": "120.00",
  "paid_by": 1,
  "split_type": "EQUAL",
  "participants": [{"user_id": 1}, {"user_id": 2}, {"user_id": 3}]
}
```

Response
```json
{
  "success": true,
  "message": "Expense created",
  "data": {
    "split_type": "EQUAL",
    "participants": [
      {"user": {"id": 1, "username": "alice"}, "amount_owed": "40.00"},
      {"user": {"id": 2, "username": "bob"}, "amount_owed": "40.00"},
      {"user": {"id": 3, "username": "cara"}, "amount_owed": "40.00"}
    ]
  }
}
```

UNEQUAL
```json
{
  "description": "Hotel",
  "amount": "300.00",
  "paid_by": 1,
  "split_type": "UNEQUAL",
  "participants": [
    {"user_id": 1, "amount": "100.00"},
    {"user_id": 2, "amount": "120.00"},
    {"user_id": 3, "amount": "80.00"}
  ]
}
```

Response
```json
{
  "success": true,
  "message": "Expense created",
  "data": {
    "split_type": "UNEQUAL",
    "participants": [
      {"user": {"id": 1, "username": "alice"}, "amount_owed": "100.00"},
      {"user": {"id": 2, "username": "bob"}, "amount_owed": "120.00"},
      {"user": {"id": 3, "username": "cara"}, "amount_owed": "80.00"}
    ]
  }
}
```

PERCENTAGE
```json
{
  "description": "Taxi",
  "amount": "50.00",
  "paid_by": 1,
  "split_type": "PERCENTAGE",
  "participants": [
    {"user_id": 1, "percentage": "50.00"},
    {"user_id": 2, "percentage": "30.00"},
    {"user_id": 3, "percentage": "20.00"}
  ]
}
```

Response
```json
{
  "success": true,
  "message": "Expense created",
  "data": {
    "split_type": "PERCENTAGE",
    "participants": [
      {"user": {"id": 1, "username": "alice"}, "amount_owed": "25.00"},
      {"user": {"id": 2, "username": "bob"}, "amount_owed": "15.00"},
      {"user": {"id": 3, "username": "cara"}, "amount_owed": "10.00"}
    ]
  }
}
```

SHARES
```json
{
  "description": "Groceries",
  "amount": "180.00",
  "paid_by": 1,
  "split_type": "SHARES",
  "participants": [
    {"user_id": 1, "shares": "2"},
    {"user_id": 2, "shares": "1"},
    {"user_id": 3, "shares": "1"}
  ]
}
```

Response
```json
{
  "success": true,
  "message": "Expense created",
  "data": {
    "split_type": "SHARES",
    "participants": [
      {"user": {"id": 1, "username": "alice"}, "amount_owed": "90.00"},
      {"user": {"id": 2, "username": "bob"}, "amount_owed": "45.00"},
      {"user": {"id": 3, "username": "cara"}, "amount_owed": "45.00"}
    ]
  }
}
```

## Settlements

### `POST /api/groups/{group_id}/settlements/`
Create a settlement for a group.

Request
```json
{
  "payer": 2,
  "receiver": 1,
  "amount": "400.00"
}
```

Response
```json
{
  "success": true,
  "message": "Settlement recorded",
  "data": {
    "id": 10,
    "group": {"id": 1, "name": "Goa Trip"},
    "payer": {"id": 2, "username": "rahul", "email": "rahul@example.com"},
    "receiver": {"id": 1, "username": "sunny", "email": "sunny@example.com"},
    "amount": "400.00",
    "created_by": 2,
    "created_at": "2026-06-12T10:20:00Z",
    "balance_impact": {
      "payer": {"user_id": 2, "delta": "-400.00"},
      "receiver": {"user_id": 1, "delta": "400.00"}
    }
  }
}
```

### `GET /api/groups/{group_id}/settlements/`
List settlements for a group.

### `GET /api/settlements/{settlement_id}/`
Retrieve settlement details.

Response
```json
{
  "success": true,
  "message": "Settlement fetched",
  "data": {
    "id": 10,
    "group": {"id": 1, "name": "Goa Trip"},
    "payer": {"id": 2, "username": "rahul", "email": "rahul@example.com"},
    "receiver": {"id": 1, "username": "sunny", "email": "sunny@example.com"},
    "amount": "400.00",
    "created_by": 2,
    "created_at": "2026-06-12T10:20:00Z",
    "balance_impact": {
      "payer": {"user_id": 2, "delta": "-400.00"},
      "receiver": {"user_id": 1, "delta": "400.00"}
    }
  }
}
```

### Updated balance algorithm
Balances are computed as the sum of two deltas:
1. Expense delta: the payer gets `+amount`, and each participant gets `-amount_owed`.
2. Settlement delta: the payer gets `-amount`, and the receiver gets `+amount`.

Final balance for a user is the total of all expense and settlement deltas within the group or across the dashboard summary.

Sample request for a group balance summary
```json
{
  "payer": 2,
  "receiver": 1,
  "amount": "400.00"
}
```

Sample response for a group balance summary
```json
{
  "success": true,
  "message": "Group balance summary",
  "data": {
    "you_owe": "300.00",
    "you_are_owed": "400.00",
    "net_balance": "100.00",
    "member_balances": [
      {"user_id": 2, "username": "rahul", "balance": "-100.00"},
      {"user_id": 3, "username": "aman", "balance": "-400.00"}
    ]
  }
}
```

Sample response for dashboard summary
```json
{
  "success": true,
  "message": "Dashboard summary",
  "data": {
    "total_you_owe": "300.00",
    "total_you_are_owed": "800.00",
    "net_balance": "500.00"
  }
}
```

## Chat

### `GET /api/expenses/{expense_id}/messages/`
Only expense participants can view messages.

Response
```json
{
  "messages": [
    {
      "id": 1,
      "sender": {"id": 2, "username": "rahul"},
      "message": "Dinner was expensive 😂",
      "created_at": "2026-06-12T10:00:00Z"
    }
  ]
}
```

### WebSocket: `ws:///ws/expenses/{expense_id}/`
Only authenticated expense participants can connect.
Client send:
```json
{ "message": "I'll cover this one next time." }
```

Server broadcast:
```json
{
  "id": 15,
  "sender": {"id": 2, "username": "rahul"},
  "message": "I'll cover this one next time.",
  "created_at": "2026-06-12T10:05:00Z"
}
```

Manual testing:
1. In Postman, send `GET /api/expenses/{expense_id}/messages/` with a valid bearer token for an expense participant.
2. Confirm anonymous users receive 401 and non-participants receive 403.
3. In a WebSocket client, connect to `ws://localhost:8000/ws/expenses/{expense_id}/?token=<jwt>`.
4. Send `{ "message": "Let's settle this later." }` and verify all connected participants receive the broadcast.
5. Confirm the message is persisted by repeating the GET messages request.