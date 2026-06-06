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

## 현재 Sprint — Sprint 8: 무지개정원

### 목표
공개 추모 커뮤니티 공간 — 전광판 메시지 + 아이 카드 리스트 + 스티커 + 한 줄 입력창

### Task 목록
- [x] **8-1. 정원 메인 페이지** (`app/(main)/garden/page.tsx`)
  - Hero: `garden-night.png` 배경, 떠다니는 메시지 twinkle 애니메이션, "23명" 배너
  - 카드 패널: borderTopRadius 24, 아이 카드 리스트
  - 하단 고정 입력바: 텍스트 입력 + "전광판에 올리기" 버튼
- [ ] **8-2. API 라우트**
  - `GET /api/garden` — gardenPublic=true 펫 + 스티커 집계
  - `POST /api/garden/message` — 전광판 메시지 등록
  - `POST /api/garden/sticker` — 스티커 전송

### DB 모델 (schema에 이미 존재)
- `GardenMessage`: id, userId, content, isHidden, createdAt
- `GardenSticker`: id, fromUserId, toPetId, stickerType, createdAt (unique [fromUserId, toPetId, stickerType])
- `Pet.gardenPublic: Boolean @default(true)`

### 디자인 참조
- `v2-garden-v3.jsx` 함수: `V2GardenV3()`, `GardenHero()`, `GardenChildCard()`
- 배경: `public/garden-night.png`
- 색상: bg `#1C0F2E`, primary `#8F44D0`, accent `#FEBE98`, cards panel `#F0EBF4`

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
