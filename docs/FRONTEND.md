# Frontend Applications - Chi Tiet

## Tong Quan

Tat ca frontend deu la ung dung **Next.js** su dung **App Router**. Chung dung chung:
- API Gateway tai `http://localhost:3000`
- Xac thuc bang JWT cookie (`access_token` / `refresh_token`)
- Next.js middleware de bao ve route

---

## 1. elearn-fe - Giao Dien Hoc Vien (Port 3004)

**Stack**: Next.js 14.1, React 18, Redux Toolkit, Bootstrap 5 + SCSS, TypeScript, Monaco Editor

### Tinh Nang Chinh

| Tinh Nang | Mo Ta |
|-----------|-------|
| Dang ky/Dang nhap | Sign in, Sign up, Quen mat khau (OTP fake 123456) |
| Xem khoa hoc | Danh sach khoa hoc cong khai, tim kiem, loc |
| Dashboard | Khoa hoc da dang ky, profile, settings, lich su |
| Lam bai tap | Trac nghiem (auto-score) va tu luan, co timer + deadline |
| Lap trinh | Giai bai kieu LeetCode voi Monaco editor |
| Tutorial | Huong dan lap trinh theo buoc (interactive) |
| Playground | Sandbox tu do viet code C++/Python/Java |
| Gio hang | Them khoa hoc, thanh toan |
| Danh gia | Viet review cho khoa hoc |
| Messenger | Nut chat noi den messenger-fe |

### Trang Quan Trong

| URL | Chuc Nang |
|-----|-----------|
| `/` | Trang chu |
| `/sign-in`, `/sign-up` | Dang nhap, dang ky |
| `/course/:id` | Chi tiet khoa hoc |
| `/dashboard` | Dashboard hoc vien |
| `/dashboard/enrolled-courses` | Khoa hoc da ghi danh |
| `/dashboard/assignments/:courseId` | Bai tap cua khoa hoc |
| `/dashboard/assignments/:courseId/take/:assignmentId` | Lam bai tap |
| `/programming` | Danh sach bai tap lap trinh |
| `/programming/:id` | Giai bai tap lap trinh |
| `/programming/tutorial/:id` | Lam tutorial |
| `/programming/playground` | Playground tu do |
| `/programming/submissions` | Lich su nop bai |
| `/shop` | Cua hang khoa hoc |
| `/cart` | Gio hang |

### State Management
- **Redux Toolkit**: cart, courses, products, wishlist slices
- **React Context**: AuthContext (user, login, logout, refresh)

### Bien Moi Truong
```env
NEXT_PUBLIC_API_GATEWAY_URL=http://localhost:3000
```

---

## 2. manage-fe - Giao Dien Giao Vien (Port 3005)

**Stack**: Next.js 15.3, React 19, Tailwind CSS, Zod + React Hook Form, Google Gemini AI, TypeScript

### Tinh Nang Chinh

| Tinh Nang | Mo Ta |
|-----------|-------|
| Quan ly khoa hoc | CRUD khoa hoc, loc theo cap do |
| Quan ly chuong | CRUD session trong khoa hoc |
| Quan ly bai hoc | 3 loai: video (YouTube), tai lieu (rich text), online (phong hop) |
| Quan ly bai tap | Tao bai trac nghiem va tu luan |
| Cham diem | 3 che do: Thu cong, Tu dong (trac nghiem), AI (Gemini) |
| AI Lesson Plan | Tao ke hoach bai hoc tu dong (Gemini AI), tuan thu chuong trinh VN |
| Bai tap lap trinh | Tao bai voi test cases, templates, tutorials, hints |
| Quan ly hoc vien | Xem hoc vien ghi danh, trang thai thanh toan |
| Phong hop | Tao va quan ly danh sach tham gia |
| Ung tuyen | Nop don ung tuyen giao vien (upload CMND + CV) |
| Settings | Cap nhat profile, doi mat khau |

### Trang Quan Trong

| URL | Chuc Nang |
|-----|-----------|
| `/` | Dashboard giao vien |
| `/courses` | Danh sach khoa hoc |
| `/courses/[courseId]` | Chi tiet khoa hoc |
| `/courses/[courseId]/sessions/[sessionId]` | Chi tiet session |
| `/grading/[assignmentId]` | Cham diem |
| `/plans` | Danh sach AI lesson plans |
| `/plan/[planId]` | Chi tiet lesson plan |
| `/problems` | Quan ly bai tap lap trinh |
| `/apply` | Nop don ung tuyen |
| `/settings` | Cai dat tai khoan |

### API Routes (Server-side)
- `POST /api/ai/lesson-plan` - Goi Google Gemini tao ke hoach bai hoc (913 dong, prompt phuc tap)
- `POST /api/ai/grade-attempt` - Goi Google Gemini cham diem bai tu luan

