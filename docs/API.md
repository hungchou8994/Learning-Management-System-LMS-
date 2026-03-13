# API Endpoints Chi Tiet

> Tat ca API goi qua API Gateway tai `http://localhost:3000`.
> Frontend su dung cookie-based auth (httpOnly `access_token`).

---

## 1. Authentication API (`/api/auth`)

Proxy den Auth Service (:3001).

| Method | Endpoint | Mo Ta | Auth |
|--------|----------|-------|------|
| POST | `/api/auth/register` | Dang ky tai khoan | - |
| POST | `/api/auth/login` | Dang nhap | - |
| POST | `/api/auth/refresh` | Lam moi token | Refresh token |
| POST | `/api/auth/logout` | Dang xuat (1 device) | Refresh token |
| POST | `/api/auth/logout-all` | Dang xuat tat ca device | Refresh token |
| GET | `/api/auth/me` | Lay user hien tai | Access token |
| PUT | `/api/auth/password` | Doi mat khau | Access token |
| PUT | `/api/auth/profile` | Cap nhat email | Access token |
| POST | `/api/auth/forgot-password` | Yeu cau OTP reset | - |
| POST | `/api/auth/reset-password` | Reset mat khau (OTP=123456) | - |
| GET | `/api/auth/users` | List users (manager/admin) | Access token + role |
| PATCH | `/api/auth/users/:id` | Cap nhat user (admin) | Access token + admin |
| DELETE | `/api/auth/users/:id` | Xoa user (manager/admin) | Access token + role |

### Chi tiet Request/Response

**POST /api/auth/login**
```json
// Request
{ "username": "student_001", "password": "SkillGro2026S001a" }

// Response (200) + Set-Cookie: access_token, refresh_token, device_id
{
  "status": "success",
  "data": {
    "user": { "id": "uuid", "username": "student_001", "email": "...", "role": "student" },
    "deviceId": "device_123"
  }
}
```

**POST /api/auth/register**
```json
// Request
{ "username": "newuser", "email": "new@example.com", "password": "Pass123!", "role": "student" }
```

**POST /api/auth/forgot-password**
```json
// Request
{ "username": "student_001" }

// Response - OTP luon la 123456
{ "status": "success", "data": { "otp": "123456", "emailMasked": "s***1@s***o.l***l" } }
```

---

## 2. Authorization API (`/api/authz`)

Proxy den AuthZ Service (:3002).

| Method | Endpoint | Mo Ta | Auth |
|--------|----------|-------|------|
| POST | `/api/authz/check` | Kiem tra quyen | Bearer token |
| GET | `/api/authz/permissions` | Lay danh sach quyen | Bearer token |
| POST | `/api/authz/policies` | Them policy (admin) | Bearer token |

**POST /api/authz/check**
```json
// Request
{ "resource": "course", "action": "create" }

// Response
{ "status": "success", "data": { "allowed": true } }
```

---

## 3. Processing API (`/api/process`)

Proxy den Processing Service (:3003).

| Method | Endpoint | Mo Ta |
|--------|----------|-------|
| POST | `/api/process/submit` | Chay code |

**POST /api/process/submit**
```json
// Request
{
  "mainCode": "#include <iostream>\nusing namespace std;\nint main() { cout << \"Hello\"; }",
  "inputData": "",
  "expectedOutput": "Hello",
  "language": "cpp",
  "problemId": "optional_id"
}

// Response (accepted)
{
  "status": "success",
  "result": {
    "status": "accepted",
    "actualOutput": "Hello",
    "expectedOutput": "Hello",
    "isCorrect": true,
    "executionTime": 45,
    "language": "cpp"
  }
}

// Response (compilation_error)
{ "status": "compilation_error", "message": "Compilation failed", "error": "..." }

// Response (time_limit_exceeded)
{ "status": "time_limit_exceeded", "message": "Time limit exceeded (5000ms)" }
```

---

## 4. Elearn Data API (`/api/elearn`)

Proxy den Elearn DB Service (:3010). Path `/api/elearn/*` duoc rewrite thanh `/api/*`.

### 4.1 User Profile (`/api/elearn/user`)

| Method | Endpoint | Mo Ta | Auth |
|--------|----------|-------|------|
| GET | `/api/elearn/user/profile` | Lay profile cua minh | JWT |
| PUT | `/api/elearn/user/profile` | Cap nhat profile | JWT |
| GET | `/api/elearn/user/profile/:username` | Lay profile theo username | - |
| POST | `/api/elearn/user/profiles` | Lay nhieu profiles (batch) | - |
| GET | `/api/elearn/user/search` | Tim user theo ten/username | - |

### 4.2 Courses (`/api/elearn/course`)

| Method | Endpoint | Mo Ta | Auth |
|--------|----------|-------|------|
| GET | `/api/elearn/course` | Danh sach khoa hoc (public) | - |
| GET | `/api/elearn/course/:id` | Chi tiet khoa hoc | - |
| POST | `/api/elearn/course` | Tao khoa hoc | JWT (teacher) |
| PUT | `/api/elearn/course/:id` | Cap nhat khoa hoc | JWT (teacher) |
| DELETE | `/api/elearn/course/:id` | Xoa khoa hoc | JWT (teacher) |
| GET | `/api/elearn/course/instructor/:username` | Khoa hoc theo giao vien | - |

