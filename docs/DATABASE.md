# Cau Truc Database

## Tong Quan

Du an su dung 4 databases:
- **auth-db** (PostgreSQL) - Tai khoan dang nhap
- **authz-db** (PostgreSQL) - Quyen han
- **processing-db** (PostgreSQL) - Processing service (hien chua su dung nhieu)
- **MongoDB** - Du lieu hoc tap chinh (elearn-db service)

---

## 1. Auth Database (PostgreSQL - Port 5435)

### Bang: Users

| Column | Type | Constraints | Mo Ta |
|--------|------|-------------|-------|
| id | UUID | PK, auto UUIDV4 | ID duy nhat |
| username | VARCHAR | NOT NULL, UNIQUE, len 3-30 | Ten dang nhap |
| email | VARCHAR | NOT NULL, UNIQUE, isEmail | Email |
| password | VARCHAR | NOT NULL | Bcrypt hash |
| role | ENUM | Default 'student' | admin/teacher/student/recruiter/parent/accountant/manager |
| isActive | BOOLEAN | Default true | Trang thai tai khoan |
| lastLogin | TIMESTAMP | Nullable | Lan dang nhap cuoi |
| createdAt | TIMESTAMP | Auto | Ngay tao |
| updatedAt | TIMESTAMP | Auto | Ngay cap nhat |

**Hooks:**
- `beforeCreate`: Tu dong hash password bang bcrypt (salt 10)
- `beforeUpdate`: Tu dong re-hash neu password thay doi

---

## 2. AuthZ Database (PostgreSQL - Port 5433)

### Bang: Roles

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| name | VARCHAR | UNIQUE, NOT NULL |
| description | VARCHAR | Nullable |

### Bang: Permissions

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| resource | VARCHAR | NOT NULL |
| action | VARCHAR | NOT NULL |
| description | VARCHAR | Nullable |

*Casbin policies cung duoc luu trong database nay.*

---

## 3. MongoDB - Du Lieu Hoc Tap (Port 27017)

### Collection: Users (Profile)

> **Chu y**: Day la profile bo sung, KHONG phai tai khoan dang nhap. Tai khoan luu o auth-db.

| Field | Type | Mo Ta |
|-------|------|-------|
| username | String (unique) | Lien ket voi auth-db qua username |
| firstName | String | Ho |
| lastName | String | Ten |
| address | String | Dia chi |
| dob | Date | Ngay sinh |
| bio | String | Gioi thieu ban than |
| phoneNumber | String | So dien thoai |
| avatarUrl | String | URL anh dai dien |
| coverUrl | String | URL anh bia |
| skill | String | Ky nang |
| socialShare | [String] | Cac link mang xa hoi |

### Collection: Courses

| Field | Type | Mo Ta |
|-------|------|-------|
| name | String (required) | Ten khoa hoc |
| description | String (required) | Mo ta chi tiet |
| shortDescription | String | Mo ta ngan |
| originalPrice | Number (required) | Gia goc |
| salePrice | Number | Gia khuyen mai |
| thumbnail | String | URL anh thumbnail |
| targets | [String] | Muc tieu khoa hoc |
| requirements | [String] | Yeu cau tien quyet |
| sessions | [ObjectId -> Session] | Danh sach chuong hoc |
| certificate | Boolean (default: false) | Co cap chung chi khong |
| level | Number (default: 1) | Cap do (1=beginner, 2=intermediate, 3=advanced) |
| instructorId | ObjectId -> User (required) | Giao vien tao khoa hoc |
| tag | String | Nhan/danh muc |
| totalStudents | Number (default: 0) | So hoc vien |
| rating | Number (0-5, default: 0) | Diem danh gia trung binh |

### Collection: Sessions (Chuong Hoc)

| Field | Type | Mo Ta |
|-------|------|-------|
| name | String (required) | Ten chuong |
| description | String | Mo ta |
| orderIndex | Number (required) | Thu tu sap xep |
| lessons | [ObjectId -> Lesson] | Danh sach bai hoc |
| courseId | ObjectId -> Course (required) | Thuoc khoa hoc nao |
| assignment | ObjectId -> Assignment | Bai tap cua chuong |

### Collection: Lessons (Bai Hoc)

| Field | Type | Mo Ta |
|-------|------|-------|
| title | String (required) | Tieu de bai hoc |
| type | Enum (required) | "video" / "document" / "online" |
| duration | Number (required) | Thoi luong (phut) |
| order_index | Number (required) | Thu tu sap xep |
| video_url | String | URL video (YouTube embed) |
| subtitle | String | Phu de |
| description | String (required) | Noi dung bai hoc |
| sessionId | ObjectId -> Session (required) | Thuoc session nao |
| locked | Boolean (default: true) | Bai hoc co bi khoa khong |

