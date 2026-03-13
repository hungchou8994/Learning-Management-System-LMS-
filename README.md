# SkillGro / elearn-da2 — Runbook (Backend + Frontends + Seeding)

This repo contains a microservices backend (Docker) and multiple Next.js frontends.

## Quick links (ports)

- **API Gateway**: `http://localhost:3000`
- **Auth Service**: `http://localhost:3001`
- **AuthZ Service**: `http://localhost:3002`
- **Processing Service**: `http://localhost:3003`
- **Elearn DB service (Express/Mongo API)**: `http://localhost:3010`

Frontends:
- **elearn-fe (student web)**: `http://localhost:3004`
- **manage-fe (teacher web)**: `http://localhost:3005` *(teacher-only login)*
- **center-fe (center staff/admin web)**: `http://localhost:3006` *(admin/manager/recruiter/accountant only)*
- **meeting-fe (video meeting)**: `http://localhost:3007`
- **messenger-fe (chat)**: `http://localhost:3008`
- **forum-fe (Q&A forum)**: `http://localhost:3009`
- **livedoc-fe (collaborative docs)**: `http://localhost:3011`

Uploads:
- Files uploaded in teacher applications are served at: `http://localhost:3000/elearn/uploads/<filename>`

---

## Prerequisites

- **Windows PowerShell** (recommended, because the repo includes `reset-all.ps1`)
- **Docker Desktop** (with Docker Compose)
- **Node.js** (LTS recommended) + **npm**

---

## 1) Start backend (Docker)

From repo root:

```powershell
cd .\backend
docker compose up -d --build
```

This will start:
- `api-gateway` (3000)
- `auth-service` (3001) + Postgres `auth-db` (host port **5435**)
- `authz-service` (3002) + Postgres `authz-db` (host port **5433**)
- `processing-service` (3003) + Postgres `processing-db` (host port **5434**) + RabbitMQ + Redis
- `elearn-db` (3010) + MongoDB (27017)

### Notes

- The backend services use `env_file` entries in `backend/docker-compose.yml`:
  - `backend/api-gateway/.env`
  - `backend/auth-service/.env`
  - `backend/authz-service/.env`
  - `backend/processing-service/.env`
  - `backend/elearn-db/.env`
- Uploads in `elearn-db` are persisted via a Docker volume (`elearn-uploads`) so files survive rebuilds.

---

## 2) Reset + seed databases (recommended for grading)

Run from repo root (PowerShell):

```powershell
.\reset-all.ps1 -MongoUri "mongodb://127.18.0.2:27017/elearn-test"
```

Optional: customize seed sizes:

```powershell
.\reset-all.ps1 -MongoUri "mongodb://127.18.0.2:27017/elearn-test" -Courses 20 -Teachers 4 -Students 15
```

### What `reset-all.ps1` does

1. Wipes **all users** in auth-service (Postgres)
2. Drops **all data** in MongoDB database (`elearn-test`)
3. Seeds auth users (admin/manager/recruiter/accountant/teachers/students)
4. Seeds elearn-db data (courses/sessions/lessons/assignments/attempts/feedback/enrolls)
5. Seeds elearn-db **programming problem set** (problems + test cases + hints) *(default 50)*

### Programming problem seed options

`reset-all.ps1` also supports seeding the problem set:

- **`-Problems`**: number of problems (default `50`)
- **`-ProblemSeed`**: deterministic random seed (default `1337`)
- **`-ProblemAuthor`**: username to use as author (default: auto-pick first `teacher_*` from `seed-users.json`)
- **`-SkipProblemSeed`**: skip problem set seeding step entirely

### Where seed outputs / credentials go

After the script completes, it writes to **repo root**:

- `credentials.txt` *(human-readable login list for all roles)*
- `seed-users.json` *(used by the Mongo seed step; useful for debugging)*

> If you re-run seeding, these files are overwritten with the latest credentials.

---

## 3) Start frontends (Next.js)

Open **a separate terminal** for each app and run `npm install` once, then `npm run dev`.

### 3.1 elearn-fe (student web) — `http://localhost:3004`

Create `elearn-fe/.env.local`:

```env
NEXT_PUBLIC_API_GATEWAY_URL=http://localhost:3000
```

Run:

