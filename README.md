# Atelier Lens — 프론트엔드

React 19 + Vite + Tailwind v4 + React Router 7 + Zustand + axios.
**Atelier Lens API 명세서 MVP v3.0 (2026-08-13 확정본)** 기준으로 구현했습니다.

```bash
npm install
npm run dev      # http://localhost:5173 — 실제 백엔드에 붙어서 뜹니다
```

## 실행 모드

| 상황 | 설정 | 동작 |
| --- | --- | --- |
| **기본 dev** | `.env.development` 의 `VITE_USE_MOCK=false` + `VITE_API_PROXY` | dev 서버가 `/api` 를 백엔드로 프록시 (CORS 없음) |
| 화면만 확인 | `VITE_USE_MOCK=true` | `src/api/mock.js` 더미로 전 화면 동작 (mock 은 실제 스키마와 같은 모양) |
| 배포 | 환경변수에 `VITE_API_URL` 지정 | **항상 실제 API 호출** |

배포 환경변수가 비어 있으면 baseURL 이 `/api/v1` 로 떨어지고 `vercel.json` 의 SPA rewrite 때문에 API 응답 대신 `index.html` 이 돌아옵니다. 반드시 `VITE_API_URL` 을 채우세요. Vite 는 대시보드/셸 환경변수를 `.env` 파일보다 우선합니다.

## 배포

- **Vercel**: `vercel.json` 의 SPA rewrite 포함. Framework preset `Vite`, 환경변수만 등록하면 됩니다.
- **Netlify**: `public/_redirects` 포함. Build `npm run build`, Publish `dist`.

## 소셜 로그인 실제 연결

버튼 동작은 **클라이언트 ID 유무로만** 갈립니다 (`VITE_USE_MOCK` 과 무관):

| 상태 | 카카오/구글 버튼을 누르면 |
| --- | --- |
| 클라이언트 ID 없음 | 인가 페이지를 건너뛰고 데모 코드로 `POST /auth/social` 호출 → **실제 세션 발급** (백엔드가 프로필 fetch 를 mock 으로 처리). 브라우저마다 다른 코드를 저장해 계정이 섞이지 않는다 |
| 클라이언트 ID 있음 | **실제 카카오/구글 동의 화면으로 이동** → `/oauth/callback` → `POST /auth/social` |

즉 키만 넣으면 그 순간부터 진짜입니다. `.env.local` 에 아래 두 줄을 채우세요 (git 에 안 올라갑니다).

```bash
VITE_KAKAO_CLIENT_ID=카카오_REST_API_키
VITE_GOOGLE_CLIENT_ID=구글_OAuth_클라이언트_ID
```

**카카오** — 개발자센터 > 내 애플리케이션
1. 앱 키 > **REST API 키** 를 복사 (JavaScript 키 아님)
2. 카카오 로그인 > **활성화 ON**
3. 카카오 로그인 > Redirect URI 에 `http://localhost:5173/oauth/callback` 과 `<배포주소>/oauth/callback` 등록
4. 동의항목에서 필요한 항목(닉네임/이메일) 설정
5. 보안 > **Client Secret 은 백엔드에만** 전달 (프론트에 넣으면 유출입니다)

**구글** — Cloud Console > API 및 서비스 > 사용자 인증 정보
1. OAuth 클라이언트 ID 만들기 > 유형 **웹 애플리케이션**
2. 승인된 리디렉션 URI 에 `http://localhost:5173/oauth/callback` 과 `<배포주소>/oauth/callback` 등록
3. **클라이언트 보안 비밀번호는 백엔드에만** 전달

프론트는 인가 코드(`code`)만 받아 백엔드에 넘기고, 토큰 교환은 백엔드가 합니다(명세 §3). 그래서 프론트에는 시크릿이 필요 없고, 있으면 안 됩니다.

## 담당 범위

명세 §19 화면 매핑 전체 (MEMBER + 게스트 구간).