### Collection: Assignments (Bai Tap)

| Field | Type | Mo Ta |
|-------|------|-------|
| name | String (required) | Ten bai tap |
| description | String | Mo ta |
| gradingMode | Enum | "manual" / "auto" / "ai" |
| ratio | Number (required) | Ty le diem |
| duration | Number (required, min 1) | Thoi gian lam bai (phut) |
| deadline | Date (required) | Han nop |
| questions | [Question subdoc] | Danh sach cau hoi |
| sessionId | ObjectId -> Session (required) | Thuoc session nao |

**Question subdocument**:
| Field | Type | Mo Ta |
|-------|------|-------|
| title | String | Noi dung cau hoi |
| type | Enum | "multi_choice" / "assignment" |
| orderIndex | Number | Thu tu |
| options | [String] | Cac lua chon (trac nghiem) |
| correctAnswer | String | Dap an dung (AN voi student) |

### Collection: Attempts (Bai Nop)

| Field | Type | Mo Ta |
|-------|------|-------|
| username | String (required) | Nguoi nop |
| assignmentId | ObjectId -> Assignment (required) | Bai tap |
| grade | Number | Diem |
| feedback | String | Phan hoi tu giao vien/AI |
| gradedAt | Date | Ngay cham diem |
| gradingMode | Enum | "manual" / "auto" / "ai" |
| autoSummary.correct | Number | So cau dung (auto-grade) |
| autoSummary.total | Number | Tong so cau (auto-grade) |
| instructorId | ObjectId -> User | Nguoi cham |
| answers | [Mixed] | Cau tra loi cua hoc vien |

### Collection: Enrolls (Ghi Danh)

| Field | Type | Mo Ta |
|-------|------|-------|
| date | Date | Ngay ghi danh |
| status | Enum | "paid" / "not_paid" |
| paymentMethod | Enum | "cash" / "bank" |
| progress | Number (default: 0) | Tien do hoc (%) |
| username | String (required) | Hoc vien |
| courseId | ObjectId -> Course (required) | Khoa hoc |

**Indexes**: `(username, createdAt)`, `(courseId, createdAt)`, `(status, createdAt)`

### Collection: Feedbacks (Danh Gia)

| Field | Type | Mo Ta |
|-------|------|-------|
| date | Date | Ngay danh gia |
| rate | Number (1-5, required) | So sao |
| comment | String | Noi dung danh gia |
| title | String | Tieu de |
| userId | ObjectId -> User (required) | Nguoi danh gia |
| courseId | ObjectId -> Course (required) | Khoa hoc |

### Collection: Carts (Gio Hang)

| Field | Type | Mo Ta |
|-------|------|-------|
| username | String (unique, required) | Nguoi dung |
| course_ids | [ObjectId -> Course] | Khoa hoc trong gio hang |

### Collection: Problems (Bai Tap Lap Trinh)

| Field | Type | Mo Ta |
|-------|------|-------|
| title | String (required) | Ten bai |
| rank | Enum (required) | "S"/"A"/"B"/"C"/"D" (S=kho nhat) |
| description | String (required) | De bai (HTML/Markdown) |
| testCases | [TestCase subdoc] | Cac test case |
| author | ObjectId -> User (required) | Nguoi tao |
| tags | [String] | Tag |
| timeLimit | Number (default: 5000) | Gioi han thoi gian (ms) |
| memoryLimit | Number (default: 256000) | Gioi han bo nho (KB) |
| difficulty | Enum | Easy/Medium/Hard/Expert/Master |
| isPublic | Boolean (default: true) | Cong khai |
| solvedCount | Number | So nguoi giai duoc |
| totalSubmissions | Number | Tong so bai nop |
| acceptanceRate | Number (0-100) | Ty le chap nhan |
| languageTemplates | Object | Template code cho cpp/python/java |
| supportedLanguages | [String] | Ngon ngu ho tro |
| isInteractiveTutorial | Boolean | Co phai tutorial khong |
| tutorialSteps | [TutorialStep] | Cac buoc huong dan |
| hints | [Hint] | Goi y |

**TestCase subdocument**:
| Field | Type | Mo Ta |
|-------|------|-------|
| input | String | Input |
| output | String | Expected output |
| isHidden | Boolean | An voi hoc vien |
| points | Number | Diem |
| explanation | String | Giai thich |

### Collection: Submissions (Bai Nop Lap Trinh)

| Field | Type | Mo Ta |
|-------|------|-------|
| problemId | ObjectId -> Problem | Bai tap |
| userId | ObjectId -> User | Nguoi nop |
| language | Enum | cpp/python/java |
| code | String | Source code |
| status | Enum | accepted/partial/wrong_answer/runtime_error/compile_error/TLE |
| score | Number (0-100) | Diem |
| passedTestCases | Number | So test case dung |
| totalTestCases | Number | Tong test case |
| testResults | [TestResult] | Ket qua chi tiet tung test case |
| totalExecutionTime | Number | Tong thoi gian chay |