```powershell
cd .\elearn-fe
npm install
npm run dev
```

### 3.2 manage-fe (teacher web) — `http://localhost:3005`

Optional `manage-fe/.env.local` (defaults to `http://localhost:3000` if missing):

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

Run:

```powershell
cd .\manage-fe
npm install
npm run dev
```

Notes:
- **Only teacher accounts** can login to manage-fe.
- Teacher self sign-up is replaced by an **Apply** flow at: `http://localhost:3005/apply`

### 3.3 center-fe (center staff/admin web) — `http://localhost:3006`

Optional `center-fe/.env.local` (defaults to `http://localhost:3000` if missing):

```env
NEXT_PUBLIC_API_GATEWAY_URL=http://localhost:3000
```

Run:

```powershell
cd .\center-fe
npm install
npm run dev
```

Notes:
- Only **center roles** can login: `admin`, `manager`, `recruiter`, `accountant`.
- Teacher applications can be reviewed under the **Giáo viên** page (tab **Ứng tuyển**).

### 3.4 meeting-fe (video meeting) — `http://localhost:3007`

Create `meeting-fe/.env.local` (Stream keys required):

```env
NEXT_PUBLIC_API_GATEWAY_URL=http://localhost:3000
NEXT_PUBLIC_STREAM_API_KEY=YOUR_STREAM_API_KEY
STREAM_SECRET_KEY=YOUR_STREAM_SECRET_KEY
```

Run:

```powershell
cd .\meeting-fe
npm install
npm run dev
```

### 3.5 messenger-fe (chat) — `http://localhost:3008`

Create `messenger-fe/.env.local`:

```env
NEXT_PUBLIC_API_GATEWAY_URL=http://localhost:3000
LIVEBLOCKS_PUBLIC_KEY=YOUR_LIVEBLOCKS_PUBLIC_KEY
LIVEBLOCKS_SECRET_KEY=YOUR_LIVEBLOCKS_SECRET_KEY
```

Run:

```powershell
cd .\messenger-fe
npm install
npm run dev
```

### 3.6 forum-fe (Q&A forum) — `http://localhost:3009`

This is a StackOverflow-style Q&A forum UI. In this monorepo version it uses **SkillGro auth via API Gateway** (cookies) at:
- `GET /api/auth/me`
- `POST /api/auth/login`
- `POST /api/auth/logout`

Create `forum-fe/.env.local`:

```env
NEXT_PUBLIC_API_GATEWAY_URL=http://localhost:3000

# Optional (only needed if you use the rich editor)
NEXT_PUBLIC_TINY_MCE_API_KEY=YOUR_TINY_MCE_API_KEY

# Optional (only needed if you use AI helper routes)
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
DEEPINFRA_API_KEY=YOUR_DEEPINFRA_API_KEY
RAPIDAPI_API_KEY=YOUR_RAPIDAPI_API_KEY
```

Run:

```powershell
cd .\forum-fe
npm install
npm run dev
```

### 3.7 livedoc-fe (collaborative docs) — `http://localhost:3011`

Create `livedoc-fe/.env.local`:

```env
NEXT_PUBLIC_API_GATEWAY_URL=http://localhost:3000
LIVEBLOCKS_SECRET_KEY=YOUR_LIVEBLOCKS_SECRET_KEY
```

Run:

```powershell
cd .\livedoc-fe
npm install
npm run dev
```

---

## Login accounts (after seeding)

Open `credentials.txt` in the repo root to see the latest generated accounts.

Common ones:
- **Center admin**: `admin123` / (password in `credentials.txt`)
- **Teachers**: `teacher_001`, `teacher_002`, ...
- **Students**: `student_001`, `student_002`, ...

---

## Forgot password (fake OTP)

All frontends support password reset using a **fake OTP**:
- OTP is always **`123456`**
- Flow does **not** require the old password

---

## Troubleshooting

- **401 / role blocked after login**: the app enforces role access; use the correct role from `credentials.txt`.
- **Uploads show 404**: files created before a container rebuild might not exist anymore; re-upload in the teacher application detail modal. New uploads persist via Docker volume.
- **Docker services not reachable**: ensure Docker Desktop is running; re-run:

```powershell
cd .\backend
docker compose ps
docker compose logs -f --tail 200 api-gateway
```