### Bien Moi Truong
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
GEMINI_API_KEY=your_gemini_key  # Cho AI features
```

---

## 3. center-fe - Giao Dien Admin/Staff (Port 3006)

**Stack**: Next.js 15.3, React 19, Tailwind CSS, Zod + React Hook Form, Google Gemini AI, TypeScript

> **Luu y**: center-fe la **superset** cua manage-fe. Bao gom tat ca tinh nang cua manage-fe CONG THEM cac tinh nang quan tri.

### Tinh Nang Rieng (Khong Co Trong manage-fe)

| Tinh Nang | Vai Tro | Mo Ta |
|-----------|---------|-------|
| Dashboard KPI | admin/manager/accountant | Tong khoa hoc, hoc vien, doanh thu, rating |
| Phan Tich Doanh Thu | admin/manager/accountant | Revenue summary, trend chart, breakdown theo teacher/course/category |
| Quan Ly Giao Vien | admin/manager/recruiter | CRUD giao vien, duyet don ung tuyen |
| Quan Ly Nhan Vien | admin only | CRUD staff (admin/manager/recruiter/accountant) |
| Phan Tich Hoc Vien | admin/manager | Phan khuc (new/active/at_risk/churned), LTV, AOV |
| Dong Bo Du Lieu | admin only | Sync teachers va courses giua auth-db va MongoDB |
| Tao User Bi Mat | dev only | API endpoint tao staff account voi secret key |

### Phan Quyen Theo Vai Tro

| Chuc Nang | admin | manager | recruiter | accountant |
|-----------|-------|---------|-----------|------------|
| Dashboard KPI | x | x | | x |
| Phan tich doanh thu | x | x | | x |
| Quan ly giao vien | x | x | x | |
| Duyet don ung tuyen | x | x | x | |
| Xoa giao vien | x | x | | |
| Quan ly nhan vien | x | | | |
| Quan ly hoc vien | x | x | | |
| Dong bo du lieu | x | | | |
| Quan ly khoa hoc | x | x | | |

### Custom Components
- **BarList**: Bieu do thanh ngang (doanh thu theo danh muc)
- **Sparkline**: Bieu do xu huong SVG
- **DetailDialog**: Modal drill-down chi tiet

### API Routes
- `POST /api/ai/lesson-plan` - Tuong tu manage-fe
- `POST /api/secret/create-user` - Tao staff account (can CENTER_SECRET_KEY)

### Bien Moi Truong
```env
NEXT_PUBLIC_API_GATEWAY_URL=http://localhost:3000
GEMINI_API_KEY=your_gemini_key
CENTER_SECRET_KEY=your_secret_key  # Cho endpoint tao user bi mat
```

---

## 4. messenger-fe - Nhan Tin (Port 3008)

**Stack**: Next.js 14.2, React 18, Tailwind CSS, Liveblocks, TypeScript

### Tinh Nang

| Tinh Nang | Mo Ta |
|-----------|-------|
| Tin nhan truc tiep (DM) | Chat 1-1, room ID: `dm__user1__user2` |
| Nhom chat | Chat nhom, room ID: `grp__uuid`, can ten + 2 thanh vien |
| Tin nhan van ban | Gui text |
| Tin nhan hinh anh | Gui anh (data URL, max 2MB, paste-to-send) |
| Tim kiem user | Tim theo ten hoac username (debounced) |
| Trang thai online | Hien thi so nguoi online |
| Sidebar | Danh sach phong, sap xep theo updatedAt |

### Cong Nghe Dac Biet
- **Liveblocks**: Quan ly trang thai realtime (LiveList cho tin nhan, presence cho online)
- Khong can chat server rieng - Liveblocks xu ly sync

### API Routes
- `GET /api/rooms` - Danh sach phong cua user
- `POST /api/rooms/dm` - Tao phong DM
- `POST /api/rooms/group` - Tao phong nhom
- `POST /api/liveblocks-auth` - Xac thuc Liveblocks session

### Bien Moi Truong
```env
NEXT_PUBLIC_API_GATEWAY_URL=http://localhost:3000
LIVEBLOCKS_PUBLIC_KEY=your_key
LIVEBLOCKS_SECRET_KEY=your_secret
```

---

## 5. meeting-fe - Hop Video (Port 3007)

**Stack**: Next.js, Stream Video SDK

> **Trang thai**: Chua hoan thien day du. manage-fe da tao phong hop va allowlist cho bai hoc "online".

### Bien Moi Truong
```env
NEXT_PUBLIC_API_GATEWAY_URL=http://localhost:3000
NEXT_PUBLIC_STREAM_API_KEY=your_key
STREAM_SECRET_KEY=your_secret
```

---

## 6. forum-fe - Forum Q&A (Port 3009)

**Stack**: Next.js, TinyMCE editor

> Giao dien Q&A kieu StackOverflow. Su dung API `/api/elearn/forum/*` qua gateway.

### Tinh Nang Du Kien
- Dat cau hoi voi tags
- Tra loi cau hoi
- Vote (upvote/downvote) cau hoi va tra loi
- Tim kiem cau hoi
- Xem profile va reputation

### Bien Moi Truong
```env
NEXT_PUBLIC_API_GATEWAY_URL=http://localhost:3000
NEXT_PUBLIC_TINY_MCE_API_KEY=your_key
GEMINI_API_KEY=your_key          # AI helper (optional)
DEEPINFRA_API_KEY=your_key       # AI helper (optional)
```

---

## 7. livedoc-fe - Tai Lieu Cong Tac (Port 3011)

**Stack**: Next.js, Liveblocks

> Soan tai lieu cong tac (collaborative editing) su dung Liveblocks realtime.

### Bien Moi Truong
```env
NEXT_PUBLIC_API_GATEWAY_URL=http://localhost:3000
LIVEBLOCKS_SECRET_KEY=your_secret
```

---

## Pattern Chung Giua Cac Frontend

### Xac Thuc
1. Middleware Next.js kiem tra `access_token` cookie
2. Neu khong co token -> redirect den `/sign-in`
3. Verify token bang `jose` library (khong can goi backend)
4. AuthContext/AuthProvider goi `/api/auth/me` de lay user info
5. Khi token het han -> tu dong goi `/api/auth/refresh`

### Goi API
- Tat ca frontend goi API qua API Gateway (`NEXT_PUBLIC_API_GATEWAY_URL`)
- Su dung `fetch` hoac `axios` voi `credentials: 'include'` de gui cookies
- manage-fe va center-fe co file `lib/api.ts` tap trung tat ca API calls

### Responsive
- elearn-fe: Bootstrap 5 responsive
- manage-fe, center-fe: Tailwind responsive
- messenger-fe: Tailwind, dark theme
