# MCM 오프라인 AI 서비스 API 명세서 (MVP)

> 최종 수정: 2026-08-08
> 작성: 백엔드 파트 · 대상: 프론트엔드 공유용
> 관련 자료: `유저플로우.png`

---

## 0. 개요

MCM 매장 오프라인에서 사용자가 이용하는 AI 서비스 MVP의 REST API 명세다.
서비스는 두 갈래로 나뉜다.

- **아바타 피팅** (게스트/QR): QR 스캔 → 키·몸무게 → 아바타 생성 → 코디 확인/커스터마이즈/추천 → 내 사진 합성 → 장바구니
- **제품 사후관리** (회원): 제품번호 등록 → 사진·영상 업로드 → AI 진단 → 홈케어 추천 or 매장 수리 예약

### 확정 아키텍처 결정
| 항목 | 결정 |
|---|---|
| AI 무거운 작업(아바타 생성/사진 합성/손상 진단) | **비동기 Job + 폴링** (`POST` → `jobId` → `GET /jobs/{jobId}`) |
| 인증 | **게스트 토큰 + 회원 JWT** (QR 시 게스트 세션, 장바구니/사후관리 진입 시 회원 승격) |
| 파일 업로드 | **멀티파트 직접 업로드** (`multipart/form-data`) |
| 응답 포맷 | **성공·에러 공통 봉투** (§0.3) |
| 색상·사이즈 변경 | 사전 정의 SKU 옵션 **동기 조회** |
| QR/매장 식별 | **opaque code** (서버 매핑 조회형) |
| 게스트 데이터 만료 | **당일 TTL 소멸** (영구화는 회원 승격 시) |
| 진단 손상 카테고리 | `category(enum) + severity(1~3) + confidence` |
| 구매 프로세스 | **장바구니까지만** (결제/주문 생성은 범위 밖, TBD) |

---

## 0.1 공통 규약

- **Base URL**: `https://api.example.com/api/v1`
- **콘텐츠 타입**: 기본 `application/json`. 파일 업로드만 `multipart/form-data`
- **문자 인코딩**: UTF-8
- **시간 포맷**: ISO 8601 UTC (`2026-08-08T09:30:00Z`)
- **ID 포맷**: 문자열(UUID 또는 prefix형, 예: `avt_...`, `job_...`)

### 0.2 인증

모든 인증은 `Authorization` 헤더로 전달한다. 게스트 토큰과 회원 JWT는 동일 헤더를 사용하며, 서버가 토큰 종류를 구분한다.

```
Authorization: Bearer <token>
```

**권한 레벨**
| 레벨 | 의미 | 토큰 |
|---|---|---|
| `PUBLIC` | 인증 불필요 | - |
| `GUEST` | 게스트 세션 이상 (게스트/회원 모두 가능) | 게스트 토큰 or 회원 JWT |
| `MEMBER` | 회원 전용 | 회원 JWT |

각 엔드포인트 제목 옆에 권한 레벨을 `[GUEST]` 형태로 표기한다.

### 0.3 응답 봉투 (성공·에러 공통)

**모든** 응답은 아래 구조로 감싼다. 프론트는 `success` 하나로 분기할 수 있다.

**성공**
```json
{
  "success": true,
  "data": { },
  "error": null,
  "meta": {
    "requestId": "req_a1b2c3",
    "pagination": null
  }
}
```

