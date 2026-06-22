# [Request → ②] 얌피 공용 컴포넌트 폴리시 (인터랙션 상태 · 레이아웃)

> **목적**: 공통 컴포넌트의 hover/pressed 상태 통일 + 관련 레이아웃 일관성 이슈를 일괄 정리한다.
> **담당**: ② 디자인시스템 오너 — 본 문서를 기준으로 `apps/web/src/components/common/**` 일괄 적용.
> **선행 문서**: `docs/DESIGN.md` (토큰), `docs/COMPONENTS.md` (컴포넌트 명세).
> **포함 범위**:
> - §1–§4: hover/active 인터랙션 상태 (패턴·컴포넌트별 변경)
> - §5: Header 좌측 chevron placeholder (타이틀 위치 일관성)
> - §6: Header safe-area top padding (PWA standalone 노치·Dynamic Island 대응)
> - §7–§11: 우선순위·검증·운영

---

## 1. 배경

### 1-1. 현재 상태 (2026-06-22 기준 audit)

`apps/web/src/components/common/` 내 27개 컴포넌트 중 인터랙티브 17개 기준:

| 적용 완료 (2) | 누락 (14) |
|:---|:---|
| `IconButton`, `Selectbox` | `BottomSheet`, `Button`(custom variants), `Check`, `Chip`, `Confirmbox`, `Footer`(button variant), `GroupDetailCard`, `Header`(icon buttons), `List`, `Menubar`, `Notification`, `Radio`, `Toggle`, `VoteResultSelect` |

### 1-2. 문제

- 실 페이지에서 클릭/탭해도 시각 피드백이 없어 "눌렸는지" 알기 어려움
- 모바일 PWA 환경에서 터치 피드백 부재는 사용성 저하
- 이미 토큰(`--fill-normal`, `--fill-strong`, `--primary-strong`, `--primary-heavy`)은 정의되어 있어 추가 정의 불필요

---

## 2. 표준 패턴 (5종)

### Pattern A — Fill Overlay (중성 / 행·카드·아이콘 버튼)

배경이 transparent 또는 `--bg-normal`인 중성 인터랙션 요소에 사용. 회색 오버레이로 깊이감을 준다.

```
hover  → bg-[var(--fill-normal)]    (8% gray)
active → bg-[var(--fill-strong)]    (16% gray)
```

**적용 대상**: 클릭 가능한 row, 카드, transparent icon button.

### Pattern B — Primary Brand (주요 CTA)

`--primary` 배경을 가진 주요 액션 버튼.

```
hover  → bg-[var(--primary-strong)]   (#D63D28)
active → bg-[var(--primary-heavy)]    (#B23420)
```

**적용 대상**: Footer button variant, Confirmbox primary button, 그 외 `bg-[var(--primary)]` 풀 CTA.

> 토큰은 이미 [DESIGN.md §1-1](./DESIGN.md)에 정의되어 있다.

### Pattern C — Opacity (브랜드·복합 요소)

배경색을 바꿀 수 없는 브랜드 컬러나, 아이콘+라벨 조합으로 fill bg가 어색한 컴포넌트.

```
hover  → opacity-70
active → opacity-50
```

**적용 대상**: Menubar 탭(아이콘+라벨), 가운데 만들기 버튼, Kakao/Toss 브랜드 버튼.

> 브랜드 색(카카오 노랑, 토스 파랑)은 hex shift가 브랜드 가이드 위반이라 opacity 사용.

### Pattern D — Selectable (토글류, 선택 상태 분기)

이미 selected/unselected를 갖는 컴포넌트는 **선택 안 된 상태에서만** hover 표시.

```
unselected hover → bg-[var(--fill-normal)]  (또는 border 강조)
selected         → hover 없음 (이미 강조 상태)
active(both)     → bg-[var(--fill-strong)] / opacity-80
```

**적용 대상**: Check, Radio, Toggle, Chip(선택형).