### 4.3 Sessions (`/api/elearn/session`)

| Method | Endpoint | Mo Ta | Auth |
|--------|----------|-------|------|
| GET | `/api/elearn/session/course/:courseId` | Danh sach session cua khoa hoc | - |
| GET | `/api/elearn/session/:id` | Chi tiet session | - |
| POST | `/api/elearn/session` | Tao session | JWT |
| PUT | `/api/elearn/session/:id` | Cap nhat session | JWT |
| DELETE | `/api/elearn/session/:id` | Xoa session | JWT |

### 4.4 Lessons (`/api/elearn/lesson`)

| Method | Endpoint | Mo Ta | Auth |
|--------|----------|-------|------|
| GET | `/api/elearn/lesson/session/:sessionId` | Danh sach lesson cua session | - |
| GET | `/api/elearn/lesson/:id` | Chi tiet lesson | - |
| POST | `/api/elearn/lesson` | Tao lesson | JWT |
| PUT | `/api/elearn/lesson/:id` | Cap nhat lesson | JWT |
| DELETE | `/api/elearn/lesson/:id` | Xoa lesson | JWT |

### 4.5 Assignments (`/api/elearn/assignment`)

| Method | Endpoint | Mo Ta | Auth |
|--------|----------|-------|------|
| GET | `/api/elearn/assignment/session/:sessionId` | Bai tap cua session | - |
| GET | `/api/elearn/assignment/:id` | Chi tiet bai tap | - |
| POST | `/api/elearn/assignment` | Tao bai tap | JWT |
| PUT | `/api/elearn/assignment/:id` | Cap nhat bai tap | JWT |
| DELETE | `/api/elearn/assignment/:id` | Xoa bai tap | JWT |

### 4.6 Attempts (`/api/elearn/attempt`)

| Method | Endpoint | Mo Ta | Auth |
|--------|----------|-------|------|
| POST | `/api/elearn/attempt` | Nop bai lam | JWT |
| GET | `/api/elearn/attempt/assignment/:assignmentId` | Danh sach bai nop cua bai tap | JWT |
| GET | `/api/elearn/attempt/user` | Bai nop cua user hien tai | JWT |
| GET | `/api/elearn/attempt/:id` | Chi tiet bai nop | JWT |
| PUT | `/api/elearn/attempt/:id/grade` | Cham diem (teacher) | JWT |

### 4.7 Cart (`/api/elearn/cart`)

| Method | Endpoint | Mo Ta | Auth |
|--------|----------|-------|------|
| GET | `/api/elearn/cart` | Lay gio hang | JWT |
| POST | `/api/elearn/cart/add` | Them khoa hoc vao gio | JWT |
| DELETE | `/api/elearn/cart/remove/:courseId` | Xoa khoa hoc khoi gio | JWT |
| POST | `/api/elearn/cart/checkout` | Thanh toan | JWT |

### 4.8 Enrollment (`/api/elearn/enroll`)

| Method | Endpoint | Mo Ta | Auth |
|--------|----------|-------|------|
| GET | `/api/elearn/enroll/user` | Khoa hoc da ghi danh | JWT |
| GET | `/api/elearn/enroll/course/:courseId` | Hoc vien cua khoa hoc | JWT |
| POST | `/api/elearn/enroll` | Ghi danh khoa hoc | JWT |
| PUT | `/api/elearn/enroll/:id` | Cap nhat trang thai thanh toan | JWT |

### 4.9 Feedback (`/api/elearn/feedback`)

| Method | Endpoint | Mo Ta | Auth |
|--------|----------|-------|------|
| GET | `/api/elearn/feedback/course/:courseId` | Danh gia cua khoa hoc | - |
| POST | `/api/elearn/feedback` | Gui danh gia | JWT |
| PUT | `/api/elearn/feedback/:id` | Cap nhat danh gia | JWT |
| DELETE | `/api/elearn/feedback/:id` | Xoa danh gia | JWT |

### 4.10 Problems - Bai Tap Lap Trinh (`/api/elearn/problems`)

| Method | Endpoint | Mo Ta | Auth |
|--------|----------|-------|------|
| GET | `/api/elearn/problems` | Danh sach bai tap (filters: rank, language, tutorial) | - |
| GET | `/api/elearn/problems/:id` | Chi tiet bai tap | - |
| POST | `/api/elearn/problems` | Tao bai tap | JWT (teacher) |
| PUT | `/api/elearn/problems/:id` | Cap nhat bai tap | JWT (teacher) |
| DELETE | `/api/elearn/problems/:id` | Xoa bai tap | JWT (teacher) |

### 4.11 Submissions - Nop Bai Lap Trinh (`/api/elearn/submissions`)