**에러**
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "AVATAR_NOT_FOUND",
    "message": "아바타를 찾을 수 없습니다.",
    "details": { "avatarId": "avt_123" }
  },
  "meta": { "requestId": "req_a1b2c3" }
}
```

**목록(페이지네이션) 성공** — `data`는 배열, `meta.pagination`에 커서 정보.
```json
{
  "success": true,
  "data": [ { }, { } ],
  "error": null,
  "meta": {
    "requestId": "req_a1b2c3",
    "pagination": { "nextCursor": "eyJpZCI6...", "hasNext": true, "limit": 20 }
  }
}
```

### 0.4 HTTP 상태코드

| 코드 | 사용처 |
|---|---|
| `200 OK` | 조회/수정 성공 |
| `201 Created` | 리소스 생성 성공 (동기) |
| `202 Accepted` | **비동기 Job 생성** 성공 (`data.jobId` 반환) |
| `400 Bad Request` | 요청 형식 오류 |
| `401 Unauthorized` | 토큰 없음/만료 |
| `403 Forbidden` | 권한 부족 (게스트가 회원 전용 접근 등) |
| `404 Not Found` | 리소스 없음 |
| `409 Conflict` | 중복(예: 이미 등록된 제품번호) |
| `422 Unprocessable Entity` | 검증 실패(값 범위 등) |
| `500 Internal Server Error` | 서버 오류 |

### 0.5 공통 에러 코드

| code | HTTP | 의미 |
|---|---|---|
| `UNAUTHORIZED` | 401 | 인증 토큰 없음/만료 |
| `FORBIDDEN` | 403 | 권한 부족 |
| `VALIDATION_ERROR` | 422 | 입력값 검증 실패 (`details`에 필드별 사유) |
| `NOT_FOUND` | 404 | 리소스 없음 |
| `CONFLICT` | 409 | 중복 리소스 |
| `GUEST_SESSION_EXPIRED` | 401 | 게스트 세션 TTL 만료 |
| `JOB_FAILED` | 200 | Job은 조회됐으나 처리 실패 (`data.error` 참조) |
| `INTERNAL_ERROR` | 500 | 서버 내부 오류 |

### 0.6 페이지네이션

커서 기반으로 통일한다.

| 파라미터 | 위치 | 설명 |
|---|---|---|
| `cursor` | query | 이전 응답의 `meta.pagination.nextCursor`. 첫 페이지는 생략 |
| `limit` | query | 페이지 크기 (기본 20, 최대 50) |

---

## 0.7 공용 Job 리소스

아바타 생성 · 사진 합성 · 손상 진단은 모두 비동기 Job으로 처리한다.
작업 요청 API는 `202 Accepted` + `jobId`를 반환하고, 클라이언트는 아래 엔드포인트로 폴링한다.

### `GET /jobs/{jobId}` `[GUEST]`

Job 상태·결과 조회. (게스트가 만든 Job은 게스트 토큰으로, 회원 Job은 회원 JWT로 조회)

**Path**
| 이름 | 타입 | 설명 |
|---|---|---|
| `jobId` | string | 작업 ID |

**폴링 권장 주기**: 1~2초 간격, 지수 백오프 권장. `status`가 `succeeded`/`failed`가 되면 중단.

**응답 (처리 중)**
```json
{
  "success": true,
  "data": {
    "jobId": "job_abc",
    "type": "avatar_generate",
    "status": "processing",
    "progress": 45,
    "result": null,
    "error": null
  },
  "error": null,
  "meta": { "requestId": "req_1" }
}
```

**응답 (완료)** — `result`는 `type`별로 상이 (각 섹션 참조)
```json
{
  "success": true,
  "data": {
    "jobId": "job_abc",
    "type": "avatar_generate",
    "status": "succeeded",
    "progress": 100,
    "result": { "avatarId": "avt_123" },
    "error": null
  },
  "error": null,
  "meta": { "requestId": "req_1" }
}
```

**응답 (실패)**
```json
{
  "success": true,
  "data": {
    "jobId": "job_abc",
    "type": "avatar_generate",
    "status": "failed",
    "progress": 100,
    "result": null,
    "error": { "code": "GENERATION_FAILED", "message": "아바타 생성에 실패했습니다." }
  },
  "error": null,
  "meta": { "requestId": "req_1" }
}
```

**Job 필드**
| 필드 | 타입 | 설명 |
|---|---|---|
| `jobId` | string | 작업 ID |
| `type` | enum | `avatar_generate` \| `coordi_render` \| `try_on` \| `diagnosis` |
| `status` | enum | `pending` \| `processing` \| `succeeded` \| `failed` |
| `progress` | number | 0~100 |
| `result` | object\|null | 완료 시 결과 (type별 스키마) |
| `error` | object\|null | 실패 시 에러 |

---
---

## 1. 인증 / 세션 (Auth)

### `POST /guest-sessions` `[PUBLIC]`

QR 스캔 후 게스트 세션과 토큰을 발급한다. QR에는 **opaque code**만 담기며, 서버가 매장/디스플레이 매핑을 조회한다.

**Request Body**
```json
{
  "qrCode": "mcm_qr_9f3a1c"
}
```
| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `qrCode` | string | ✅ | QR에 인코딩된 opaque code |

**Response `201`**
```json
{
  "success": true,
  "data": {
    "guestToken": "eyJhbGciOi...",
    "guestSessionId": "gst_123",
    "store": { "storeId": "store_gangnam", "name": "MCM 강남" },
    "expiresAt": "2026-08-08T23:59:59Z"
  },
  "error": null,
  "meta": { "requestId": "req_1" }
}
```
> 게스트 세션·데이터는 `expiresAt`(당일)에 만료된다.

**에러**: `QR_INVALID`(404) — 유효하지 않은/만료된 QR 코드

---

### `POST /auth/signup` `[PUBLIC]`

회원가입.

**Request Body**
```json
{
  "email": "user@example.com",
  "password": "********",
  "name": "홍길동",
  "phone": "010-1234-5678"
}
```

**Response `201`** — 가입 후 즉시 로그인 토큰 발급(선택). 최소한 `userId` 반환.
```json
{
  "success": true,
  "data": { "userId": "usr_123", "accessToken": "eyJ...", "refreshToken": "eyJ..." },
  "error": null,
  "meta": { "requestId": "req_1" }
}
```
**에러**: `EMAIL_ALREADY_EXISTS`(409)

---

### `POST /auth/login` `[PUBLIC]`

로그인 후 회원 JWT 발급.

**Request Body**
```json
{ "email": "user@example.com", "password": "********" }
```

**Response `200`**
```json
{
  "success": true,
  "data": {
    "userId": "usr_123",
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "expiresIn": 3600
  },
  "error": null,
  "meta": { "requestId": "req_1" }
}
```
**에러**: `INVALID_CREDENTIALS`(401)

---

### `POST /auth/refresh` `[PUBLIC]` *(MVP 선택)*

리프레시 토큰으로 액세스 토큰 재발급.

**Request Body**
```json
{ "refreshToken": "eyJ..." }
```
**Response `200`**: `accessToken`, `expiresIn`

---

### `POST /auth/claim` `[MEMBER]`

**게스트 → 회원 승격.** 게스트 세션의 아바타·장바구니를 로그인한 회원 계정으로 이관한다.
(장바구니 담기나 사후관리 진입 시, 회원 로그인 직후 호출)

**Request Header**: `Authorization: Bearer <회원 JWT>`

**Request Body**
```json
{ "guestToken": "eyJ..." }
```
| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `guestToken` | string | ✅ | 이관할 게스트 세션 토큰 |

**Response `200`**
```json
{
  "success": true,
  "data": { "claimedAvatars": ["avt_123"], "claimedCartItems": 2 },
  "error": null,
  "meta": { "requestId": "req_1" }
}
```
**에러**: `GUEST_SESSION_EXPIRED`(401) — 이미 만료된 게스트 세션

---
---

## 2. 아바타 (Avatar) — 아바타 피팅

### `POST /avatars` `[GUEST]`

키·몸무게를 입력받아 아바타를 생성한다. **비동기 Job**.

**Request Body**
```json
{ "heightCm": 172, "weightKg": 65, "gender": "female" }
```
| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `heightCm` | number | ✅ | 키(cm). 범위 100~230 |
| `weightKg` | number | ✅ | 몸무게(kg). 범위 30~200 |
| `gender` | enum | ❌ | `female` \| `male` \| `neutral` (아바타 베이스) |

**Response `202`**
```json
{
  "success": true,
  "data": { "jobId": "job_avt1", "type": "avatar_generate" },
  "error": null,
  "meta": { "requestId": "req_1" }
}
```
→ `GET /jobs/{jobId}` 폴링. 완료 시 `result: { "avatarId": "avt_123" }`

**에러**: `VALIDATION_ERROR`(422) — 키/몸무게 범위 벗어남

---

### `GET /avatars/{avatarId}` `[GUEST]`

생성된 아바타 조회 (Job `succeeded` 이후).

**Response `200`**
```json
{
  "success": true,
  "data": {
    "avatarId": "avt_123",
    "heightCm": 172,
    "weightKg": 65,
    "gender": "female",
    "imageUrl": "https://cdn.example.com/avatars/avt_123.png",
    "createdAt": "2026-08-08T09:30:00Z"
  },
  "error": null,
  "meta": { "requestId": "req_1" }
}
```

---
---

## 3. 코디 & 추천 (Coordi / Recommendation)

### `GET /avatars/{avatarId}/coordi` `[GUEST]`

아바타 기준 추천 코디 목록 (A-02 진입점).

**Query**: `cursor`, `limit`

**Response `200`** (목록)
```json
{
  "success": true,
  "data": [
    {
      "coordiId": "cod_1",
      "title": "데일리 캐주얼",
      "thumbnailUrl": "https://cdn.example.com/coordi/cod_1.png",
      "products": [
        { "productId": "prd_bag1", "name": "MCM 백팩", "category": "bag" }
      ]
    }
  ],
  "error": null,
  "meta": {
    "requestId": "req_1",
    "pagination": { "nextCursor": "eyJ...", "hasNext": true, "limit": 20 }
  }
}
```

---

### `GET /coordi` `[GUEST]`

**다른 코디 보기.** 아바타와 무관하게 전체 코디 페이지네이션 조회.

**Query**: `cursor`, `limit`, `avatarId`(선택, 아바타 착장 렌더 반영)

**Response `200`**: `GET /avatars/{avatarId}/coordi`와 동일 구조

---

### `GET /coordi/{coordiId}` `[GUEST]`

코디 상세.

**Query (색상·사이즈 변경)**
| 이름 | 타입 | 설명 |
|---|---|---|
| `color` | string | 선택한 색상 코드 (사전 정의 SKU 옵션) |
| `size` | string | 선택한 사이즈 |
| `avatarId` | string | 착장 이미지 렌더용(선택) |

> 색상·사이즈 변경은 **사전 정의된 SKU 옵션의 동기 조회**다. 옵션 조합에 해당하는 미리 렌더된 이미지를 반환한다(별도 Job 없음).

**Response `200`**
```json
{
  "success": true,
  "data": {
    "coordiId": "cod_1",
    "title": "데일리 캐주얼",
    "renderedImageUrl": "https://cdn.example.com/coordi/cod_1_black_M.png",
    "products": [
      {
        "productId": "prd_bag1",
        "name": "MCM 백팩",
        "category": "bag",
        "selectedColor": "black",
        "selectedSize": "M",
        "availableColors": ["black", "cognac", "white"],
        "availableSizes": ["S", "M", "L"]
      }
    ]
  },
  "error": null,
  "meta": { "requestId": "req_1" }
}
```
**에러**: `VARIANT_NOT_AVAILABLE`(404) — 존재하지 않는 색상/사이즈 조합

---

### `GET /coordi/{coordiId}/similar` `[GUEST]`

**비슷한 스타일 추천.**

**Query**: `limit`

**Response `200`** (목록) — 코디 요약 배열 (`GET /coordi`와 동일 아이템 구조)

---

### `GET /products/{productId}` `[GUEST]`

**코디 정보 확인 / 옷 상세정보** 화면.

**Response `200`**
```json
{
  "success": true,
  "data": {
    "productId": "prd_bag1",
    "name": "MCM 백팩",
    "brand": "MCM",
    "category": "bag",
    "price": 890000,
    "currency": "KRW",
    "description": "비세토스 코팅 캔버스 백팩",
    "images": ["https://cdn.example.com/products/prd_bag1_1.png"],
    "availableColors": ["black", "cognac", "white"],
    "availableSizes": ["S", "M", "L"]
  },
  "error": null,
  "meta": { "requestId": "req_1" }
}
```

---
---

## 4. 가상 합성 (Virtual Try-on / 내 사진에 입혀보기)

### `POST /try-on` `[GUEST]`

내 사진에 제품/코디를 합성한다. **멀티파트 업로드 + 비동기 Job**.
게스트도 사용 가능하며, 업로드 원본과 합성 결과는 게스트 세션 TTL(당일)로 소멸한다.

**Content-Type**: `multipart/form-data`

**Form fields**
| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `photo` | file | ✅ | 사용자 사진 (JPEG/PNG, 최대 10MB) |
| `coordiId` | string | 조건부 | 코디 전체 합성 시 |
| `productId` | string | 조건부 | 특정 제품만 합성 시 |
| `scope` | enum | ✅ | `product_only`(제품만) \| `full_coordi`(코디 전체) |
| `color` | string | ❌ | 선택 색상 |
| `size` | string | ❌ | 선택 사이즈 |

> `scope=product_only`면 `productId` 필수, `scope=full_coordi`면 `coordiId` 필수.

**Response `202`**
```json
{
  "success": true,
  "data": { "jobId": "job_try1", "type": "try_on" },
  "error": null,
  "meta": { "requestId": "req_1" }
}
```
→ `GET /jobs/{jobId}` 폴링. 완료 시:
```json
"result": {
  "tryOnId": "try_1",
  "resultImageUrl": "https://cdn.example.com/tryon/try_1.png",
  "expiresAt": "2026-08-08T23:59:59Z"
}
```

**에러**: `FILE_TOO_LARGE`(422), `UNSUPPORTED_FILE_TYPE`(422), `VALIDATION_ERROR`(422) — scope/id 불일치

---
---

## 5. 장바구니 (Cart) — 회원 필수

> **MVP 범위 = 장바구니 담기·조회까지.** 결제/주문 생성은 범위 밖(TBD).
> 게스트가 담기 시도 시 `403 FORBIDDEN` → 프론트는 회원가입/로그인 유도 후 `POST /auth/claim`으로 승격.

### `POST /cart/items` `[MEMBER]`

장바구니 담기.

**Request Body**
```json
{ "productId": "prd_bag1", "color": "black", "size": "M", "quantity": 1 }
```

**Response `201`**
```json
{
  "success": true,
  "data": { "cartItemId": "ci_1", "cartItemCount": 3 },
  "error": null,
  "meta": { "requestId": "req_1" }
}
```
**에러**: `FORBIDDEN`(403) — 게스트 접근, `VARIANT_NOT_AVAILABLE`(404)

---

### `GET /cart` `[MEMBER]`

장바구니 조회.

**Response `200`**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "cartItemId": "ci_1",
        "productId": "prd_bag1",
        "name": "MCM 백팩",
        "color": "black",
        "size": "M",
        "quantity": 1,
        "price": 890000,
        "thumbnailUrl": "https://cdn.example.com/products/prd_bag1_1.png"
      }
    ],
    "totalPrice": 890000,
    "currency": "KRW"
  },
  "error": null,
  "meta": { "requestId": "req_1" }
}
```

