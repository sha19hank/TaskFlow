# TaskFlow — Project Manager

Full-stack project management app with Kanban boards, role-based access (Admin/Member), and a stats dashboard.

**Stack:** React + Vite + Tailwind · Node.js + Express · PostgreSQL + Prisma · JWT Auth · Railway

---

## ✅ Requirements checklist

| Requirement | Status |
|---|---|
| Authentication (Signup/Login) | ✅ |
| Project & team management | ✅ |
| Task creation, assignment, status tracking | ✅ |
| Dashboard (tasks, status, overdue) | ✅ |
| REST APIs | ✅ |
| PostgreSQL + Prisma (relationships, validations) | ✅ |
| Role-based access control (Admin/Member) | ✅ |
| Deployed on Railway | ✅ (see below) |

---

## 💻 Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL installed and running locally

> If you don't have PostgreSQL available (or don't want to install it), you can run locally with **SQLite** instead.
> This repo includes a separate Prisma schema for SQLite: `backend/prisma/schema.sqlite.prisma`.

### Option A — Local dev with SQLite (no PostgreSQL needed)
```bash
cd backend
npm install
npm run db:generate:sqlite
npm run db:push:sqlite
npm run dev                # http://localhost:5000
```

```bash
cd frontend
npm install
npm run dev                # http://localhost:5173
```

### Step 1 — PostgreSQL setup
```bash
# Create a database (run in psql or use pgAdmin)
CREATE DATABASE taskflow;
```

### Step 2 — Backend setup
```bash
cd backend
npm install
npx prisma generate        # generates Prisma Client
cp .env.example .env       # create env file
```

Edit `backend/.env`:
```
DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/taskflow"
JWT_SECRET="any-long-random-string-here"
PORT=5000
```

```bash
npx prisma db push         # creates all tables in your DB
npm run dev                # starts backend on http://localhost:5000
```

### Step 3 — Frontend setup (new terminal)
```bash
cd frontend
npm install
npm run dev                # starts frontend on http://localhost:5173
```

Open **http://localhost:5173** — the frontend proxies `/api/*` to `localhost:5000` automatically.

### Step 4 — Verify everything works
1. Go to http://localhost:5173/signup → create an account
2. You'll land on the Dashboard
3. Go to Projects → Create a project
4. Open the project → Add tasks, move them between columns
5. Add another user as a member (they need their own account first)

---

## 🚀 Deploy to Railway

### Step 1 — Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/taskflow.git
git push -u origin main
```

### Step 2 — Create Railway project
1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
2. Select your repository

### Step 3 — Add PostgreSQL
In Railway project → **New** → **Database** → **Add PostgreSQL**

### Step 4 — Set environment variables
In Railway → your web service → **Variables**, add:
```
DATABASE_URL=<Railway provides this from the PostgreSQL plugin>
JWT_SECRET=a-very-long-random-secret-string-change-this
NODE_ENV=production
```

> To get `DATABASE_URL`: click your PostgreSQL service → Variables → copy `DATABASE_URL`

### Step 5 — Verify build/start settings
Railway reads `railway.toml` automatically:
- Build: `npm run build`
- Start: `node start.js`

### Step 6 — Deploy
Click **Deploy**. Railway will:
1. Install deps + generate Prisma Client
2. Build React app into `backend/public/`
3. On start: push DB schema automatically, then serve everything

Your app will be live at `https://your-app.up.railway.app` 🎉

---

## 📁 Project Structure

```
taskflow/
├── railway.toml          # Railway build/start config
├── start.js              # DB sync + server start (production)
├── backend/
│   ├── server.js         # Express app
│   ├── prisma/
│   │   └── schema.prisma # DB schema (User, Project, Task, Member)
│   └── src/
│       ├── middleware/auth.js
│       └── routes/
│           ├── auth.js       # POST /signup, /login, GET /me
│           ├── projects.js   # CRUD + member management
│           ├── tasks.js      # CRUD with status tracking
│           └── dashboard.js  # Aggregated stats
└── frontend/
    └── src/
        ├── App.jsx           # Router + protected routes
        ├── api/index.js      # All API calls
        ├── context/AuthContext.jsx
        ├── components/Layout.jsx  # Sidebar
        └── pages/
            ├── Login.jsx
            ├── Signup.jsx
            ├── Dashboard.jsx
            ├── Projects.jsx
            └── ProjectDetail.jsx  # Kanban board + members tab
```

---

## 🔐 API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/signup | No | Register |
| POST | /api/auth/login | No | Login |
| GET | /api/auth/me | Yes | Current user |
| GET | /api/projects | Yes | List all my projects |
| POST | /api/projects | Yes | Create project |
| GET | /api/projects/:id | Member | Get project + tasks |
| PUT | /api/projects/:id | Admin | Update project |
| DELETE | /api/projects/:id | Owner | Delete project |
| POST | /api/projects/:id/members | Admin | Add member by email |
| DELETE | /api/projects/:id/members/:userId | Admin | Remove member |
| GET | /api/tasks/project/:projectId | Member | Get tasks |
| POST | /api/tasks | Member | Create task |
| PUT | /api/tasks/:id | Member | Update task/status |
| DELETE | /api/tasks/:id | Member | Delete task |
| GET | /api/dashboard | Yes | Stats + recent activity |
