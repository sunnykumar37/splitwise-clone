# 💸 Splitwise Clone

<div align="center">

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Django](https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens)

**A full-stack expense sharing application inspired by Splitwise.**  
Split bills, track balances, settle debts, and chat in real time — all in one place.

🌐 **[Live Demo →](https://splitwise-clone-beige.vercel.app)**

</div>

---

## 📌 Table of Contents

1. [Project Overview](#-project-overview)
2. [Features](#-features)
3. [Tech Stack](#-tech-stack)
4. [Architecture Overview](#-architecture-overview)
5. [Local Setup](#-local-setup)
6. [Environment Variables](#-environment-variables)
7. [API Documentation](#-api-documentation)
8. [Deployment](#-deployment)
9. [Screenshots](#-screenshots)
10. [Future Enhancements](#-future-enhancements)
11. [Author](#-author)
12. [License](#-license)

---

## 🧾 Project Overview

**Splitwise Clone** is a full-stack web application that helps groups of people manage shared expenses fairly and transparently. Users can register, create groups, add members, log shared expenses with multiple split strategies, track who owes what, and settle balances — all with a real-time chat attached to every expense.

Built as a college project to demonstrate full-stack development skills including REST APIs, WebSocket integration, JWT authentication, and cloud deployment.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 **User Auth** | Register and login with JWT access/refresh tokens stored in localStorage |
| 📊 **Dashboard** | Overview of total owed, total you are owed, and net balance |
| 👥 **Groups** | Create groups, add/remove members, view group details |
| 💰 **Expenses** | Add expenses with equal, exact, percent, or shares split types |
| ⚖️ **Balances** | Live per-group balance tracking for all members |
| 🤝 **Settlements** | Record and view payments between members with balance impact detail |
| 💬 **Real-time Chat** | WebSocket-powered chat on every expense page via Django Channels |
| 📱 **Responsive UI** | Clean, mobile-friendly interface built with Tailwind CSS |

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 18** | UI component framework |
| **Vite** | Fast build tool and dev server |
| **Tailwind CSS** | Utility-first CSS styling |
| **React Router v6** | Client-side routing |
| **Axios** | HTTP client for REST API calls |

### Backend
| Technology | Purpose |
|---|---|
| **Django 4** | Web framework and ORM |
| **Django REST Framework** | REST API layer |
| **Django Channels** | WebSocket support for real-time chat |
| **Simple JWT** | JWT authentication |
| **Gunicorn** | WSGI server for production |
| **WhiteNoise** | Static file serving |

### Database & Infrastructure
| Technology | Purpose |
|---|---|
| **PostgreSQL** | Primary relational database |
| **Railway** | Backend hosting (ASGI + WebSocket) |
| **Vercel** | Frontend hosting (static SPA) |

---

## 🏗 Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (Client)                     │
│          React SPA  ←→  Axios  ←→  WebSocket            │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTPS / WSS
┌──────────────────────────▼──────────────────────────────┐
│              Backend (Railway — Django ASGI)             │
│                                                          │
│   ┌──────────────┐   ┌────────────────────────────┐     │
│   │  Django REST │   │   Django Channels (ASGI)   │     │
│   │  Framework   │   │   WebSocket consumers      │     │
│   └──────┬───────┘   └────────────┬───────────────┘     │
│          │                        │                      │
│   ┌──────▼────────────────────────▼───────────────┐     │
│   │              Django ORM + Models               │     │
│   └──────────────────────┬────────────────────────┘     │
└──────────────────────────┼──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│                  PostgreSQL Database                      │
└─────────────────────────────────────────────────────────┘
```

**Request flow:**
- REST calls (auth, groups, expenses, settlements) go over HTTPS via Axios → Django REST Framework
- Chat messages flow over persistent WebSocket connections → Django Channels consumers → DB
- JWT tokens are attached to every request via Axios interceptors

---

## 🚀 Local Setup

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL 14+ (or SQLite as fallback)

---

### Backend Setup

```bash
# 1. Navigate to backend
cd backend

# 2. Create and activate virtual environment
python -m venv .venv

# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run migrations
python manage.py migrate

# 5. Start the server
python manage.py runserver
```

> Backend runs at `http://127.0.0.1:8000`

---

### Frontend Setup

```bash
# 1. Navigate to frontend
cd frontend

# 2. Install dependencies
npm install

# 3. Start dev server
npm run dev
```

> Frontend runs at `http://localhost:5173`

---

## 🔑 Environment Variables

### `backend/.env`

```env
SECRET_KEY=django-insecure-local-dev-key
DEBUG=True

# PostgreSQL (local)
DB_NAME=splitwise_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432

CORS_ALLOW_ALL_ORIGINS=True
CHANNEL_LAYER_BACKEND=channels.layers.InMemoryChannelLayer
```

> **Database priority:** `DATABASE_URL` (production) → `DB_*` variables (local PostgreSQL) → SQLite fallback

### `frontend/.env`

```env
VITE_API_BASE_URL=http://localhost:8000
```

### Production environment variables (Railway)

| Variable | Value |
|---|---|
| `SECRET_KEY` | A secure random string |
| `DEBUG` | `False` |
| `ALLOWED_HOSTS` | Your Railway domain |
| `DATABASE_URL` | PostgreSQL connection string |
| `CORS_ALLOW_ALL_ORIGINS` | `True` or your Vercel domain |
| `CHANNEL_LAYER_BACKEND` | `channels.layers.InMemoryChannelLayer` |

---

## 📡 API Documentation

### Base URL
```
https://splitwise-clone-production-0c22.up.railway.app
```

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register/` | Register a new user |
| `POST` | `/api/auth/login/` | Login and receive JWT tokens |

### Dashboard

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/dashboard/` | Full dashboard data |
| `GET` | `/api/dashboard/summary/` | Balance summary (owe / owed / net) |

### Groups

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/groups/` | List all groups for the user |
| `POST` | `/api/groups/` | Create a new group |
| `GET` | `/api/groups/:id/` | Get group details |
| `POST` | `/api/groups/:id/members/` | Add a member to a group |
| `DELETE` | `/api/groups/:id/members/` | Remove a member from a group |
| `GET` | `/api/groups/:id/balances/` | Get balances for a group |

### Expenses

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/expenses/` | List expenses |
| `POST` | `/api/expenses/` | Create a new expense |
| `GET` | `/api/expenses/:id/` | Get expense details |
| `DELETE` | `/api/expenses/:id/` | Delete an expense |

### Settlements

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/settlements/` | List settlements |
| `POST` | `/api/settlements/` | Record a settlement |
| `GET` | `/api/settlements/:id/` | Get settlement details |

### Chat

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/chat/messages/?expense=:id` | Fetch chat history for an expense |
| `WS` | `ws://.../ws/expenses/:id/?token=` | WebSocket connection for live chat |

> All endpoints except register and login require `Authorization: Bearer <access_token>` header.

---

## 🌐 Deployment

| Service | Platform | URL |
|---|---|---|
| 🖥 **Frontend** | Vercel | [https://splitwise-clone-beige.vercel.app](https://splitwise-clone-beige.vercel.app) |
| ⚙️ **Backend** | Railway | [https://splitwise-clone-production-0c22.up.railway.app](https://splitwise-clone-production-0c22.up.railway.app) |
| 🗄 **Database** | PostgreSQL (Railway) | Managed via `DATABASE_URL` |

### Frontend Deployment (Vercel)

1. Import the repository on [Vercel](https://vercel.com)
2. Set **Root Directory** to `frontend`
3. Set **Framework Preset** to `Vite`
4. Add environment variable: `VITE_API_BASE_URL` → your Railway backend URL
5. Deploy

### Backend Deployment (Railway)

1. Connect your repository on [Railway](https://railway.app)
2. Set the **Start Command:**
   ```bash
   gunicorn splitwise_backend.asgi:application -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT
   ```
3. Add all required environment variables from the table above

---

## 📸 Screenshots

> _Add screenshots here after deployment_

| Page | Preview |
|---|---|
| Login | `screenshots/login.png` |
| Register | `screenshots/register.png` |
| Dashboard | `screenshots/dashboard.png` |
| Group Details | `screenshots/group.png` |
| Expense Details + Chat | `screenshots/expense-chat.png` |
| Settlement Details | `screenshots/settlement.png` |

---

## 🔮 Future Enhancements

- [ ] 📧 Email notifications for new expenses and settlements
- [ ] 📲 PWA support for mobile install
- [ ] 🔄 Recurring expenses
- [ ] 📊 Spending analytics and charts per group
- [ ] 🌍 Multi-currency support
- [ ] 🔔 In-app push notifications via WebSockets
- [ ] 👤 User profile page with avatar upload
- [ ] 🧾 Export expense history as PDF/CSV

---

## 👨‍💻 Author

**Sunny Kumar**

- 🎓 College Project — Full Stack Development
- 💼 Built for portfolio, internship applications, and university submission
- 🔗 GitHub: [Add your GitHub profile URL here]
- 📧 Email: [Add your email here]

---

## 📄 License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2024 Sunny Kumar

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

<div align="center">

Made with ❤️ by **Sunny Kumar**

⭐ Star this repo if you found it helpful!

</div>
