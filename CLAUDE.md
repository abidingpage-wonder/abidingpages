@AGENTS.md

# Abiding Pages — 개발 컨텍스트

## 프로젝트 개요
펫로스 보호자를 위한 AI 편지 기반 49일 애도 동행 PWA.
- **스택**: Next.js (App Router) · Supabase Auth · Prisma · PostgreSQL · Claude API
- **디자인 파일**: `/Users/apple/Desktop/abiding_v2/abiding-design-v2/project/Screens v2.html`
- **PRD**: `/Users/apple/Desktop/abiding_v2/ABIDING_PAGES_PRD_v1.1.md`

---

## 완료된 Sprint

### Sprint 1–5 (기완료)
- 프로젝트 세팅 + DB + 인증
- 온보딩 + 아이 정보
- 홈 대시보드 (3상태)
- 감정 선택 + 편지 작성
- AI 답장 생성 + 답장 확인 (`/reply/[letterId]`)

### Sprint 6 — 보관함 (기완료)
- `app/(main)/archive/page.tsx` — 타임라인 + 추억사진

### Sprint 6 후속 — 내가 보낸 편지 + UI 폴리싱 (기완료)
**파일**: `app/(main)/letter/[letterId]/page.tsx`

**구현 내용**:
- 폴라로이드 사진 레이아웃 (0/1/2/3장 분기)
  - 0장: 사진 없이 편지지+봉투만, 상단 padding 16px
  - 1장: width 52%, marginTop 8% (프레임 내부 inset 10%)
  - 2장: grid 1fr 1fr, marginTop 4% (inset 10%)
  - 3장: width 100%, marginTop 2% (inset 3%/5% — 더 넓게)
- 폴라로이드 배경: `#f8f4f0` (미색)
- 사진 프레임 PNG (`letter-lav-photo-bg 2.png`): drop-shadow on container
- 편지지+봉투 PNG (`letter-lav-photo-bg 3.png`): drop-shadow on container
- 편지 텍스트 폰트: `var(--font-handwriting)` = Nanum Pen Script, 17px
- 닫기 버튼: borderRadius 999 (pill)
- 상단 sticky 헤더: "엄마가 순탄이에게" + "내가 보낸 편지" pill 배지

**Asset 파일** (`public/`):
- `letter-lav-photo-bg 2.png` — 사진 프레임 (889×529, RGBA)
- `letter-lav-photo-bg 3.png` — 편지지+봉투 (890×850, RGBA)

**답장 페이지** (`app/(main)/reply/[letterId]/page.tsx`):
- 모든 버튼 borderRadius: 999 pill 형태로 통일

---

## 완료된 Sprint (계속)

### Sprint 7 — 여정탭 + 포토카드 (기완료)
**파일**:
- `app/(main)/journey/page.tsx` — 5단계 카드 리스트 + 49일 여정 가이드 카드 (피치톤 강조)
- `app/(main)/journey/guide/page.tsx` — 49일의 여정 가이드 상세 (v2-journey-guide.jsx 기반)
- `app/(main)/archive/page.tsx` — 여백 개선 + 추모카드 그라데이션 개선

