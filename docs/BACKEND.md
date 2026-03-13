# Backend Services - Chi Tiet

## 1. API Gateway (Port 3000)

**Thu muc**: `backend/api-gateway/`
**Cong nghe**: Express.js, http-proxy-middleware

### Chuc nang
- **Reverse proxy**: dinh tuyen request den cac backend service
- **CORS**: cau hinh cho phep cac frontend (port 3004-3009)
- **Rate limiting**: 100 req/15min (prod), 1000 req/15min (dev)
- **Security**: Helmet.js, cookie parser
- **Token forwarding**: Tu dong extract `access_token` tu cookie va chuyen thanh `Authorization: Bearer` header khi proxy den elearn-db
- **Logging**: Log tat ca request/response

### Routing Rules

```
/api/auth/*     --> Auth Service (:3001)     | /api/auth -> /
/api/authz/*    --> AuthZ Service (:3002)    | Giu nguyen
/api/process/*  --> Processing (:3003)       | Giu nguyen
/api/elearn/*   --> Elearn DB (:3010)        | /api/elearn -> /api
/elearn/uploads --> Elearn DB (:3010)        | /elearn/uploads -> /uploads
```

### Files
- `src/index.js` - File chinh, cau hinh proxy va middleware

---

## 2. Auth Service (Port 3001)

**Thu muc**: `backend/auth-service/`
**Cong nghe**: Express.js, Sequelize (PostgreSQL), JWT, bcrypt, Redis
**Database**: `auth-db` (PostgreSQL) + Redis

### Model: User (PostgreSQL)

| Field | Type | Mo Ta |
|-------|------|-------|
| id | UUID (PK) | Auto-generated UUID v4 |
| username | STRING | Unique, 3-30 ky tu |
| email | STRING | Unique, validate email |
| password | STRING | Bcrypt hash (auto-hash truoc khi luu) |
| role | ENUM | admin, teacher, student, recruiter, parent, accountant, manager |
| isActive | BOOLEAN | Default true |
| lastLogin | DATE | Cap nhat khi dang nhap |

### API Endpoints

| Method | Path | Mo Ta | Xac Thuc |
|--------|------|-------|----------|
| POST | `/register` | Dang ky tai khoan moi | Khong |
| POST | `/login` | Dang nhap | Khong |
| POST | `/refresh` | Lam moi access token | Refresh token |
| POST | `/logout` | Dang xuat (1 thiet bi) | Refresh token |
| POST | `/logout-all` | Dang xuat tat ca thiet bi | Refresh token |
| GET | `/me` | Lay thong tin user hien tai | Access token |
| PUT | `/password` | Doi mat khau | Access token |
| PUT | `/profile` | Cap nhat email | Access token |
| POST | `/forgot-password` | Gui OTP (fake: luon la 123456) | Khong |
| POST | `/reset-password` | Reset mat khau voi OTP | Khong |
| GET | `/users` | Danh sach users (manager/admin) | Access token + role |
| PATCH | `/users/:id` | Cap nhat user (admin only) | Access token + admin |
| DELETE | `/users/:id` | Xoa user (manager/admin) | Access token + role |

### Co Che Xac Thuc

1. **Dang nhap**: Verify password voi bcrypt -> Tao JWT access + refresh token
2. **Token storage**: Refresh token luu trong Redis (Hash: `user:{id}:tokens`, field: `deviceId`)
3. **Cookie**: 3 cookies (httpOnly):
   - `access_token` (1 ngay)
   - `refresh_token` (7 ngay)
   - `device_id` (1 nam)
4. **Refresh flow**: Verify refresh token -> Kiem tra Redis -> Tao token moi -> Cap nhat Redis

### Scripts
- `src/scripts/seed-users.js` - Seed tai khoan mau (admin, manager, teacher, student)
- `src/scripts/wipe-all-users.js` - Xoa tat ca users

---

## 3. AuthZ Service (Port 3002)

**Thu muc**: `backend/authz-service/`
**Cong nghe**: Express.js, Sequelize (PostgreSQL), Casbin
**Database**: `authz-db` (PostgreSQL)

### Models

**Role**:
| Field | Type |
|-------|------|
| id | UUID (PK) |
| name | STRING (unique) |
| description | STRING |