| Method | Endpoint | Mo Ta | Auth |
|--------|----------|-------|------|
| POST | `/api/elearn/submissions` | Nop bai giai | JWT |
| GET | `/api/elearn/submissions/user` | Lich su nop bai cua user | JWT |
| GET | `/api/elearn/submissions/problem/:problemId` | Bai nop cua 1 bai tap | JWT |
| GET | `/api/elearn/submissions/:id` | Chi tiet bai nop | JWT |

### 4.12 AI Lesson Plan (`/api/elearn/lesson-plan`)

| Method | Endpoint | Mo Ta | Auth |
|--------|----------|-------|------|
| POST | `/api/elearn/lesson-plan` | Tao ke hoach bai hoc | JWT |
| GET | `/api/elearn/lesson-plan` | Danh sach ke hoach | JWT |
| GET | `/api/elearn/lesson-plan/:id` | Chi tiet ke hoach | JWT |
| PUT | `/api/elearn/lesson-plan/:id` | Cap nhat ke hoach | JWT |
| DELETE | `/api/elearn/lesson-plan/:id` | Xoa ke hoach | JWT |

### 4.13 Teacher Applications (`/api/elearn/teacher-applications`)

| Method | Endpoint | Mo Ta | Auth |
|--------|----------|-------|------|
| POST | `/api/elearn/teacher-applications` | Nop don ung tuyen | Multipart form |
| GET | `/api/elearn/teacher-applications` | Danh sach don | JWT (manager/admin) |
| GET | `/api/elearn/teacher-applications/:id` | Chi tiet don | JWT |
| PATCH | `/api/elearn/teacher-applications/:id/status` | Duyet/tu choi | JWT (manager/admin) |

### 4.14 Analytics (`/api/elearn/analytics`)

| Method | Endpoint | Mo Ta | Auth |
|--------|----------|-------|------|
| GET | `/api/elearn/analytics/revenue/summary` | Tong quan doanh thu | JWT (admin/manager/accountant) |
| GET | `/api/elearn/analytics/revenue/trend` | Xu huong doanh thu theo thoi gian | JWT |
| GET | `/api/elearn/analytics/revenue/by-course` | Doanh thu theo khoa hoc | JWT |
| GET | `/api/elearn/analytics/revenue/by-teacher` | Doanh thu theo giao vien | JWT |
| GET | `/api/elearn/analytics/revenue/by-category` | Doanh thu theo danh muc | JWT |
| GET | `/api/elearn/analytics/students` | Thong ke hoc vien | JWT |

### 4.15 Meeting AllowList (`/api/elearn/meeting/allowlist`)

| Method | Endpoint | Mo Ta | Auth |
|--------|----------|-------|------|
| GET | `/api/elearn/meeting/allowlist/:roomId` | Lay allowlist phong hop | JWT |
| PUT | `/api/elearn/meeting/allowlist/:roomId` | Upsert allowlist | JWT |

### 4.16 Admin (`/api/elearn/admin`)

| Method | Endpoint | Mo Ta | Auth |
|--------|----------|-------|------|
| POST | `/api/elearn/admin/sync-teachers` | Dong bo giao vien (auth <-> elearn) | JWT (admin) |
| POST | `/api/elearn/admin/sync-courses` | Dong bo thong ke khoa hoc | JWT (admin) |

### 4.17 Forum (`/api/elearn/forum`)

| Method | Endpoint | Mo Ta | Auth |
|--------|----------|-------|------|
| GET | `/api/elearn/forum/questions` | Danh sach cau hoi | - |
| GET | `/api/elearn/forum/questions/:id` | Chi tiet cau hoi | - |
| POST | `/api/elearn/forum/questions` | Dat cau hoi | JWT |
| PUT | `/api/elearn/forum/questions/:id` | Sua cau hoi | JWT |
| DELETE | `/api/elearn/forum/questions/:id` | Xoa cau hoi | JWT |
| POST | `/api/elearn/forum/questions/:id/vote` | Vote cau hoi | JWT |
| POST | `/api/elearn/forum/answers` | Tra loi | JWT |
| PUT | `/api/elearn/forum/answers/:id` | Sua tra loi | JWT |
| DELETE | `/api/elearn/forum/answers/:id` | Xoa tra loi | JWT |
| POST | `/api/elearn/forum/answers/:id/vote` | Vote tra loi | JWT |
| GET | `/api/elearn/forum/tags` | Danh sach tags | - |
| GET | `/api/elearn/forum/users/:username/stats` | Thong ke user forum | - |

---

## 5. Health Check APIs

| Method | Endpoint | Service |
|--------|----------|---------|
| GET | `/health` | API Gateway - tong hop status |
| POST | `/health/check` | API Gateway - chi tiet voi timestamp |

---

## 6. File Uploads

Files duoc serve tai:
- `http://localhost:3000/elearn/uploads/<filename>` (qua API Gateway)
- `http://localhost:3010/uploads/<filename>` (truc tiep den elearn-db)

Upload duoc xu ly boi middleware multer trong elearn-db service.