---

### `PATCH /cart/items/{cartItemId}` `[MEMBER]`

수량/옵션 변경.

**Request Body**: `{ "quantity": 2 }` 또는 `{ "color": "cognac", "size": "L" }`
**Response `200`**: 변경된 아이템

---

### `DELETE /cart/items/{cartItemId}` `[MEMBER]`

장바구니 항목 삭제.
**Response `200`**: `{ "cartItemCount": 2 }`

---
---

## 6. 제품 등록 & 마이페이지 (Product Registration) — 회원 필수

### `POST /me/products` `[MEMBER]`

**제품번호 등록** (사후관리 대상 제품).

**Request Body**
```json
{ "serialNumber": "MCM-2024-XXXX", "purchaseDate": "2024-05-10", "nickname": "내 백팩" }
```
| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `serialNumber` | string | ✅ | 제품번호(시리얼) |
| `purchaseDate` | string(date) | ❌ | 구매일 |
| `nickname` | string | ❌ | 사용자 지정 별칭 |

**Response `201`**
```json
{
  "success": true,
  "data": {
    "registrationId": "reg_1",
    "serialNumber": "MCM-2024-XXXX",
    "product": { "productId": "prd_bag1", "name": "MCM 백팩", "imageUrl": "..." }
  },
  "error": null,
  "meta": { "requestId": "req_1" }
}
```
**에러**: `SERIAL_NOT_FOUND`(404) — 등록되지 않은 제품번호, `ALREADY_REGISTERED`(409)

