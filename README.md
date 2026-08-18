# Atelier Lens — 프론트엔드 (로그인 이후 / MEMBER 구간)

React 19 + Vite + Tailwind v4 + React Router 7 + Zustand + axios.
**Atelier Lens API 명세서 MVP v3.0 (2026-08-13 확정본)** 기준으로 구현했습니다.

```bash
npm install
npm run dev      # http://localhost:5173 — 백엔드 없이 바로 클릭해볼 수 있습니다
```

## 실행 모드

| 상황 | 설정 | 동작 |
| --- | --- | --- |
| 백엔드 없음 (기본 dev) | `.env.development` 의 `VITE_USE_MOCK=true` | `src/api/mock.js` 의 더미로 전 화면 동작 |
| 백엔드 로컬 기동 | `VITE_USE_MOCK=false`, `VITE_API_PROXY=http://localhost:8000` | dev 서버가 `/api` 를 프록시 (CORS 없음) |
| 배포 | 환경변수에 `VITE_API_URL` 지정 (`VITE_USE_MOCK` 미설정) | **항상 실제 API 호출** |

프로덕션 빌드는 `VITE_USE_MOCK` 을 켜지 않는 한 더미를 타지 않습니다. `.env.example` 을 복사해 값을 채우세요.

## 배포

- **Vercel**: `vercel.json` 의 SPA rewrite 포함. Framework preset `Vite`, 환경변수만 등록하면 됩니다.
- **Netlify**: `public/_redirects` 포함. Build `npm run build`, Publish `dist`.

## 소셜 로그인 실제 연결

버튼 동작은 **클라이언트 ID 유무로만** 갈립니다 (`VITE_USE_MOCK` 과 무관):

| 상태 | 카카오/구글 버튼을 누르면 |
| --- | --- |
| 클라이언트 ID 없음 | 인가 페이지를 건너뛰고 더미 토큰 발급 (팀원이 키 없이도 화면 확인 가능) |
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

명세 §19 화면 매핑 중 **MEMBER 구간 전체**. 게스트 구간(SP-00, MN-01~03, 추천, 최근 본 상품)은 팀원 담당이라 `pages/GuestStub.jsx` 로 자리만 잡아뒀습니다.

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
| 예약 목록 · 취소 | `/repair-reservations` | `GET·PATCH /me/repair-reservations` |

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
    home/                 GuestStub          ← 팀원 화면으로 교체될 자리
    auth/                 Login, OAuthCallback, Complete
    mypage/               MyPage, Account, Saved
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

## 팀원(게스트 구간) 연동 지점 2개

```js
import { setTokens } from "@/api/tokens";
import { useAuth } from "@/store";

// 1) POST /guest-sessions 응답 저장 — 이후 GUEST 권한 요청에 자동으로 붙습니다
setTokens({ guestToken, guestSessionId });

// 2) 게스트가 저장/담기를 누를 때 의도를 넘기고 MEMBER 라우트로 보내면
//    PrivateRoute → /login → 로그인 → /auth/claim → /complete 까지 알아서 흐릅니다
useAuth.getState().setPending({ type: "coordi", name: "Aren Backpack Look" });
navigate("/complete");
```

`/` 의 "저장 · 장바구니 담기" 버튼이 이 흐름을 그대로 재현합니다. 게스트 화면을 붙일 때 `pages/home/GuestStub.jsx` 를 실제 화면으로 교체하고 `App.jsx` 의 `/`, `/avatar` 라우트만 바꾸면 됩니다.

## 백엔드에 확인해야 할 것 (명세에 응답 body 가 없어 필드명을 추정한 곳)

`src/api/mock.js` 의 형태가 그대로 계약 제안입니다. 다르면 mock.js 와 해당 페이지만 고치면 됩니다. 목록 API 는 배열이든 `{items:[...]}` 든 받도록 정규화해 뒀습니다.

1. `GET /cart` — `{ items:[{cartItemId, productId, variantId, productName, optionName, unitPrice, quantity, thumbnailFileId, inStock}], totalAmount }`
2. `GET /me/coordis` — `{savedCoordiId, name, itemCount, thumbnailFileId, createdAt}`
3. `GET /me/products` — `{registrationId, productName, serialNumber, nickname, source, purchaseDate, thumbnailFileId, lastDiagnosis}` / 상세의 "최근 진단·예약 요약" 필드명
4. `GET /me/orders`, `/me/orders/{id}` — 목록 항목과 snapshot 필드명(`items[].productName/optionName/unitPrice/quantity`)
5. `GET /stores` — `{storeId, name, address, slots: ISO8601[]}` (슬롯이 문자열 배열인지 객체인지)
6. `GET /me/repair-reservations` — `{reservationId, storeName, slot, status, memo}` / `status` 값 집합 (`confirmed|cancelled|completed` 로 가정)
7. `GET /me/products/{id}/care-guide` — `{material, basics[], cautions[], asInfo}`
8. 진단 결과의 **`severity` 범위** — 1~3(경미/보통/심각)으로 표시 중
9. `GET /me` — `provider`(LOCAL/GOOGLE/KAKAO), `createdAt` 포함 여부
10. 목록 API 의 `meta.pagination` 적용 대상 (현재는 첫 페이지만 사용, 무한스크롤 미구현)

## 남은 작업

- **PWA**(`vite-plugin-pwa`): 192/512 PNG 아이콘 에셋이 나오면 추가. 지금은 설치 유도 UI 없음.
- **브랜드 엠블럼**: `components/Emblem.jsx` 는 **플레이스홀더**입니다. 공식 로고 SVG 를 받으면 그 파일 내용만 교체하세요.
- **무한스크롤**: 목록이 20건을 넘기 시작하면 `meta.pagination.nextCursor` 로 추가 로드 필요.
- **TanStack Query**: 현재 zustand 캐시로 충분해서 미도입. 재검증·백그라운드 갱신이 필요해지면 그때.