| 화면 | 라우트 | API |
| --- | --- | --- |
| 로그인 / 회원가입 / 소셜 | `/login` | `POST /auth/login` `POST /auth/signup` `POST /auth/social` |
| 소셜 콜백 | `/oauth/callback` | `POST /auth/social` (code 교환) |
| 저장 완료 | `/complete` | (`POST /auth/claim` 결과 안내) |
| 마이페이지 | `/mypage` | `GET /me` `GET /me/avatar` |
| 계정 · 아바타 설정 (MY-08~10) | `/mypage/account` | `PATCH /me` `PATCH /me/password` `PUT /me/avatar` |
| 저장한 코디 (MY-02) | `/saved` | `GET /me/coordis` `DELETE /me/coordis/{id}` |
| 장바구니 (CT-01) | `/cart` | `GET /cart` `PATCH·DELETE /cart/items/{id}` |
| 구매하기 (CT-02) | `/cart` → `/orders/{id}` | `POST /orders` |
| 결제 내역 (MY-04) | `/orders`, `/orders/{orderId}` | `GET /me/orders`, `GET /me/orders/{id}` |
| 보유 제품 (MY-05) | `/care` | `GET /me/products` |
| 제품 등록 | `/care/register` | `POST /me/products` |
| 제품 상세 · 케어가이드 (MY-06) | `/care/{registrationId}` | `GET /me/products/{id}` + `/care-guide` |
| AI 손상 진단 (MY-07) | `/care/{id}/diagnose` | `POST /diagnoses` → `GET /jobs/{jobId}` 폴링 |
| 진단 결과 | `/diagnoses/{diagnosisId}` | `GET /diagnoses/{id}` + `/care-guide` |
| 수리 예약 | `/repair-reservations/new` | `GET /stores` `POST /repair-reservations` |
| 예약 목록 · 취소 | `/repair-reservations` | `GET /repair-reservations` `POST /{id}/cancel` |
| 품번 스캔 (MN-01) | `/scan` → `/scan/confirm/{code}` | `POST /product-recognitions` (사진 OCR) |
| 아바타 피팅 (MN-02) | `/fitting/avatar` → `/coordi/{id}` | `POST /avatar-try-ons` → `GET /jobs/{id}` |
| 내 사진 피팅 (MN-03) | `/fitting/photo` → `/fitting/photo/result` | `POST /try-ons` → `GET /jobs/{id}` → `POST /try-ons/{id}/save` |
| 저장한 피팅 | `/saved` 하단 | `GET /me/try-ons` `DELETE /me/try-ons/{id}` |

## 구조

`@/` 는 `src/` 별칭입니다 (`vite.config.js` + `jsconfig.json`). 어느 깊이에서든 `import { Screen } from "@/components"` 로 씁니다.

```
src/
  main.jsx                앱 진입점 (ErrorBoundary → Router → App)
  App.jsx                 라우트 정의 — 도메인별로 묶여 있음
  index.css               Tailwind v4 @theme 토큰 + 공통 클래스(.btn/.card/.pill/.lbl)

  api/                    ── 서버 통신 (백엔드 붙일 때 여기만 보면 됨)
    client.js             axios — envelope 해제, 상태코드별 문구, TOKEN_EXPIRED 시 refresh 1회 재시도
    tokens.js             localStorage 토큰 단일 소유자 (interceptor ↔ store 순환참조 방지)
    oauth.js              카카오/구글 Authorization Code 리다이렉트 + state(CSRF) 검증
    index.js              엔드포인트 함수 + USE_MOCK 분기 + 업로드 검증 규칙
    mock.js               더미 (상태 보존형 — 담기·주문·진단·예약이 실제로 반영됨)

  store/                  ── 전역 상태 (zustand)
    auth.js               로그인 상태 / 게스트 이관(/auth/claim)
    data.js               코디·장바구니·제품·주문·예약 캐시 + 에러 상태
    toast.js              toast() / toastError()
    format.js             won · fmtDate · fmtDateTime · todayKst
    index.js              배럴

  components/             ── 공용 UI (1 컴포넌트 1 파일)
    Screen.jsx            모바일 프레임 + 헤더 + 하단 탭
    PrivateRoute.jsx      로그인 게이트
    ErrorBoundary.jsx     렌더 예외 복구
    Emblem.jsx            브랜드 엠블럼(플레이스홀더)
    Thumb.jsx             제품/코디 이미지 (인증 파일 blob 처리 포함)
    Field.jsx             폼 라벨 + 입력
    Feedback.jsx          Loading / Empty / ErrorState / Toast
    index.js              배럴

  hooks.js                useFileUrl(인증 파일) · useJob(Job 폴링) · useResource(단건 조회+재시도)

  pages/                  ── 화면 1개 = 파일 1개, 도메인별 폴더
    guest/                Home, Scan, ProductConfirm, ProductDetail, AvatarCreate,
                          CoordiDetail, PhotoFitting, PhotoFittingResult, UploadLimitReached
    auth/                 Login, OAuthCallback, Complete
    mypage/               MyPage, Account, Saved, SavedDetail
    shop/                 Cart, Orders, OrderDetail
    care/                 Care, CareDetail, RegisterProduct,
                          Diagnose, DiagnosisResult, RepairReserve, Reservations
```