**구현 내용**:
- 여정 가이드 페이지: 수직 커넥터 리스트 (5단계 항상 펼침), 인트로 카드, 나의 속도로 카드, 주의사항 카드, CTA 버튼
- StageCard + 자유롭게 편지쓰기 카드: 캔버스 질감 (repeating-linear-gradient 43°/133°)
- 49일 가이드 카드: 피치 그라데이션 강조 (#f5c4a7→#faddca→#ede4f3)
- 보관함 여백 전반 개선 + 추모카드 흰색 그라데이션 영역 확대

---

### Sprint 8 — 추모 정원 (기완료)

**파일**:
- `app/(main)/garden/page.tsx` — 추모 정원 메인 (전광판 + 카드 패널 + 입력바)
- `app/(main)/garden/[petId]/page.tsx` — 추모관 상세 페이지
- `app/(main)/archive/page.tsx` — 추모관 카드 스티커 연결 + 상세 페이지 이동
- `app/api/garden/route.ts` — 정원 데이터 API
- `app/api/garden/[petId]/route.ts` — 추모관 상세 API (mock 포함)
- `app/api/garden/[petId]/comment/[commentId]/route.ts` — 댓글 수정/삭제
- `app/api/garden/sticker/route.ts` — 스티커 API (타입별 독립 카운트)
- `app/api/archive/route.ts` — 보관함 API (petId: mock-pet-suntan 통일)
- `components/layout/TopBar.tsx` — `/garden/*` 투명 헤더

**구현 내용**:
- Hero: `garden-night.png` 배경 (full-bleed, marginTop: -72), 전광판 메시지 twinkle 애니메이션, 20s 폴링
- 카드 패널: `background: #d9ccdf`, 추모관 카드 리스트 (스티커 + 클릭 → 상세)
- 추모관 카드: `background: #e8e0f0`, 캔버스 질감 제거, radial-gradient만 유지
- 스티커: `candle/flower/heart` 타입별 독립 (`@@unique([fromUserId, toPetId, stickerType])`), 클릭 시 해당 타입만 서버 응답으로 업데이트
- `N개의 마음이 전해졌어요` = `candle + flower + heart` 총합
- 스티커 0개일 때 `+` 배지 (dashed border)
- 추모관 상세 페이지: garden-night.png 동일 구조, 카드 투명 오버레이(흰색 텍스트), 댓글 패널
- 댓글: 본인 글 `···` 메뉴 → 인라인 수정 / 삭제 (`isOwner` 서버사이드 판별)
- 입력바: `bottom: 86`, 종이비행기 SVG 전송 버튼, `마음 한 줄` 섹션명
- DEV mock: `petId.startsWith('mock-')` → `mock-pet-suntan` 통일 (garden/archive/sticker API 모두)
- 보관함 → 추모관 상세 연결: 카드 클릭 → `router.push('/garden/mock-pet-suntan')`

**여정 탭 추가**:
- 잠긴 주차 카드(2~7주) `opacity: 0.52` 적용

**DB 모델**:
- `GardenMessage`, `GardenSticker`, `GardenComment` (Prisma)
- `GardenComment`: `PATCH/DELETE /api/garden/[petId]/comment/[commentId]`

---

---

### Sprint 9 — 결제 (기완료)

**파일**:
- `app/(main)/plan/page.tsx` — 플랜 선택 화면 (Free/Pro 비교)
- `app/(main)/share/page.tsx` — 서비스 공유 화면
- `app/(main)/profile/page.tsx` — 내정보 페이지 (플랜 카드 + 메뉴)
- `app/payments/toss/page.tsx` — TossPayments 결제 요청
- `app/payments/toss/confirm/page.tsx` — 결제 승인 콜백 + 성공 화면
- `app/payments/toss/fail/page.tsx` — 결제 실패/취소 화면
- `app/api/payments/toss/confirm/route.ts` — 결제 승인 API
- `app/api/payments/plan/route.ts` — 플랜 조회 API (만료 체크 포함)
- `components/layout/TopBar.tsx` — 공유 버튼 → `/share` 연결

**구현 내용**:
- 플랜 화면: Free/Pro 카드 비교, 혜택 항목(PlanRow), FAQ 아코디언, 심리치료 비대체 안내
- TossPayments: `@tosspayments/payment-sdk` 설치, 금액 위변조 검증(4,900원)
- 결제 승인: payments INSERT + users.plan=pro + planExpires=+100일 (트랜잭션)
- 결제 완료 화면: 어바이딩 로고 아이콘(icon-192x192.png)
- 서비스 공유: 편지봉투 SVG 일러스트, 링크 복사(3단계 fallback), 카카오 공유
- 링크 복사 fallback: Clipboard API → execCommand → Web Share API → URL 노출
- 홈 배너 → `/plan` 링크 연결
- 헤더 타이틀 색상: `var(--lav-800)` → `#6b6080` (플랜·공유·여정가이드)
- 버튼 borderRadius: 999 (pill) 통일

**미완료 (설정 필요)**:
- Supabase `payments` 테이블 생성 SQL 필요
- `.env.local` / Vercel 환경변수: `NEXT_PUBLIC_TOSS_CLIENT_KEY`, `TOSS_SECRET_KEY`
- 카카오 SDK 연동 (현재 Web Share API fallback으로 동작)

---

## 현재 Sprint — Sprint 10: 푸시알림 + 알림설정

### 다음 작업 후보
- Web Push 구독 (`/api/push/subscribe`)
- 답장 생성 완료 시 푸시알림
- 내정보 페이지 고도화 (온보딩 내용 수정)

---

## 주요 컨벤션

### 색상 토큰 (`globals.css`)
```
--lav-500: #8b6bb8   (주요 라벤더)
--font-handwriting: 'Nanum Pen Script', cursive
--font-brand: 'Allura', 'Dancing Script', cursive
--bg-app: #f3eef6
```

### 버튼 스타일 통일
- 메인 CTA: `borderRadius: 999`, `padding: '14px 0'`
- 보조 버튼: `borderRadius: 999`, border 1px solid

### 레이아웃
- MainLayout: TopBar(고정) + `<main>` paddingTop:72 paddingBottom:96 + BottomNav
- 하단 탭: 홈 / 정원 / 여정 / 보관함 / 내정보