### Pattern E — Border Emphasis (테두리 강조형 카드)

이미 codebase의 settlement 화면(`apps/web/src/app/meetings/[meetingId]/settlement/new/page.tsx:51`)에서 사용 중인 패턴.

```
hover  → border-[var(--primary)]
active → bg-[var(--fill-normal)] + border-[var(--primary)]
```

**적용 대상**: 선택형 큰 카드 (메뉴 선택, 옵션 카드 등 — 페이지 레벨에서 주로 사용).

---

## 3. 전환 (Transition)

모든 상태 변경에 transition 클래스를 함께 적용한다.

| 패턴 | 클래스 |
|:---|:---|
| A · B · D · E | `transition-colors` |
| C | `transition-opacity` |
| 복합 변화 | `transition-all` (지양, 명시적 prop 권장) |

duration은 Tailwind 기본값(`150ms`)로 충분. 별도 지정 불필요.

---

## 4. 컴포넌트별 적용 체크리스트

> 모든 변경은 **클래스 추가만**으로 가능. 기존 동작·구조 영향 없음.

### 4-1. `Notification.tsx` (Pattern A)

**현재**:
```tsx
className={cn(
  'flex items-center gap-4 px-[21px] py-[13px]',
  'w-full bg-[var(--bg-normal)] border-b border-[var(--line-neutral)]',
  onClick ? 'cursor-pointer' : 'cursor-default',
  className
)}
```

**적용**:
```tsx
className={cn(
  'flex items-center gap-4 px-[21px] py-[13px]',
  'w-full bg-[var(--bg-normal)] border-b border-[var(--line-neutral)]',
  'transition-colors',
  onClick
    ? 'cursor-pointer hover:bg-[var(--fill-normal)] active:bg-[var(--fill-strong)]'
    : 'cursor-default',
  className
)}
```

### 4-2. `Menubar.tsx` (Pattern C)

**TAB_BTN 상수**:
```diff
- 'flex flex-col items-center gap-1 w-14 bg-transparent border-none cursor-pointer p-0'
+ 'flex flex-col items-center gap-1 w-14 bg-transparent border-none cursor-pointer p-0 transition-opacity hover:opacity-70 active:opacity-50'
```

**가운데 만들기 버튼 className**:
```diff
- "flex flex-col items-center gap-1 w-11 bg-transparent border-none cursor-pointer p-0"
+ "flex flex-col items-center gap-1 w-11 bg-transparent border-none cursor-pointer p-0 transition-opacity hover:opacity-70 active:opacity-50"
```

### 4-3. `Header.tsx` (Pattern A) — 아이콘 버튼

**ICON_BTN 상수**:
```diff
- 'flex items-center justify-center w-10 h-10 bg-transparent border-none cursor-pointer text-[var(--label-normal)]'
+ 'flex items-center justify-center w-10 h-10 bg-transparent border-none cursor-pointer text-[var(--label-normal)] rounded-[var(--radius-full)] transition-colors hover:bg-[var(--fill-normal)] active:bg-[var(--fill-strong)]'
```

> 아이콘 버튼은 hit area를 명시하기 위해 `rounded-full` 함께 적용 (IconButton.tsx 패턴 일치).

**Bell 버튼(showBell)**: 이미 `bg-[var(--bg-alternative)] rounded-full` 형태 → 같은 패턴 추가:
```diff
- "relative flex items-center justify-center w-[42px] h-[42px] bg-[var(--bg-alternative)] rounded-[var(--radius-full)] border-none cursor-pointer text-[var(--label-normal)]"
+ "relative flex items-center justify-center w-[42px] h-[42px] bg-[var(--bg-alternative)] rounded-[var(--radius-full)] border-none cursor-pointer text-[var(--label-normal)] transition-colors hover:bg-[var(--fill-strong)] active:bg-[var(--fill-strong)]"
```

