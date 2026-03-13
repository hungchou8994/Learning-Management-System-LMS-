# SkillGro (elearn-da2) - Tong Quan Du An

## Gioi Thieu

**SkillGro** la mot nen tang hoc truc tuyen (e-learning) day du, duoc xay dung theo kien truc **microservices**. Du an bao gom:

- **5 backend services** chay trong Docker containers
- **7 frontend applications** (Next.js) phuc vu cac vai tro khac nhau
- **4 databases**: 3 PostgreSQL + 1 MongoDB
- **Message queue** (RabbitMQ) va **cache** (Redis)

## Cac Thanh Phan Chinh

### Backend Services (Docker)

| Service | Port | Mo Ta |
|---------|------|-------|
| API Gateway | 3000 | Diem vao duy nhat, proxy request den cac service |
| Auth Service | 3001 | Xac thuc (dang ky, dang nhap, JWT, OTP) |
| AuthZ Service | 3002 | Phan quyen (RBAC voi Casbin) |
| Processing Service | 3003 | Chay code (C++, Python, Java) |
| Elearn DB Service | 3010 | CRUD du lieu hoc tap (MongoDB) |

### Frontend Applications (Next.js)

| App | Port | Doi Tuong | Mo Ta |
|-----|------|-----------|-------|
| elearn-fe | 3004 | Hoc vien | Xem khoa hoc, lam bai, giai lap trinh |
| manage-fe | 3005 | Giao vien | Quan ly khoa hoc, bai tap, cham diem, AI |
| center-fe | 3006 | Admin/Staff | Quan ly trung tam, thong ke, nhan su |
| meeting-fe | 3007 | Tat ca | Hop video (Stream API) |
| messenger-fe | 3008 | Tat ca | Nhan tin (Liveblocks) |
| forum-fe | 3009 | Tat ca | Forum Q&A kieu StackOverflow |
| livedoc-fe | 3011 | Tat ca | Soan tai lieu cong tac (Liveblocks) |

### Databases

| Database | Loai | Port | Phuc Vu |
|----------|------|------|---------|
| auth-db | PostgreSQL 15 | 5435 | Auth Service - luu user/credential |
| authz-db | PostgreSQL 15 | 5433 | AuthZ Service - luu role/permission |
| processing-db | PostgreSQL 15 | 5434 | Processing Service |
| MongoDB | MongoDB latest | 27017 | Elearn DB - du lieu hoc tap chinh |

### Infrastructure

| Component | Port | Mo Ta |
|-----------|------|-------|
| Redis | 6379 | Cache, luu refresh token |
| RabbitMQ | 5672/15672 | Message queue (da cau hinh, chua su dung nhieu) |

## Vai Tro Nguoi Dung

He thong ho tro 7 vai tro:

| Vai Tro | Mo Ta | Dang Nhap Tai |
|---------|-------|---------------|
| `admin` | Quan tri vien cao nhat | center-fe |
| `manager` | Quan ly trung tam | center-fe |
| `recruiter` | Tuyen dung giao vien | center-fe |
| `accountant` | Ke toan | center-fe |
| `teacher` | Giao vien | manage-fe |
| `student` | Hoc vien | elearn-fe |
| `parent` | Phu huynh (dinh nghia nhung chua su dung) | - |

## Cach Chay Du An

### 1. Khoi dong backend

```powershell
cd backend
docker compose up -d --build
```

### 2. Seed du lieu mau

```powershell
.\reset-all.ps1 -MongoUri "mongodb://127.18.0.2:27017/elearn-test"
```

### 3. Khoi dong tung frontend

```powershell
cd elearn-fe && npm install && npm run dev   # Port 3004
cd manage-fe && npm install && npm run dev   # Port 3005
cd center-fe && npm install && npm run dev   # Port 3006
# ... tuong tu cho cac frontend khac
```

## Tai Khoan Mac Dinh (Sau Khi Seed)

- **Admin**: `admin123` / `Khanh9i12345.`
- **Teacher**: `teacher_001` den `teacher_008`
- **Student**: `student_001` den `student_020`
- Chi tiet xem file `credentials.txt` o thu muc goc

## Cong Nghe Su Dung

### Backend
- **Node.js** + **Express.js**
- **Sequelize** ORM (PostgreSQL)
- **Mongoose** ODM (MongoDB)
- **JWT** (jsonwebtoken) cho xac thuc
- **bcryptjs** cho ma hoa mat khau
- **Casbin** cho phan quyen RBAC
- **http-proxy-middleware** cho API Gateway
- **Docker** + **Docker Compose**

### Frontend
- **Next.js** 14/15 (App Router)
- **React** 18/19
- **TypeScript**
- **Tailwind CSS** (manage-fe, center-fe, messenger-fe)
- **Bootstrap 5 + SCSS** (elearn-fe)
- **Redux Toolkit** (elearn-fe)
- **Monaco Editor** (code editor)
- **Liveblocks** (messenger, livedoc)
- **Stream Video SDK** (meeting)
- **Google Gemini AI** (AI grading, lesson plan)

## Cau Truc Thu Muc

```
elearn-da2-main/
|-- backend/
|   |-- api-gateway/          # Reverse proxy
|   |-- auth-service/         # Xac thuc
|   |-- authz-service/        # Phan quyen
|   |-- processing-service/   # Chay code
|   |-- elearn-db/            # CRUD MongoDB
|   |-- docker-compose.yml
|
|-- elearn-fe/                # Frontend hoc vien
|-- manage-fe/                # Frontend giao vien
|-- center-fe/                # Frontend admin/staff
|-- meeting-fe/               # Frontend hop video
|-- messenger-fe/             # Frontend nhan tin
|-- forum-fe/                 # Frontend forum
|-- livedoc-fe/               # Frontend tai lieu
|
|-- docs/                     # Tai lieu du an (ban dang doc)
|-- credentials.txt           # Tai khoan mau
|-- seed-users.json           # Du lieu seed
|-- reset-all.ps1             # Script reset + seed
```