### Collection: ProgrammingProfiles

| Field | Type | Mo Ta |
|-------|------|-------|
| userId | ObjectId -> User (unique) | Nguoi dung |
| rating | Number (default: 1200) | Rating hien tai |
| maxRating | Number | Rating cao nhat |
| rank | Enum | Newbie -> Grandmaster (dua tren rating) |
| totalSolved | Number | Tong bai giai duoc |
| totalSubmissions | Number | Tong bai nop |
| currentStreak | Number | Chuoi giai lien tiep |
| longestStreak | Number | Chuoi dai nhat |
| languageStats | [LanguageStat] | Thong ke theo ngon ngu |
| rankStats | [RankStat] | Thong ke theo rank bai |
| achievements | [Achievement] | Thanh tich |
| solvedProblems | [SolvedProblem] | Danh sach bai da giai |
| learningPath | Object | Tien trinh hoc tap |
| tutorialsCompleted | [Tutorial] | Tutorial da hoan thanh |

**Rating -> Rank mapping:**
| Rating | Rank |
|--------|------|
| < 1400 | Newbie |
| 1400-1599 | Pupil |
| 1600-1899 | Specialist |
| 1900-2099 | Expert |
| 2100-2399 | Candidate Master |
| 2400-2599 | Master |
| 2600-2999 | International Master |
| >= 3000 | Grandmaster |

### Collection: TeacherApplications

| Field | Type | Mo Ta |
|-------|------|-------|
| fullName | String | Ho ten |
| dob | Date | Ngay sinh |
| address | String | Dia chi |
| email | String (required) | Email |
| phoneNumber | String | SDT |
| idCardFrontFile | String | File anh CMND mat truoc |
| idCardBackFile | String | File anh CMND mat sau |
| cvFile | String | File CV (PDF) |
| subjects | [String] | Mon day |
| experienceYears | Number (0-60) | So nam kinh nghiem |
| message | String | Loi nhan |
| status | Enum | draft/pending/approved/rejected |
| source | Enum | "teacher" / "center" |
| reviewedBy | String | Nguoi duyet |
| reviewedAt | Date | Ngay duyet |

### Collection: AiLessonPlans

| Field | Type | Mo Ta |
|-------|------|-------|
| createdBy | String | Auth user UUID |
| createdByUsername | String | Username |
| createdByRole | String | Role |
| status | Enum | draft/archived |
| courseId | ObjectId | Lien ket khoa hoc (optional) |
| subject | String (required) | Mon hoc |
| grade | Number (required) | Lop |
| textbook | String (required) | Sach giao khoa |
| lessonTopic | String (required) | Chu de bai hoc |
| durationMinutes | Number (required) | Thoi luong |
| structure | Mixed (required) | Noi dung ke hoach (JSON) |
| prompt | String | Prompt da dung |
| model | String | Model AI da dung |

### Collection: AllowLists (Phong Hop)

| Field | Type | Mo Ta |
|-------|------|-------|
| roomId | String (unique) | ID phong hop |
| ownerId | String | ID nguoi tao |
| ownerUsername | String | Username nguoi tao |
| allowedUsernames | [String] | Danh sach duoc vao |
| deniedUsernames | [String] | Danh sach bi chan |
| pendingRequests | [PendingRequest] | Yeu cau dang cho |
| approvedUsers | [ApprovedUser] | Nguoi da duyet |

### Collections: Forum (Q&A)

**ForumQuestion**:
| Field | Type |
|-------|------|
| title | String (required) |
| content | String (HTML) |
| tagIds | [ObjectId -> ForumTag] |
| author | ObjectId -> ForumUserStats |
| authorUsername | String |
| views | Number |
| upvotes/downvotes | [ObjectId] |
| answerIds | [ObjectId -> ForumAnswer] |

**ForumAnswer**:
| Field | Type |
|-------|------|
| questionId | ObjectId -> ForumQuestion |
| author | ObjectId -> ForumUserStats |
| authorUsername | String |
| content | String (HTML) |
| upvotes/downvotes | [ObjectId] |

**ForumTag**: name, description, questionsCount, followersCount

**ForumUserStats**: username, reputation, savedQuestionIds

**ForumInteraction**: username, action, questionId, answerId, tagIds

---

## Redis (Port 6379)

Redis duoc dung de:
- Luu **refresh tokens**: key `user:{userId}:tokens` (Hash, field la deviceId)
- Luu **session tracking**: key `user:{userId}:sessions` (Hash)
- TTL: 7 ngay (tuong ung voi refresh token expiry)