> Bell 버튼은 기본 bg가 이미 `--bg-alternative`라 `fill-normal`로는 변화 식별 어려움 → hover/active 모두 `fill-strong` 사용.

### 4-4. `Footer.tsx` (Pattern B) — button variant

**기본 primary 버튼**:
```diff
  disabled
    ? 'bg-[var(--fill-disable)] text-[var(--label-disable)] cursor-default'
-   : 'bg-[var(--primary)] text-[var(--static-white)] cursor-pointer'
+   : 'bg-[var(--primary)] text-[var(--static-white)] cursor-pointer transition-colors hover:bg-[var(--primary-strong)] active:bg-[var(--primary-heavy)]'
```

### 4-5. `Button.tsx` — 커스텀 variant들

#### KakaoLoginButton·KakaoPayButton (Pattern C)

```diff
- BRAND_BASE
+ BRAND_BASE,
+ 'transition-opacity hover:opacity-90 active:opacity-80',
```

(BRAND_BASE 상수 자체에 넣어도 무방)

#### TossPayButton (Pattern C)

동일.

#### RadiusButton — variant별 분기

`radius-border-inactive`는 `cursor-default`라 hover 없음. 나머지 4개에 Pattern A 적용:

```diff
  const RADIUS_CLASSES: Record<RadiusVariant, string> = {
-   radius: 'bg-[var(--fill-normal)] text-[var(--label-alternative)]',
+   radius: 'bg-[var(--fill-normal)] text-[var(--label-alternative)] hover:bg-[var(--fill-strong)] active:bg-[var(--fill-strong)]',
-   'radius-border':
-     'bg-transparent text-[var(--label-normal)] border border-[var(--line-normal)]',
+   'radius-border':
+     'bg-transparent text-[var(--label-normal)] border border-[var(--line-normal)] hover:bg-[var(--fill-normal)] active:bg-[var(--fill-strong)]',
-   'radius-border-colored':
-     'bg-transparent text-[var(--primary)] border border-[var(--primary)]',
+   'radius-border-colored':
+     'bg-transparent text-[var(--primary)] border border-[var(--primary)] hover:bg-[var(--primary-tint)] active:bg-[var(--primary-tint)]',
    'radius-border-inactive':
      'bg-[var(--fill-disable)] text-[var(--label-disable)] border border-[var(--line-alternative)] cursor-default',
-   'radius-border-selected':
-     'bg-[var(--primary-tint)] text-[var(--primary)] border-[1.5px] border-[var(--primary)]',
+   'radius-border-selected':
+     'bg-[var(--primary-tint)] text-[var(--primary)] border-[1.5px] border-[var(--primary)] active:bg-[var(--primary-tint)]',
  };
```

RadiusButton의 base 클래스에 `transition-colors` 추가:
```diff
- 'inline-flex items-center justify-center gap-1 h-8 px-[14px]',
- 'rounded-[var(--radius-full)] text-[13px] font-semibold font-[var(--font-sans)] cursor-pointer',
+ 'inline-flex items-center justify-center gap-1 h-8 px-[14px]',
+ 'rounded-[var(--radius-full)] text-[13px] font-semibold font-[var(--font-sans)] cursor-pointer transition-colors',
```

### 4-6. `Confirmbox.tsx` (Pattern B + A)

- 확인 버튼(primary): Pattern B 적용 (`hover:bg-[var(--primary-strong)] active:bg-[var(--primary-heavy)]`)
- 취소 버튼(secondary): Pattern A 적용 (`hover:bg-[var(--fill-normal)] active:bg-[var(--fill-strong)]`)
- 두 버튼 모두 `transition-colors`

### 4-7. `BottomSheet.tsx` (Pattern A) — 닫기 버튼

닫기 아이콘 버튼에 Pattern A 적용. Header `ICON_BTN`과 동일 패턴 권장:
```
rounded-[var(--radius-full)] transition-colors hover:bg-[var(--fill-normal)] active:bg-[var(--fill-strong)]
```

