# custom-todo (Keepgoing)

개인용 To-do 앱 — macOS / iOS 웹 (PWA). Things 스타일의 liquid glass 디자인.
Claude Design 핸드오프를 기반으로 구현했습니다.

## 스택

- **Vite + React 19 + TypeScript**
- **Supabase** (Postgres + RLS + magic-link / password 인증) — 동기화
- **PWA** (vite-plugin-pwa, Workbox) — iOS 설치 + 가벼운 오프라인 캐시
- **dnd-kit** — task / 프로젝트 드래그 정렬

## 실행

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # dist/ 생성
npm run preview  # 빌드 결과 로컬 서빙
```

## 디렉토리 구조

```
src/
  App.tsx              # 루트 상태 + 뷰 라우터
  main.tsx             # 엔트리
  index.css            # 디자인 토큰 + liquid glass primitive + .log-* 등
  types.ts             # Task / Project / Group / View / NewTaskPayload / IconName
  components/
    Icon.tsx, Checkbox.tsx, TaskRow.tsx, Sidebar.tsx, GroupHeader.tsx
    NewTaskModal.tsx, QuickFindModal.tsx, ChangePasswordModal.tsx
    Select.tsx, DatePicker.tsx, SortableTaskList.tsx
    AuthGate.tsx, AuthScreen.tsx, UndoToast.tsx
  views/
    TodayView.tsx, ProjectView.tsx, UpcomingView.tsx, ListView.tsx, LogbookView.tsx
  data/
    helpers.ts (todayIso/formatDue/parseRepeat/computeCounts/computeNextDue)
    seed.ts (초기 시드)
    colors.ts (프로젝트 색상 팔레트)
  lib/
    supabase.ts, auth.tsx, data.tsx, seedNewUser.ts
supabase/
  schema.sql           # idempotent 스키마 (groups / projects / tasks + RLS)
```

## 뷰 구성

- **Today** — 오늘 / This evening 버킷 task
- **Upcoming** — 캘린더 뷰. 셀 클릭 → 그 날짜의 task가 하단 패널에. + 버튼은 선택일을 default로 모달 오픈
- **Inbox** — 프로젝트 없고 today/evening 활성 아닌 모든 task (Tomorrow / Anytime / Someday / 무지정 모두 포함). due 가까운 순 정렬, 드래그 비활성
- **Anytime / Someday** — `when === "anytime"|"someday"` task
- **Project** — 프로젝트별 뷰. Today / Upcoming / Anytime / Someday 섹션
- **Logbook** — 완료 task archive. 월별 그룹, List / Timeline variant 토글

## 진행 현황

- [x] **P0** — Vite + TS 프로젝트로 마이그레이션
- [x] **P1** — `useLocalStorage` 훅으로 영속화 (P2에서 Supabase로 대체됨)
- [x] **P2** — Supabase Postgres + magic-link/password 인증 + RLS
- [x] **P3** — PWA + 가벼운 오프라인 캐시 (Workbox)
- [x] **P4 (대부분 완료)** — 단축키, 드래그 정렬, Quick find, 프로젝트 rename / drag / 색상 자동, 디자인 시스템 컴포넌트 (Select / DatePicker / Checkbox), Logbook, future-date scheduling, hard deadline, Inbox derived 등

## 미구현 / 껍데기만 있는 UI

아래 항목들은 시각적으로는 보이지만 클릭해도 동작하지 않습니다. 실제 기능을 붙이거나, 아니면 hide 할지 결정 필요.

### 1. 모든 뷰 toolbar의 Filter / More 아이콘
- 위치: `TodayView.tsx`, `ProjectView.tsx`, `ListView.tsx`, `LogbookView.tsx` (toolbar 우측)
- 현재: `<span className="icon-btn">` + 아이콘만, `onClick` 없음
- 메모: Logbook 핸드오프에는 명시적으로 "out of scope (placeholder)"로 표기됨

### 2. NewTaskModal 좌측 하단의 attachment / tag 아이콘
- 위치: `NewTaskModal.tsx` 푸터 좌측
- 현재: `<span className="icon-btn">` 2개. `onClick` 없음
- attachment는 첨부 파일, tag는 태그 빠른 추가용으로 추정되지만 미구현

### 3. TaskRow 우측 액션의 tag 아이콘
- 위치: `TaskRow.tsx` right-actions 영역 (DatePicker ↔ tag 아이콘 ↔ delete 사이)
- 현재: `<span className="icon-btn"><Icon name="tag" />` — `onClick` 없음
- 양옆이 작동하니 이것만 비활성이라 더 어색함

### 4. Inbox 뷰에서 Quick add 시 default When
- 현재: Inbox 뷰에서 Ctrl+N 또는 Quick add 버튼 → 모달이 `when="today"`로 열림 → 그대로 입력 시 Today로 감
- 기대: Inbox 뷰의 Quick add는 `when="inbox"` 등 inbox-friendly default여야 자연스러움
- 해결안: App.tsx에서 view-aware default를 modal에 전달

### 5. Logbook subtask 칩 (디자인은 있으나 미구현)
- 디자인 핸드오프에는 task의 subtask 진행률 칩이 있으나 우리 스키마에 subtask 컬럼이 없어서 코드에 chip 자체를 만들지 않음
- subtask 기능을 추가할 계획이 없으면 그대로 두면 됨 (시각적 placeholder 없음)

### 6. Logbook completedAt의 정확성
- 현재: `tasks.updated_at`을 completedAt 프록시로 사용
- 한계: task 완료 후 다른 편집(notes / due 변경 등)이 있으면 timestamp가 밀림
- 정확성을 원하면 별도 `completed_at timestamptz` 컬럼 + done 토글 시 set / unset 트리거 필요

### 7. Logbook 페이지네이션
- 현재: 모든 done task를 한 번에 불러와 렌더
- 한계: task 양이 많아지면 메모리 / 렌더 비용 증가
- 해결안: IntersectionObserver 기반 월별 lazy load

### 8. 모바일 PWA 동작 검증
- 데스크톱 preview에서는 동작 확인됨
- iOS 실기기에서 install + offline 동작은 미검증 (HTTPS 필요 — Vercel preview deploy 등으로 검증 예정)

## 디자인 출처

원본 디자인은 Claude Design (claude.ai/design)에서 작업.
초기 프로토타입은 [최초 커밋](https://github.com/tokkifromspace/custom-todo/commit/75e6c4d) 에 보관됨.

핸드오프 폴더 (예: Logbook의 경우 `~/Downloads/design_handoff_logbook`)는 구현 완료 후 삭제 가능.
디자인 의도가 모두 코드에 흡수되어 있고, README는 git에 추적되지 않습니다.