**어디를 고쳐야 하나**

| 하려는 일 | 볼 파일 |
| --- | --- |
| 백엔드 응답 필드가 다름 | `api/index.js` + `store/data.js` 의 `LOADERS` |
| 화면 문구·레이아웃 | `pages/<도메인>/<화면>.jsx` |
| 공통 헤더·탭 | `components/Screen.jsx` |
| 색·폰트·버튼 스타일 | `index.css` 의 `@theme` / `@layer components` |
| 새 화면 추가 | `pages/<도메인>/` 에 파일 추가 → `App.jsx` 에 라우트 한 줄 |

### 명세 반영 포인트

- **공통 응답**(§1.3/1.4): interceptor 가 `data` 만 반환하고 실패는 `ApiError{code,message,details,status}` 로 던집니다. 화면은 서버 `message` 를 그대로 노출하고, envelope 없이 떨어진 경우만 상태코드별 기본 문구를 씁니다.
- **인증**(§3): access 2시간 / refresh 14일. `TOKEN_EXPIRED` → `/auth/refresh` 후 원요청 1회 재시도(동시 요청도 재발급은 1회만), 실패 시 토큰 폐기 후 `/login`.
- **소셜 로그인**(§3): SDK 스크립트 없이 표준 리다이렉트. `/oauth/callback` 에서 `state` 대조 후 code 를 백엔드에 전달합니다. **Google / Kakao** (초기 논의의 네이버가 아니라 명세 확정값).
- **게스트 이관**(§3 `/auth/claim`): 로그인 성공 직후 `guestToken` 이 있으면 자동 호출하고 게스트 토큰을 비웁니다.
- **주문**(§12): `POST /orders` 가 `cartItemIds` 를 받으므로 장바구니에 항목 선택 체크박스가 있습니다. 금액은 서버가 재계산하므로 화면에는 "결제 예정"으로만 표기.
- **Job**(§7): 진단은 202 → 1.5초 폴링, 90초까지 대기 후 실패 처리(명세 AI 상한 60초).
- **파일**(§16): 개인 파일은 토큰이 필요해 `<img src>` 직결 불가 → `useFileUrl` 이 blob 으로 받아 objectURL 로 렌더. 업로드는 전송 전 형식/용량(사진 20MB, 영상 100MB, 최대 5개) 검증.
- **시간**(§1.1): 표시·기본값 모두 KST.

## 백엔드 계약

**단일 기준은 배포된 OpenAPI 문서입니다.** 명세서(`docs/API_SPEC.md`)와 다른 곳이 있으므로 필드명은 항상 이쪽을 확인하세요.

```
https://<백엔드주소>/openapi.json     # 스키마 41개 엔드포인트
https://<백엔드주소>/docs             # Swagger UI
```

`src/api/mock.js` 는 이 스키마와 같은 모양으로 맞춰져 있습니다. mock 모드로 짠 화면이 실서버에서 그대로 도는지 여기서 먼저 검증됩니다.

**명세서와 실제 구현이 다른 곳** (실제 구현 기준으로 코드 작성됨)