### 4-8. `List.tsx` (Pattern A) — list item

클릭 가능한 item에 Notification과 동일 패턴:
```
transition-colors cursor-pointer hover:bg-[var(--fill-normal)] active:bg-[var(--fill-strong)]
```

### 4-9. `GroupDetailCard.tsx` (Pattern A 또는 E)

전체 카드가 클릭 가능하면 Pattern A. 선택형 카드면 Pattern E.
대부분의 detail card는 Pattern A로 충분.

### 4-10. `Check.tsx` · `Radio.tsx` · `Toggle.tsx` (Pattern D)

각 토글 hit area(label + control)에 hover 적용:
- unselected 상태: `hover:bg-[var(--fill-normal)]`
- selected 상태: hover 미적용 (이미 강조됨)
- 공통: `active:opacity-80 transition-all`

> Toggle의 thumb는 transform 애니메이션이 이미 있으면 `transition-all` 충돌 주의 — `transition-colors`로 한정 권장.

### 4-11. `Chip.tsx` (Pattern D — 선택형) or (Pattern A — 단순 태그)

- 선택형 chip: Pattern D (선택 안 된 상태에만 hover)
- 표시용 chip: hover/active 없음 (장식 요소)

### 4-12. `VoteResultSelect.tsx` (Selectbox 동일 패턴)

이미 적용된 `Selectbox.tsx`의 패턴을 그대로 미러:
```tsx
'hover:bg-[var(--fill-normal)] active:bg-[var(--fill-strong)] transition-colors'
```

---

## 5. 레이아웃 일관성 — Header 좌측 chevron placeholder

### 5-1. 문제

`Header.tsx`의 좌측 back chevron(`onBack` prop)은 현재 조건부 렌더링이라, `onBack` 미지정 페이지에서는 chevron 노드 자체가 DOM에서 제거된다(=`display: none`과 동등). 결과적으로 타이틀이 좌측 끝으로 당겨진다.

**증상**: back 버튼이 있는 페이지(예: `/meetings/[id]/payments`)와 없는 페이지(예: `/notifications`)의 타이틀 가로 위치가 다르다. 탭 전환·페이지 이동 시 타이틀이 미세하게 점프하는 듯한 느낌.

### 5-2. 원칙

공간은 유지하되 시각만 숨긴다 (= `visibility: hidden` 동등 처리). 이러면 모든 페이지에서 타이틀 시작 좌표가 동일하게 정렬된다.

### 5-3. 변경 (권장 — placeholder `<div>`)

**현재**:
```tsx
{onBack && (
  <button onClick={onBack} className={cn(ICON_BTN, 'shrink-0')}>
    <ChevronLeft size={24} strokeWidth={1.5} />
  </button>
)}
```

**적용**:
```tsx
{onBack ? (
  <button onClick={onBack} className={cn(ICON_BTN, 'shrink-0')}>
    <ChevronLeft size={24} strokeWidth={1.5} />
  </button>
) : (
  <div className={cn(ICON_BTN, 'shrink-0')} aria-hidden="true" />
)}
```

### 5-4. 대안 — `invisible` 버튼

DOM 노드 단일을 선호하는 경우:

```tsx
<button
  onClick={onBack}
  disabled={!onBack}
  aria-hidden={!onBack}
  tabIndex={onBack ? 0 : -1}
  className={cn(
    ICON_BTN,
    'shrink-0',
    !onBack && 'invisible pointer-events-none'
  )}
>
  <ChevronLeft size={24} strokeWidth={1.5} />
</button>
```

### 5-5. 비교