---

### `GET /me/products` `[MEMBER]`

등록한 내 제품 목록 (마이페이지 S-01).

**Query**: `cursor`, `limit`
**Response `200`** (목록): 등록 제품 요약 배열

---

### `GET /me/products/{registrationId}` `[MEMBER]`

등록 제품 상세 (진단 이력 포함).

**Response `200`**
```json
{
  "success": true,
  "data": {
    "registrationId": "reg_1",
    "product": { "productId": "prd_bag1", "name": "MCM 백팩" },
    "serialNumber": "MCM-2024-XXXX",
    "diagnoses": [ { "diagnosisId": "dg_1", "createdAt": "2026-08-08T09:30:00Z", "repairNeeded": true } ]
  },
  "error": null,
  "meta": { "requestId": "req_1" }
}
```

---
---

## 7. 진단 & 사후관리 (Diagnosis / After-care) — 회원 필수

### `POST /diagnoses` `[MEMBER]`

등록 제품의 사진·영상을 업로드해 AI 손상 진단을 요청한다. **멀티파트 + 비동기 Job**.

**Content-Type**: `multipart/form-data`

**Form fields**
| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `registrationId` | string | ✅ | 진단할 등록 제품 ID |
| `files` | file[] | ✅ | 사진/영상 (JPEG/PNG/MP4, 파일당 최대 50MB, 최대 5개) |