| 항목 | `docs/API_SPEC.md` | 실제 백엔드 |
| --- | --- | --- |
| 예약 목록 | `GET /me/repair-reservations` | `GET /repair-reservations` |
| 예약 취소 | `PATCH /me/repair-reservations/{id}` | `POST /repair-reservations/{id}/cancel` |
| 예약 필드 | `reservationId`, `memo` | `repairReservationId`, `note` |
| 예약 생성 | `diagnosisId` 선택 | **필수** — 진단 없이 예약 불가 |
| 진단 심각도 | `severity` 1~3 | `low` / `medium` / `high` |
| 회원 프로필 | `provider` | `authProvider` (소문자) |
| 매장 목록 | `{items:[...]}`, `slots` | `{stores:[...]}`, `availableSlots` |
| 장바구니 항목 | `productName`, `optionName`, `inStock` | `name`, `color`+`size`, `stock` |

### 데모 폴백

상품 seed 가 서버에 없어서 카탈로그에 기대는 호출이 전부 실패한다. 그래서 그런 호출이 한 번이라도
`PRODUCT_NOT_FOUND` 류로 실패하면 **탭 세션 동안 그 구간 전체를 `mock.js` 더미로 돌린다**
(`callOrDemo` in `api/index.js`). 처음 전환될 때 토스트로 알린다.

- 더미로 도는 구간: 품번 인식 · 상품/추천 · 가상 피팅 · 코디 · 장바구니 · 주문 · 보유 제품 · 진단 · 수리 예약
- 실서버 그대로: 로그인/회원가입/소셜 · `/me` · 아바타 · 게스트 세션

장바구니만 더미고 목록은 실서버면 담은 물건이 사라지므로 도메인을 통째로 넘긴다.
**백엔드에 상품 seed 가 들어오면 첫 호출이 성공해서 폴백은 아예 켜지지 않는다.**
정리할 때는 `callOrDemo` 를 `call` 로 되돌리고 해당 블록만 지우면 된다.

**아직 백엔드에 없는 것**

- **카탈로그 목록 API** — `GET /products/{id}` 단건만 있어 상품 목록을 서버에서 못 받아옵니다. 홈·상품 화면은 `src/data/mcm_products_mock_data_v2.json` + `src/assets/product/*.jpg` 로컬 데이터를 씁니다.
- **상품 seed 데이터** — 매장은 시드가 있지만 상품이 비어 있어 OCR 인식 성공, 장바구니 담기, 주문, 보유 제품 등록(`SERIAL_NOT_FOUND`), 진단, 예약 생성이 연쇄로 막혀 있습니다. 코드는 모두 연결돼 있고 데이터만 들어오면 됩니다.
- `POST /auth/claim` 이 최근 본 상품만 이관합니다. 게스트가 만든 피팅·코디는 로그인해도 넘어오지 않습니다.

로컬/서버 상품을 가르는 분기는 `api.isServerProduct(id)` 한 곳에 모여 있습니다 (로컬은 정수 id, 서버는 UUID). 카탈로그 API 가 생기면 이 분기를 지우면 됩니다.

## 남은 작업

- **상품 seed 투입 후 재검증**: OCR 성공 경로, 가상 피팅 결과 이미지, 서버 추천 렌더링은 상품이 없어 아직 실행해보지 못했습니다.
- **배포 환경변수**: 배포처의 `VITE_API_URL` 이 비어 있으면 API 가 전부 실패합니다. 값 등록 후 재배포(빌드 타임에 번들에 굳습니다).
- **회원 화면 좌상단 메뉴**: 드로어는 게스트 구간 헤더(`components/guest/Header.jsx`)에만 있습니다. `components/Screen.jsx` 는 좌상단이 뒤로가기라 메뉴가 없습니다.
- **PWA**(`vite-plugin-pwa`): 192/512 PNG 아이콘 에셋이 나오면 추가. 지금은 설치 유도 UI 없음.
- **브랜드 엠블럼**: `components/Emblem.jsx` 는 **플레이스홀더**입니다. 공식 로고 SVG 를 받으면 그 파일 내용만 교체하세요.
- **무한스크롤**: 목록이 20건을 넘기 시작하면 `meta.pagination.nextCursor` 로 추가 로드 필요.
- **TanStack Query**: 현재 zustand 캐시로 충분해서 미도입. 재검증·백그라운드 갱신이 필요해지면 그때.