| 접근 | 장점 | 단점 |
|:---|:---|:---|
| **Placeholder `<div>` (권장)** | 의미 깔끔(빈 공간), 접근성 우려 없음, key 핸들러·focus 처리 불필요 | 코드가 살짝 길어짐 |
| `invisible` button | DOM 노드 단일, prop 분기 간결 | disabled·aria-hidden·tabIndex 별도 관리 필요. 일부 reader가 disabled 버튼을 읽을 수 있음 |

→ **placeholder `<div>` 권장**.

### 5-6. 적용 범위

좌측 chevron만 적용. 우측 아이콘(close·settings·bell)은 타이틀 위치에 영향을 주지 않으므로 placeholder 불필요.

> Header `mypage` variant는 타이틀이 중앙 정렬이라 본 이슈 영향 없음. 기본 variant만 수정 대상.

### 5-7. 검증

- [ ] `/notifications` (back 없음)과 `/meetings/[id]/payments` (back 있음)에서 타이틀 `알림`·페이지명의 가로 시작 좌표가 동일한지 픽셀 단위 비교
- [ ] back 없는 페이지에서 chevron 위치를 탭/클릭해도 아무 동작 안 함
- [ ] 스크린리더로 chevron 영역에 도달하지 않음

---

## 6. 레이아웃 일관성 — Header safe-area top padding

### 6-1. 문제

`Header.tsx`의 root는 고정 높이(`h-14` = 56px)만 잡는다. PWA standalone 모드에서 iOS 노치/Dynamic Island, Android status bar가 Header 영역과 겹쳐 타이틀·좌측 chevron·우측 아이콘이 가려진다.

**증상**:
- iOS standalone(홈 화면 추가 후 실행)에서 Dynamic Island가 Header 타이틀과 겹침
- 노치 단말기에서 좌측 chevron이 OS 시계/시그널과 겹침
- Android edge-to-edge 모드에서 status bar가 Header 위로 침범

### 6-2. 원칙

OS가 제공하는 `env(safe-area-inset-top)`을 Header root의 top padding으로 적용. 이미 `Menubar.tsx:97`이 하단에 `env(safe-area-inset-bottom)`를 쓰고 있어 상단도 같은 패턴으로 일관성을 유지한다.

### 6-3. 변경 (권장)

**현재** (`Header.tsx:51`):
```tsx
'h-14 bg-[var(--bg-normal)] flex items-center justify-center px-3 relative shrink-0'
```

**옵션 A — `box-content`로 고정 높이 보장 (단일 레이어 유지)**:
```tsx
'h-14 box-content pt-[env(safe-area-inset-top)] bg-[var(--bg-normal)] flex items-center justify-center px-3 relative shrink-0'
```

`box-content` + `h-14`로 내용 영역 높이 56px는 그대로 유지되고, safe-area padding은 외곽으로 추가된다.

**옵션 B — 2-layer 구조 (스타일 격리)**:
```tsx
<header className="pt-[env(safe-area-inset-top)] bg-[var(--bg-normal)] shrink-0">
  <div className="h-14 flex items-center justify-center px-3 relative">
    {/* 기존 내용 */}
  </div>
</header>
```

DOM 구조 변경이지만 layout/스타일 격리가 명확. ②가 두 옵션 중 코드 영향 적은 쪽 선택.

### 6-4. Menubar 인라인 style 정리 (같은 PR 권장)

`Menubar.tsx:97`이 현재 인라인 `style`로 처리:
```tsx
style={{ paddingBottom: 'max(30px, env(safe-area-inset-bottom))' }}
```

프로젝트 컨벤션(Tailwind 인라인 style 금지)에 맞춰 Tailwind 클래스로 마이그레이션 권장:
```tsx
className="pb-[max(30px,env(safe-area-inset-bottom))]"
```

Header safe-area 작업과 같은 PR에서 함께 처리하면 상·하 safe-area 처리 방식이 통일된다.

### 6-5. 검증

