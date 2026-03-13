# Kien Truc He Thong SkillGro

## Tong Quan Kien Truc

SkillGro su dung kien truc **microservices** voi mot **API Gateway** lam diem vao duy nhat. Tat ca frontend deu giao tiep qua API Gateway, khong truc tiep den cac service backend.

```
                    +------------------+
                    |   Nguoi Dung     |
                    +--------+---------+
                             |
        +--------------------+--------------------+
        |          |         |         |          |
   elearn-fe  manage-fe  center-fe  meeting-fe  messenger-fe ...
   (:3004)    (:3005)    (:3006)    (:3007)     (:3008)
        |          |         |         |          |
        +--------------------+--------------------+
                             |
                    +--------+---------+
                    |   API Gateway    |
                    |   (:3000)        |
                    +--------+---------+
                             |
         +-------------------+-------------------+
         |                   |                   |
+--------+-------+  +-------+--------+  +-------+--------+
| Auth Service   |  | AuthZ Service  |  | Processing Svc |
| (:3001)        |  | (:3002)        |  | (:3003)        |
+--------+-------+  +-------+--------+  +----------------+
         |                   |
+--------+-------+  +-------+--------+
| auth-db        |  | authz-db       |
| (Postgres)     |  | (Postgres)     |
| :5435          |  | :5433          |
+----------------+  +----------------+

                    +--------+---------+
                    | Elearn DB Svc    |
                    | (:3010)          |
                    +--------+---------+
                             |
                    +--------+---------+
                    | MongoDB          |
                    | (:27017)         |
                    +------------------+

         +----------------+  +----------------+
         | Redis          |  | RabbitMQ       |
         | (:6379)        |  | (:5672/15672)  |
         +----------------+  +----------------+
```

## Luong Du Lieu Chinh

### 1. Xac Thuc (Authentication Flow)

```
Frontend --> API Gateway (/api/auth/*) --> Auth Service (:3001)
                                               |
                                          auth-db (Postgres)
                                               |
                                          Redis (luu refresh token)
```

1. Nguoi dung gui username/password den `/api/auth/login`
2. API Gateway proxy den Auth Service
3. Auth Service kiem tra credentials trong PostgreSQL
4. Tao **access_token** (JWT, 1 ngay) va **refresh_token** (JWT, 7 ngay)
5. Luu refresh_token vao **Redis** (key: `user:{id}:tokens`)
6. Tra ve token qua **httpOnly cookies**

### 2. Phan Quyen (Authorization Flow)

```
Frontend --> API Gateway (/api/authz/*) --> AuthZ Service (:3002)
                                               |
                                          authz-db (Postgres)
                                          Casbin Enforcer
```

- Su dung **Casbin** de quan ly RBAC
- Kiem tra quyen: `POST /api/authz/check` voi `{ resource, action }`
- Casbin enforcer load policies tu database

### 3. Du Lieu Hoc Tap (Elearn Data Flow)

```
Frontend --> API Gateway (/api/elearn/*) --> Elearn DB Service (:3010)
                                                    |
                                               MongoDB (:27017)
```

- API Gateway tu dong extract `access_token` tu cookie va chuyen thanh `Authorization: Bearer` header
- Elearn DB Service verify JWT va xu ly CRUD

### 4. Chay Code (Code Execution Flow)

```
elearn-fe --> API Gateway (/api/process/*) --> Processing Service (:3003)
                                                    |
                                              Tao temp dir
                                              Ghi source code
                                              Compile (C++/Java)
                                              Chay voi input
                                              So sanh output
                                              Xoa temp dir
```

1. Frontend gui source code + input + expected output
2. Processing Service tao thu muc tam
3. Compile (neu C++/Java), chay chuong trinh voi input
4. So sanh actual output voi expected output
5. Tra ve ket qua: accepted/wrong_answer/runtime_error/TLE/compilation_error

## API Gateway Routing

| URL Pattern | Target Service | Path Rewrite |
|-------------|---------------|--------------|
| `/api/auth/*` | Auth Service (:3001) | `/api/auth` -> `/` |
| `/api/authz/*` | AuthZ Service (:3002) | Giu nguyen |
| `/api/process/*` | Processing Service (:3003) | Giu nguyen |
| `/api/elearn/*` | Elearn DB Service (:3010) | `/api/elearn` -> `/api` |
| `/elearn/uploads/*` | Elearn DB Service (:3010) | `/elearn/uploads` -> `/uploads` |

## Docker Network

Tat ca services ket noi qua mang `microservices-network` (bridge driver). Ben trong Docker, cac service giao tiep qua ten container:
- `http://auth-service:3001`
- `http://authz-service:3002`
- `http://processing-service:3003`
- `http://elearn-db:3010`

## Bao Mat

### JWT Token
- **Access Token**: ky bang `JWT_SECRET`, het han 1 ngay
- **Refresh Token**: ky bang `REFRESH_SECRET`, het han 7 ngay
- Token duoc luu trong **httpOnly cookies** (khong truy cap duoc tu JavaScript)
- Refresh token duoc luu trong **Redis** de co the thu hoi

### Quan Ly Session
- Ho tro nhieu thiet bi (multi-device login)
- Moi thiet bi co `device_id` rieng
- Co the dang xuat tu 1 thiet bi hoac tat ca thiet bi

### CORS
- API Gateway chi cho phep cac origin cu the (localhost:3004-3009)
- Tat ca request phai gui kem credentials (cookies)

### Rate Limiting
- 100 requests/15 phut (production)
- 1000 requests/15 phut (development)
- Bo qua rate limit cho local requests trong dev

### Mat Khau
- Ma hoa bang **bcrypt** (salt rounds = 10)
- Validate do manh mat khau qua Joi validator

## Xu Ly Loi va Health Check

Moi service co 2 endpoint health check:
- `GET /health` - kiem tra nhanh
- `POST /health/check` - kiem tra chi tiet voi timestamp validation (trong 30 giay)

API Gateway tong hop health status cua tat ca services.