**Response `202`**
```json
{
  "success": true,
  "data": { "jobId": "job_dg1", "type": "diagnosis" },
  "error": null,
  "meta": { "requestId": "req_1" }
}
```
→ `GET /jobs/{jobId}` 폴링. 완료 시 `result: { "diagnosisId": "dg_1" }`

**에러**: `FILE_TOO_LARGE`(422), `UNSUPPORTED_FILE_TYPE`(422)

---

### `GET /diagnoses/{diagnosisId}` `[MEMBER]`

진단 결과 조회 (S-02).

**Response `200`**
```json
{
  "success": true,
  "data": {
    "diagnosisId": "dg_1",
    "registrationId": "reg_1",
    "repairNeeded": true,
    "summary": "가죽 표면 스크래치와 모서리 마모가 확인됩니다.",
    "damages": [
      {
        "category": "scratch",
        "severity": 2,
        "confidence": 0.88,
        "location": "front-panel",
        "boundingBox": { "x": 120, "y": 80, "w": 60, "h": 40 }
      },
      {
        "category": "hardware_damage",
        "severity": 3,
        "confidence": 0.91,
        "location": "zipper"
      }
    ],
    "createdAt": "2026-08-08T09:30:00Z"
  },
  "error": null,
  "meta": { "requestId": "req_1" }
}
```