- [ ] iOS PWA standalone (Safari → "홈 화면에 추가" 후 실행)에서 Dynamic Island/노치가 Header 타이틀과 겹치지 않음
- [ ] iPhone SE(노치 없음), iPhone 15 Pro(Dynamic Island), iPhone XR(노치)에서 모두 정상
- [ ] Android Chrome PWA에서 status bar 영역 침범 없음
- [ ] 데스크탑 브라우저(미리보기 모바일 프레임)에서는 `env()`가 0 반환 → 기존 모습 그대로

### 6-6. 적용 범위

- **대상**: `Header` 컴포넌트 전 variant (기본·mypage 등) 일괄 적용
- **함께 처리**: `Menubar` 인라인 style → Tailwind 클래스 마이그레이션

---

## 7. 적용 우선순위

| 우선 | 컴포넌트 | 근거 |
|:---:|:---|:---|
| **P0** | Notification, Menubar, Header | 매 화면 등장. UX 영향 최대 |
| **P0** | Footer, Confirmbox | 주요 CTA. 클릭 피드백 필수 |
| **P1** | Check, Radio, Toggle, Chip | 폼 요소. 선택 피드백 필요 |
| **P1** | List, GroupDetailCard, BottomSheet | 빈도 보통 |
| **P2** | Button(custom variants), VoteResultSelect | 부분 적용된 곳 있음 |

---

## 8. 검증

적용 후 다음 페이지를 수동 검증:

1. `/notifications` — Notification row, Menubar
2. `/meetings/[id]/payments` — Header, Footer button, IconButton(이미 OK)
3. `/dev` — 전 컴포넌트 카탈로그 (paymentPreviewMock의 PaymentPreviewView 포함)
4. `/dev/payment-preview` — Confirmbox, BottomSheet 변형

검증 항목:
- [ ] 마우스 hover 시 시각 변화 확인 (데스크탑)
- [ ] 터치/클릭 시 active 상태 잠깐 보임
- [ ] disabled 요소는 hover/active 미반응
- [ ] 다크 모드(추후) — 토큰 기반이므로 자동 대응 예상

---

## 9. 다크 모드 노트

토큰 기반 적용이므로 `--fill-normal`, `--fill-strong`, `--primary-strong` 등이 다크 모드용으로 정의되면 자동 적용된다. 현재 다크 모드 토큰은 `DESIGN.md`에 부분 정의되어 있고, 인터랙션 상태 토큰의 다크값은 ②가 별도 조율 필요.

---

## 10. FAQ

**Q. `hover:` 가 모바일에서 동작하면 sticky hover 문제 없나?**
A. iOS/Android는 터치 후 tap-away까지 `:hover`가 유지됨. 짧은 `transition-colors`(~150ms)면 사용자가 인지하기 전에 사라져 문제 안 됨. 강한 시각 변화는 `active:` 쪽으로 몰고 hover는 옅게 설정한 이유.

**Q. opacity vs fill bg, 언제 어느 걸 쓰는지?**
A. Pattern C(opacity)는 (1) 브랜드 색이라 hex shift 불가, 또는 (2) 아이콘+라벨 분리 영역이라 bg 전체 깔리면 영역이 너무 커 보이는 경우만. 기본은 fill bg(A).

**Q. focus 상태는?**
A. 본 문서 범위 밖. 접근성 audit 별도 진행 시 `:focus-visible` 패턴 추가 정의.

---

## 11. 변경 이력

| 일자 | 내용 |
|:---|:---|
| 2026-06-22 | 초안 작성 — 인터랙션 상태(§1-§4, §7-§10) (⑤ 작업 중 발견) |
| 2026-06-22 | §5 Header 좌측 chevron placeholder 이슈 추가 (⑤ 추가 요청) |
| 2026-06-22 | §6 Header safe-area top padding(노치/Dynamic Island 대응) 추가. 기존 §6–§10 → §7–§11 번호 이동. Menubar 인라인 style 정리 함께 권장 (⑤ 추가 요청) |