**Permission**:
| Field | Type |
|-------|------|
| id | UUID (PK) |
| resource | STRING |
| action | STRING |
| description | STRING |

### API Endpoints

| Method | Path | Mo Ta |
|--------|------|-------|
| POST | `/api/authz/check` | Kiem tra quyen (role, resource, action) |
| GET | `/api/authz/permissions` | Lay danh sach quyen cua user |
| POST | `/api/authz/policies` | Them policy (chi admin) |

### Casbin RBAC
- Su dung Casbin enforcer voi model RBAC
- Policy duoc luu trong PostgreSQL
- Kiem tra quyen: `enforcer.enforce(role, resource, action)` -> true/false

---

## 4. Processing Service (Port 3003)

**Thu muc**: `backend/processing-service/`
**Cong nghe**: Express.js
**Phu thuoc**: g++ (C++17), python3, javac/java

### Chuc Nang
Nhan source code, bien dich va chay, tra ve ket qua.

### API Endpoints

| Method | Path | Mo Ta |
|--------|------|-------|
| POST | `/api/process/submit` | Gui va chay code |

### Request Body

```json
{
  "mainCode": "source code string",
  "inputData": "stdin input",
  "expectedOutput": "expected stdout",
  "language": "cpp | python | java",
  "problemId": "optional problem id"
}
```

### Cau Hinh Ngon Ngu

| Language | Extension | Compile | Time Limit |
|----------|-----------|---------|------------|
| C++ | .cpp | `g++ -std=c++17` | 5 giay |
| Python | .py | Khong can | 10 giay |
| Java | .java | `javac` | 8 giay |

### Quy Trinh Xu Ly
1. Tao thu muc tam (`temp/{submissionId}/`)
2. Ghi source code, input file, expected output file
3. Bien dich (C++/Java) - tra ve `compilation_error` neu loi
4. Chay chuong trinh voi input - tra ve `runtime_error` hoac `time_limit_exceeded` neu loi
5. So sanh actual output voi expected output (normalize line endings)
6. Tra ve ket qua: `accepted`, `wrong_answer`, hoac `success` (neu khong co expected output)
7. Don dep thu muc tam

---

## 5. Elearn DB Service (Port 3010)

**Thu muc**: `backend/elearn-db/`
**Cong nghe**: Express.js, Mongoose (MongoDB)
**Database**: MongoDB (`elearn-test` database)

Day la service chinh chua tat ca du lieu hoc tap. Xem chi tiet models trong `docs/DATABASE.md` va API endpoints trong `docs/API.md`.

### Cac Module Route

| Route Prefix | Mo Ta |
|-------------|-------|
| `/api/user` | Quan ly profile nguoi dung (MongoDB) |
| `/api/course` | CRUD khoa hoc |
| `/api/session` | CRUD session (chuong) trong khoa hoc |
| `/api/lesson` | CRUD bai hoc trong session |
| `/api/assignment` | CRUD bai tap |
| `/api/attempt` | Nop bai va cham diem |
| `/api/cart` | Gio hang |
| `/api/enroll` | Ghi danh khoa hoc |
| `/api/feedback` | Danh gia khoa hoc |
| `/api/problems` | Bai tap lap trinh (LeetCode-style) |
| `/api/submissions` | Lich su nop bai lap trinh |
| `/api/lesson-plan` | Ke hoach bai hoc AI |
| `/api/teacher-applications` | Don ung tuyen giao vien |
| `/api/analytics` | Thong ke doanh thu, hoc vien |
| `/api/meeting/allowlist` | Danh sach tham gia phong hop |
| `/api/admin` | Dong bo du lieu (admin only) |
| `/api/forum` | Forum Q&A |

### Middleware
- **auth.middleware.js**: Verify JWT tu header `Authorization: Bearer`, gan `req.user`
- **upload.middleware.js**: Upload file (multer)
- **teacherApplicationUpload.middleware.js**: Upload file ung tuyen giao vien (ID card, CV)

### Seeders
- `src/seeders/seed-elearn-test.js` - Seed khoa hoc, session, bai hoc, bai tap, ghi danh
- `src/seeders/seed-programming-problems.js` - Seed 50 bai tap lap trinh voi test cases

### Migration Scripts
- `migration-fix-lessons.js` - Fix cau truc bai hoc
- `migration-fix-locked.js` - Fix trang thai khoa bai hoc