**진단 결과 스키마**
| 필드 | 타입 | 설명 |
|---|---|---|
| `repairNeeded` | boolean | 매장 수리 필요 여부 (Y→수리 예약, N→홈케어) |
| `damages[].category` | enum | `scratch` \| `stain` \| `tear` \| `hardware_damage` \| `discoloration` \| `deformation` |
| `damages[].severity` | number | 심각도 1(경미)~3(심각) |
| `damages[].confidence` | number | AI 신뢰도 0.0~1.0 |
| `damages[].location` | string | 손상 위치 라벨 |
| `damages[].boundingBox` | object\|null | 이미지 내 위치(선택) |

---

### `GET /diagnoses/{diagnosisId}/care-guide` `[MEMBER]`

**홈케어 방법 추천 / 케어 가이드** (수리 불필요 시 주로 노출).

**Response `200`**
```json
{
  "success": true,
  "data": {
    "diagnosisId": "dg_1",
    "guides": [
      {
        "damageCategory": "scratch",
        "title": "가벼운 스크래치 셀프 케어",
        "steps": [
          "부드러운 마른 천으로 표면 먼지를 제거합니다.",
          "가죽 전용 컨디셔너를 소량 발라 원을 그리며 문지릅니다."
        ],
        "cautions": ["물이나 알코올 사용 금지"]
      }
    ]
  },
  "error": null,
  "meta": { "requestId": "req_1" }
}
```

---
---

## 8. 수리 예약 (Repair Reservation) — 회원 필수

### `GET /stores` `[MEMBER]`

매장 목록 및 예약 가능 슬롯 조회.

**Query**
| 이름 | 타입 | 설명 |
|---|---|---|
| `date` | string(date) | 조회할 날짜 (선택) |
| `cursor`, `limit` | | 페이지네이션 |

**Response `200`** (목록)
```json
{
  "success": true,
  "data": [
    {
      "storeId": "store_gangnam",
      "name": "MCM 강남",
      "address": "서울 강남구 ...",
      "availableSlots": ["2026-08-10T10:00:00Z", "2026-08-10T11:00:00Z"]
    }
  ],
  "error": null,
  "meta": { "requestId": "req_1", "pagination": { "nextCursor": null, "hasNext": false, "limit": 20 } }
}
```

---

### `POST /repair-reservations` `[MEMBER]`

**매장 수리 예약** (진단 결과 연결).

**Request Body**
```json
{
  "storeId": "store_gangnam",
  "diagnosisId": "dg_1",
  "slot": "2026-08-10T10:00:00Z",
  "memo": "지퍼 손상 수리 요청"
}
```
| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `storeId` | string | ✅ | 예약 매장 |
| `diagnosisId` | string | ✅ | 연결할 진단 결과 |
| `slot` | string(datetime) | ✅ | 선택한 예약 슬롯 |
| `memo` | string | ❌ | 요청사항 |

**Response `201`**
```json
{
  "success": true,
  "data": {
    "reservationId": "rsv_1",
    "status": "confirmed",
    "store": { "storeId": "store_gangnam", "name": "MCM 강남" },
    "slot": "2026-08-10T10:00:00Z"
  },
  "error": null,
  "meta": { "requestId": "req_1" }
}
```
**에러**: `SLOT_UNAVAILABLE`(409) — 이미 예약된 슬롯

---

### `GET /me/repair-reservations` `[MEMBER]`

내 예약 목록 조회.

**Query**: `cursor`, `limit`, `status`(선택: `confirmed`/`completed`/`cancelled`)
**Response `200`** (목록): 예약 요약 배열

---
---

## 부록 A. 화면 ↔ 엔드포인트 매핑 (유저플로우 대조)

| 플로우 화면 | 엔드포인트 |
|---|---|
| A-01 QR 찍기 | `POST /guest-sessions` |
| 키·몸무게 입력 → 아바타 생성 | `POST /avatars` → `GET /jobs/{id}` |
| A-02 코디 확인 | `GET /avatars/{id}/coordi` |
| 색상·사이즈 변경 | `GET /coordi/{id}?color=&size=` |
| 비슷한 스타일 추천 | `GET /coordi/{id}/similar` |
| 다른 코디 보기 | `GET /coordi?cursor=` |
| 코디 정보 확인 (옷 상세) | `GET /products/{id}` |
| 사진에 입혀보기 (제품만/코디 전체) | `POST /try-on` → `GET /jobs/{id}` |
| 장바구니 담기 → 회원가입/로그인 | `POST /cart/items` + `POST /auth/*` + `POST /auth/claim` |
| S-01 마이페이지 / 제품번호 등록 | `POST /me/products`, `GET /me/products` |
| 사진·영상 업로드 → S-02 진단 결과 | `POST /diagnoses` → `GET /jobs/{id}` → `GET /diagnoses/{id}` |
| 수리 필요(Y) → 매장 수리 예약 → 완료 | `GET /stores`, `POST /repair-reservations` |
| 수리 불필요(N) → 홈케어 추천 | `GET /diagnoses/{id}/care-guide` |

## 부록 B. 엔드포인트 요약

| # | Method | Path | 권한 | 비동기 |
|---|---|---|---|---|
| 1 | POST | `/guest-sessions` | PUBLIC | |
| 2 | POST | `/auth/signup` | PUBLIC | |
| 3 | POST | `/auth/login` | PUBLIC | |
| 4 | POST | `/auth/refresh` | PUBLIC | |
| 5 | POST | `/auth/claim` | MEMBER | |
| 6 | POST | `/avatars` | GUEST | ✅ |
| 7 | GET | `/avatars/{avatarId}` | GUEST | |
| 8 | GET | `/avatars/{avatarId}/coordi` | GUEST | |
| 9 | GET | `/coordi` | GUEST | |
| 10 | GET | `/coordi/{coordiId}` | GUEST | |
| 11 | GET | `/coordi/{coordiId}/similar` | GUEST | |
| 12 | GET | `/products/{productId}` | GUEST | |
| 13 | POST | `/try-on` | GUEST | ✅ |
| 14 | POST | `/cart/items` | MEMBER | |
| 15 | GET | `/cart` | MEMBER | |
| 16 | PATCH | `/cart/items/{cartItemId}` | MEMBER | |
| 17 | DELETE | `/cart/items/{cartItemId}` | MEMBER | |
| 18 | POST | `/me/products` | MEMBER | |
| 19 | GET | `/me/products` | MEMBER | |
| 20 | GET | `/me/products/{registrationId}` | MEMBER | |
| 21 | POST | `/diagnoses` | MEMBER | ✅ |
| 22 | GET | `/diagnoses/{diagnosisId}` | MEMBER | |
| 23 | GET | `/diagnoses/{diagnosisId}/care-guide` | MEMBER | |
| 24 | GET | `/stores` | MEMBER | |
| 25 | POST | `/repair-reservations` | MEMBER | |
| 26 | GET | `/me/repair-reservations` | MEMBER | |
| 27 | GET | `/jobs/{jobId}` | GUEST | (폴링) |

## 부록 C. 미확정 / TBD

- **결제·주문 생성**: 장바구니 이후 구매 프로세스는 MVP 범위 밖. 추후 `POST /orders` 등으로 확장
- **QR opaque code 페이로드 스펙**: 코드 생성/매핑 관리 체계 별도 확정 필요
- **진단 손상 카테고리 enum 최종 확정**: AI 모델 출력 계약과 맞춰 조정
- **파일 업로드 용량/포맷 제한값**: 인프라 확정 후 수치 조정
