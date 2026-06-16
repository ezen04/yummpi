# Design System — 얌피(yummpi)

> **단일 진실 공급원(SSOT)**: 이 문서가 프로젝트의 유일한 디자인 표준이다.
> AI 및 팀원은 UI 작업 시 반드시 이 문서를 기준으로 한다.

---

## 1. 색상 시스템 (Color System)

CSS 변수(시맨틱 토큰)를 사용한다. 하드코딩된 Hex/RGB 값 사용을 금지한다.

### 1-1. 브랜드 컬러 (Primary — Vermilion)

| 토큰 | Hex | 역할 |
|:---|:---|:---|
| `--primary` | `#E94B35` | 주요 버튼·선택 상태·링크·강조 (브랜드 핵심) |
| `--primary-strong` | `#D63D28` | 호버 상태 |
| `--primary-heavy` | `#B23420` | 프레스(클릭) 상태 |
| `--primary-tint` | `rgba(233,75,53, 0.08)` | 배지·태그 배경 틴트 |

### 1-2. 세컨더리 컬러 (Secondary — Amber)

| 토큰 | Hex | 역할 |
|:---|:---|:---|
| `--secondary` | `#FFC857` | 앰버 하이라이트 — 배지·뱃지 전용 |
| `--secondary-strong` | `#8A5A00` | 라이트 배경 위 앰버 텍스트/아이콘 |
| `--secondary-tint` | `#FFF4DD` | 앰버 배지 배경 |

> **⚠️ 앰버(secondary)는 버튼·대형 표면에 절대 사용하지 않는다.** 배지·하이라이트 전용.

### 1-3. 텍스트(레이블) 계층

동일한 웜-뉴트럴(`#2B211E`)을 불투명도로 계층화한다.

| 토큰 | 값 | 용도 |
|:---|:---|:---|
| `--label-strong` | `#1A120F` | 최대 강조 헤딩 |
| `--label-normal` | `#2B211E` | 기본 본문 텍스트 |
| `--label-neutral` | `rgba(43,33,30, 0.88)` | 본문 카피 |
| `--label-alternative` | `rgba(43,33,30, 0.61)` | 보조·서브 카피 |
| `--label-assistive` | `rgba(43,33,30, 0.28)` | 힌트, 플레이스홀더 |
| `--label-disable` | `rgba(43,33,30, 0.16)` | 비활성 텍스트 |

### 1-4. 서피스(배경)

| 토큰 | Hex | 용도 |
|:---|:---|:---|
| `--bg-normal` | `#FFFFFF` | 앱 기본 배경 |
| `--bg-alternative` | `#F7F7F8` | 그룹·섹션 서브 배경, 입력 필드 배경 |
| `--bg-elevated` | `#FFFFFF` | 카드, 시트 |
| `--bg-inverse` | `#1B1C1E` | 다크 인버스 (토스트, 칩 활성) |

### 1-5. 라인(보더·구분선)

| 토큰 | 값 | 용도 |
|:---|:---|:---|
| `--line-normal` | `rgba(112,115,124, 0.22)` | 일반 구분선, 카드 보더 |
| `--line-neutral` | `rgba(112,115,124, 0.16)` | 옅은 구분 |
| `--line-alternative` | `rgba(112,115,124, 0.08)` | 최소 구분 |

### 1-6. 필(Fill) 오버레이

| 토큰 | 값 | 용도 |
|:---|:---|:---|
| `--fill-alternative` | `rgba(112,115,124, 0.05)` | 칩 기본 배경 |
| `--fill-normal` | `rgba(112,115,124, 0.08)` | 보조 버튼, 뉴트럴 배지 |
| `--fill-strong` | `rgba(112,115,124, 0.16)` | 비활성 버튼 배경 |
| `--fill-disable` | `#F4F4F5` | disabled 버튼 배경 |

### 1-7. 상태 컬러

| 토큰 | Hex | 용도 |
|:---|:---|:---|
| `--status-positive` | `#00BF40` | 완료, 송금 완료, 정산 완결 |
| `--status-cautionary` | `#FF9200` | 주의, 진행 중, 마감 임박 |
| `--status-negative` | `#FF4242` | 오류, 삭제, 미송금, 경고 |

### 1-8. CSS 변수 전체 (`apps/web/src/styles/globals.css`)

```css
:root {
  /* Brand */
  --primary:           #E94B35;
  --primary-strong:    #D63D28;
  --primary-heavy:     #B23420;
  --primary-tint:      rgba(233, 75, 53, 0.08);
  --secondary:         #FFC857;
  --secondary-strong:  #8A5A00;
  --secondary-tint:    #FFF4DD;

  /* Label */
  --label-strong:      #1A120F;
  --label-normal:      #2B211E;
  --label-neutral:     rgba(43, 33, 30, 0.88);
  --label-alternative: rgba(43, 33, 30, 0.61);
  --label-assistive:   rgba(43, 33, 30, 0.28);
  --label-disable:     rgba(43, 33, 30, 0.16);

  /* Background */
  --bg-normal:         #FFFFFF;
  --bg-alternative:    #F7F7F8;
  --bg-elevated:       #FFFFFF;
  --bg-inverse:        #1B1C1E;

  /* Line */
  --line-normal:       rgba(112, 115, 124, 0.22);
  --line-neutral:      rgba(112, 115, 124, 0.16);
  --line-alternative:  rgba(112, 115, 124, 0.08);

  /* Fill */
  --fill-alternative:  rgba(112, 115, 124, 0.05);
  --fill-normal:       rgba(112, 115, 124, 0.08);
  --fill-strong:       rgba(112, 115, 124, 0.16);
  --fill-disable:      #F4F4F5;

  /* Status */
  --status-positive:   #00BF40;
  --status-cautionary: #FF9200;
  --status-negative:   #FF4242;

  /* Static */
  --static-white:      #FFFFFF;
  --static-black:      #000000;
  --inverse-label:     #F7F7F7;

  /* Font */
  --font-sans: "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont,
               "Apple SD Gothic Neo", "Malgun Gothic", system-ui, Roboto, sans-serif;
}
```

> **다크 모드**: `[data-theme="dark"]` 블록에서 위 변수를 재정의한다.
> `--primary` → `#F26B57`, 배경·레이블은 쿨뉴트럴 계열로 반전.

---

## 2. 타이포그래피 (Typography)

**폰트**: Pretendard (한국어 + 라틴). CDN 로드, 프로덕션은 셀프 호스팅 권장.

```css
font-family: var(--font-sans);
```

**굵기 체계**: Regular `400` · Medium `500` · SemiBold `600` (시스템 "bold") · Bold `700` (display/title 최대 강조만)

### 2-1. 타입 스케일

| 클래스 | 크기 / 행간 | 얌피 용도 예시 |
|:---|:---|:---|
| `.text-display3` | 36 / 48 | 온보딩 대형 타이틀 |
| `.text-title3` | 24 / 32 | 섹션 대제목 |
| `.text-heading1` | 22 / 30 | 페이지 타이틀 |
| `.text-heading2` | 20 / 28 | 카드 헤딩 |
| `.text-headline1` | 18 / 26 | 모임명, 장소명 강조 |
| `.text-headline2` | 17 / 24 | 서브 헤딩 |
| `.text-body1` | 16 / 24 | 주요 본문 |
| `.text-body2` | 15 / 22 | 보조 본문 |
| `.text-label1` | 14 / 20 | 레이블, 칩 텍스트 |
| `.text-label2` | 13 / 18 | 작은 레이블 |
| `.text-caption1` | 12 / 16 | 캡션, 배지 텍스트 |
| `.text-caption2` | 11 / 14 | 최소 보조 텍스트 |

### 2-2. 화면별 타이포 가이드

| 화면 | 요소 | 클래스 + 컬러 |
|:---|:---|:---|
| 대시보드 | 모임 카드 제목 | `.text-headline1 font-semibold` · `--label-normal` |
| 대시보드 | 날짜·장소 메타 | `.text-label1` · `--label-alternative` |
| 모임 생성 | 입력 레이블 | `.text-label1 font-medium` · `--label-normal` |
| 장소 추천 | 장소명 | `.text-headline2 font-semibold` · `--label-normal` |
| 장소 추천 | 거리·카테고리 | `.text-caption1` · `--label-assistive` |
| 투표 | 후보 제목 | `.text-body1 font-medium` · `--label-normal` |
| 정산 | 금액 | `.text-headline1 font-semibold` · `--label-normal` |
| 정산 | 세부 항목명 | `.text-body2` · `--label-normal` |
| 정산 | 인당 배분 메모 | `.text-label1` · `--label-alternative` |

---

## 3. 간격 & 레이아웃 (Spacing & Layout)

**4pt 그리드** 기준. 주력 패딩은 `16px`과 `20px`이다.

| 항목 | 값 | Tailwind |
|:---|:---|:---|
| 기준 뷰포트 (PWA 모바일) | `390px` | — |
| 컨텐츠 최대 너비 | `390px` | `max-w-[390px] mx-auto` |
| 화면 수평 패딩 | `16px` | `px-4` |
| 카드 내부 패딩 | `16–20px` | `p-4` / `p-5` |
| 섹션 간 수직 간격 | `24px` | `space-y-6` |
| 리스트 아이템 수직 패딩 | `12px` | `py-3` |
| 탑 앱바 높이 | `56px` | — |
| 바텀 네비게이션 높이 | `56px` | — |

> **PWA 모바일 우선**: 기준 뷰포트 `390px`. 태블릿/데스크탑은 `max-w-[390px] mx-auto`로 중앙 정렬.

---

## 4. 둥글기 규칙 (Border Radius)

임의의 `rounded-xl`, `rounded-2xl` 등 Tailwind 클래스 사용을 금지한다.
반드시 아래 CSS 변수를 `border-radius: var(--radius-N)` 형태로 사용한다.

```css
:root {
  --radius-6:    6px;    /* 소형 칩, 텍스트 버튼 */
  --radius-8:    8px;    /* 배지, 소형 버튼 */
  --radius-10:   10px;   /* 중형 버튼, 칩, 앱 아이콘 */
  --radius-12:   12px;   /* 대형 버튼, 카드, 썸네일, 입력 필드 */
  --radius-16:   16px;   /* 바텀 시트, 대형 표면 */
  --radius-full: 999px;  /* 아바타(원형), 토글, 태그 */
}
```

| 요소 | 변수 |
|:---|:---|
| 대형 버튼 (h=48) | `var(--radius-12)` |
| 중형 버튼 (h=40) | `var(--radius-10)` |
| 소형 버튼 (h=32) | `var(--radius-8)` |
| 카드, 썸네일, 입력 필드 | `var(--radius-12)` |
| 칩 | `var(--radius-10)` |
| 배지 | `var(--radius-8)` |
| 바텀 시트 | `var(--radius-16)` |
| 아바타 (원형) | `var(--radius-full)` |

---

## 5. 컴포넌트 패턴 (Component Patterns)

### 5-1. 페이지 래퍼 (PWA 모바일 컨테이너)

```tsx
<main className="min-h-screen bg-[var(--bg-normal)]">
  <div className="max-w-[390px] mx-auto px-4 pb-14">
    {/* pb-14: 바텀 네비게이션(56px) 높이만큼 하단 여백 확보 */}
    {/* 컨텐츠 */}
  </div>
</main>
```

### 5-2. 카드

```tsx
<div style={{
  background: 'var(--bg-elevated)',
  border: '1px solid var(--line-normal)',
  borderRadius: 'var(--radius-12)',
  padding: '16px 20px',
}}>
  {/* 카드 내용 */}
</div>
```

### 5-3. 섹션 헤딩

```tsx
<h2 className="text-heading2 font-semibold mb-3"
    style={{ color: 'var(--label-strong)' }}>
  섹션 제목
</h2>
```

### 5-4. 인터랙티브 리스트 아이템

```tsx
<div style={{
  padding: '12px 16px',
  borderRadius: 'var(--radius-12)',
  cursor: 'pointer',
  transition: 'background 0.12s',
}}
  onMouseEnter={e => e.currentTarget.style.background = 'var(--fill-alternative)'}
  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
>
  아이템 내용
</div>
```

### 5-5. 버튼

`solid` / `outlined` / `text` × `primary` / `assistive` × `large` / `medium` / `small`

| 사이즈 | 높이 | 패딩 | 반지름 | 폰트 |
|:---|:---|:---|:---|:---|
| large | 48px | 0 28px | `--radius-12` | 16px / 600 |
| medium | 40px | 0 20px | `--radius-10` | 15px / 600 |
| small | 32px | 0 14px | `--radius-8` | 13px / 600 |

```tsx
{/* solid primary — 주요 액션 (모임 만들기, 정산 시작, 송금 요청) */}
<button style={{
  height: 48, padding: '0 28px',
  borderRadius: 'var(--radius-12)',
  background: 'var(--primary)', color: 'var(--static-white)',
  font: '600 16px var(--font-sans)', border: 'none', width: '100%',
}}>
  모임 만들기
</button>

{/* solid assistive — 보조 액션 (취소, 닫기) */}
<button style={{
  height: 48, padding: '0 28px',
  borderRadius: 'var(--radius-12)',
  background: 'var(--fill-normal)', color: 'var(--label-neutral)',
  font: '500 16px var(--font-sans)', border: 'none',
}}>
  취소
</button>

{/* outlined — 장소 직접 추가, 재오픈 등 */}
<button style={{
  height: 40, padding: '0 20px',
  borderRadius: 'var(--radius-10)',
  background: 'transparent', color: 'var(--primary)',
  font: '600 15px var(--font-sans)',
  border: '1px solid var(--line-neutral)',
}}>
  장소 직접 추가
</button>

{/* disabled */}
<button style={{
  height: 48, padding: '0 28px',
  borderRadius: 'var(--radius-12)',
  background: 'var(--fill-disable)', color: 'var(--label-disable)',
  font: '600 16px var(--font-sans)', border: 'none', cursor: 'default',
}}>
  비활성
</button>
```

- **프레스 효과**: `filter: brightness(0.93)` — scale/bounce 금지.
- **전체 너비 버튼**: `width: 100%` 적용 (모임 생성·정산 확정 등 바텀 CTA).
- **아이콘 + 버튼**: `gap: 4px`, 아이콘 크기 `large=20px / medium=18px / small=16px`.

### 5-6. 칩 (Chip)

투표 필터, 음식 종류 선택, 모임 상태 탭에 사용.
높이 `34px` · 패딩 `0 12px` · 반지름 `var(--radius-10)` · 폰트 `14px / 500`

```tsx
{/* solid active — 선택됨 */}
<span style={{
  display: 'inline-flex', alignItems: 'center', height: 34, padding: '0 12px',
  borderRadius: 'var(--radius-10)',
  background: 'var(--bg-inverse)', color: 'var(--inverse-label)',
  font: '500 14px var(--font-sans)',
}}>
  한식
</span>

{/* solid rest — 미선택 */}
<span style={{
  display: 'inline-flex', alignItems: 'center', height: 34, padding: '0 12px',
  borderRadius: 'var(--radius-10)',
  background: 'var(--fill-alternative)', color: 'var(--label-normal)',
  font: '500 14px var(--font-sans)',
}}>
  일식
</span>

{/* outlined active — primary 강조 필터 */}
<span style={{
  display: 'inline-flex', alignItems: 'center', height: 34, padding: '0 12px',
  borderRadius: 'var(--radius-10)',
  background: 'rgba(233,75,53, 0.05)', color: 'var(--primary)',
  border: '1px solid rgba(233,75,53, 0.43)',
  font: '500 14px var(--font-sans)',
}}>
  추천순
</span>
```

### 5-7. 배지 (Badge)

텍스트 2–4자 원칙. 반지름 `var(--radius-8)` · 패딩 `4px 6px` · 폰트 `12px / 600`

```tsx
{/* primary — 추천, AI 힌트 */}
<span style={{
  display: 'inline-flex', alignItems: 'center', gap: 3,
  borderRadius: 'var(--radius-8)', padding: '4px 6px',
  background: 'var(--primary-tint)', color: 'var(--primary)',
  font: '600 12px var(--font-sans)',
}}>추천</span>

{/* secondary (amber) — 예약가능 */}
<span style={{
  display: 'inline-flex', alignItems: 'center', gap: 3,
  borderRadius: 'var(--radius-8)', padding: '4px 6px',
  background: 'var(--secondary-tint)', color: 'var(--secondary-strong)',
  font: '600 12px var(--font-sans)',
}}>예약가능</span>

{/* neutral — 기본 상태 */}
<span style={{
  display: 'inline-flex', alignItems: 'center', gap: 3,
  borderRadius: 'var(--radius-8)', padding: '4px 6px',
  background: 'var(--fill-normal)', color: 'var(--label-alternative)',
  font: '600 12px var(--font-sans)',
}}>준비중</span>

{/* negative — 미송금, 오류 */}
<span style={{
  display: 'inline-flex', alignItems: 'center', gap: 3,
  borderRadius: 'var(--radius-8)', padding: '4px 6px',
  background: 'rgba(255,66,66, 0.08)', color: 'var(--status-negative)',
  font: '600 12px var(--font-sans)',
}}>미송금</span>
```

### 5-8. 모임 상태 배지 (Gathering Status)

`Gathering.status` 값마다 일관된 배지 스타일을 적용한다.

| 상태 | 배경 | 텍스트 색 | 레이블 |
|:---|:---|:---|:---|
| `DRAFT` | `--fill-normal` | `--label-alternative` | 준비 중 |
| `RECRUITING` | `--fill-normal` | `--label-alternative` | 모집 중 |
| `VOTING` | `--secondary-tint` | `--secondary-strong` | 투표 중 |
| `PLACE_CONFIRMED` | `--primary-tint` | `--primary` | 장소 확정 |
| `IN_PROGRESS` | `rgba(255,146,0,0.08)` | `--status-cautionary` | 진행 중 |
| `SETTLING` | `rgba(255,146,0,0.08)` | `--status-cautionary` | 정산 중 |
| `COMPLETED` | `rgba(0,191,64,0.10)` | `--status-positive` | 완료 |
| `CANCELLED` | `--fill-normal` | `--label-disable` | 취소됨 |

### 5-9. 아바타

```tsx
{/* 사람 — 원형 (참석자 프로필) */}
{/* 배경색은 4가지 로테이션: #FBE2DF · #FFF6E4 · #D6F5E0 · #FEE9FB */}
<div style={{
  width: 44, height: 44, borderRadius: '50%',
  background: '#FBE2DF',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}}>
  <span style={{ font: '700 18px var(--font-sans)', color: 'var(--label-normal)' }}>
    김
  </span>
</div>

{/* 모임/장소 — rounded-square */}
<div style={{
  width: 56, height: 56,
  borderRadius: 'var(--radius-12)',
  overflow: 'hidden',
}}>
  <img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
</div>
```

### 5-10. 입력 필드

높이 `48px` · 패딩 `0 16px` · 반지름 `var(--radius-12)` · 배경 `--bg-alternative`

```tsx
<input style={{
  height: 48, padding: '0 16px',
  borderRadius: 'var(--radius-12)',
  border: '1px solid var(--line-neutral)',
  background: 'var(--bg-alternative)',
  font: '400 16px var(--font-sans)',
  color: 'var(--label-normal)',
  outline: 'none', width: '100%',
}}
  placeholder="모임 이름"
/>
/* 포커스: border → 2px solid rgba(233,75,53, 0.43); box-shadow: var(--shadow-xsmall) */
/* 에러:   border → 1px solid rgba(255,66,66, 0.28) */
/* 플레이스홀더: color → var(--label-assistive) */
```

### 5-11. 진행 바 (Progress)

정산 진행률, 투표 현황 등에 사용.

```tsx
<div style={{ height: 8, borderRadius: 4, background: 'var(--fill-normal)', overflow: 'hidden' }}>
  <div style={{
    height: '100%', width: `${percent}%`,
    borderRadius: 4,
    background: 'var(--primary)',  /* 완료 시: var(--status-positive) */
    transition: 'width 0.3s ease',
  }} />
</div>
```

### 5-12. 토스트 (피드백)

정산 확정·송금 요청 완료 등 성공/오류 피드백.

```tsx
<div style={{
  position: 'fixed', left: 16, right: 16,
  bottom: 72,  /* 바텀 네비 위 16px */
  zIndex: 80,
  display: 'flex', alignItems: 'center', gap: 8,
  padding: '14px 16px',
  borderRadius: 'var(--radius-12)',
  background: 'var(--bg-inverse)', color: 'var(--inverse-label)',
  font: '500 14px var(--font-sans)',
  boxShadow: 'var(--shadow-large)',
  opacity: show ? 1 : 0,
  transform: show ? 'translateY(0)' : 'translateY(8px)',
  transition: 'opacity 0.25s, transform 0.25s',
}}>
  {/* 아이콘 (--status-positive) + 메시지 */}
  정산이 완료됐어요
</div>
```

### 5-13. 카카오 로그인 버튼

```tsx
<button style={{
  height: 50, padding: '0 24px',
  borderRadius: 'var(--radius-12)',
  background: '#FEE500',  /* 카카오 공식 색상 — 이 버튼에만 예외적 하드코딩 허용 */
  color: 'rgba(0,0,0,0.85)',
  font: '600 16px var(--font-sans)', border: 'none', width: '100%',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
}}>
  {/* 카카오 아이콘 */}
  카카오로 시작하기
</button>
```

---

## 6. 아이콘

24×24 그리드, `currentColor` 지원 단색 SVG. 이모지를 UI 어포던스로 사용하지 않는다.

- **line + Fill 쌍**: 기본 상태 line, 선택/활성 상태 Fill.
- **색상**: 반드시 CSS 변수로 지정 (`color: var(--label-normal)`).
- **이모지**: 사용자 생성 콘텐츠(모임 설명)에서만 허용. 시스템 UI 금지.

### 얌피 도메인별 아이콘 매핑

| 기능 | 아이콘 (기본 / 활성) |
|:---|:---|
| 홈·대시보드 | `home` / `homeFill` |
| 내 모임·마이페이지 | `person` / `personFill` |
| 알림 | `bell` / `bellFill` |
| 참석자 | `persons` |
| 장소·위치 | `location` |
| 투표·즐겨찾기 | `star` / `starFill` |
| 정산 | `coins` / `coinsFill` |
| 송금 요청 | `send` |
| 캘린더·날짜 | `calendar` |
| 시간 | `clock` |
| 영수증·문서 | `documentText` |
| 설정 | `setting` |
| 공유 | `share` |
| 추가 | `plus` |
| 닫기 | `close` |
| 뒤로가기 | `chevronLeft` |
| 더보기 | `moreVertical` |
| 검색 | `search` |
| 즐겨찾기 | `bookmark` / `bookmarkFill` |
| AI·스파클 힌트 | `sparkle` / `sparkleFill` |
| 인기 | `fire` / `fireFill` |
| 로그아웃 | `logout` |
| 외부 링크 열기 | `arrowUpRight` |

---

## 7. 그림자 (Elevation)

그림자보다 헤어라인 보더를 우선한다. 그림자는 진짜 떠있는 UI(토스트, 시트, 메뉴)에만 쓴다.

```css
:root {
  --shadow-xsmall: 0 1px 0.5px rgba(23,23,23,0.05);
  --shadow-small:  0 2px 1px rgba(23,23,23,0.03), 0 4px 2.5px rgba(23,23,23,0.03);
  --shadow-medium: 0 4px 2px rgba(23,23,23,0.035), 0 10px 6px rgba(23,23,23,0.035);
  --shadow-large:  0 6px 3px rgba(23,23,23,0.04), 0 16px 9px rgba(23,23,23,0.04);
  --shadow-xlarge: 0 10px 5px rgba(23,23,23,0.05), 0 24px 14px rgba(23,23,23,0.06);
}
```

| 토큰 | 용도 |
|:---|:---|
| `--shadow-xsmall` | 입력 필드 포커스 보조 |
| `--shadow-small` | 카드 (선택적) |
| `--shadow-large` | 토스트, 드롭다운 메뉴 |
| `--shadow-xlarge` | 바텀 시트, 모달 |

---

## 8. 금지 규칙 (Rules)

| ❌ 금지 | ✅ 대체 |
|:---|:---|
| `color: #E94B35` 하드코딩 | `color: var(--primary)` |
| `background: #FF4242` | `background: var(--status-negative)` |
| `color: #2B211E`, `color: black` | `color: var(--label-normal)` |
| `color: #70737C` 직접 지정 | `color: var(--label-alternative)` |
| `background: #F7F7F8` | `background: var(--bg-alternative)` |
| `--secondary`(앰버)를 버튼 색으로 사용 | 배지·하이라이트 전용 |
| `border-radius: 12px` 직접 지정 | `border-radius: var(--radius-12)` |
| Tailwind `rounded-xl`, `rounded-2xl` | `border-radius: var(--radius-12)` |
| `box-shadow: 0 4px 10px rgba(0,0,0,0.3)` | `box-shadow: var(--shadow-medium)` |
| `border: 1px solid #E0E0E0` | `border: 1px solid var(--line-normal)` |
| 이모지를 UI 아이콘으로 사용 | 아이콘 SVG 사용 |

---

## 9. 브랜드 색상 커스터마이징 방법

브랜드 색상이 확정되면 `apps/web/src/styles/globals.css`의 CSS 변수만 교체한다.
컴포넌트 코드는 전혀 수정할 필요가 없다.

```css
/* 예시: primary 색상 변경 시 */
:root {
  --primary:        #새색상;
  --primary-strong: #호버색상;
  --primary-heavy:  #프레스색상;
  --primary-tint:   rgba(새색상RGB, 0.08);
}
```

---

## 10. AI 어시스턴트 지침

1. **하드코딩 색상 금지**: 모든 Hex 값 직접 사용 금지. 반드시 CSS 변수만 사용한다. **예외: 카카오 로그인 버튼 배경 `#FEE500` 단 하나.**
2. **라인(보더)**: 테두리 추가 시 반드시 `border: 1px solid var(--line-neutral)` 또는 `var(--line-normal)` 사용.
3. **호버**: `background: var(--fill-alternative)` 패턴 일관 적용.
4. **프레스**: `filter: brightness(0.93)` — scale/bounce 금지.
5. **둥글기**: `var(--radius-*)` 변수만 사용. Tailwind arbitrary value 금지.
6. **레이아웃**: 모든 페이지는 `max-w-[390px] mx-auto px-4` 모바일 컨테이너 패턴을 따른다.
7. **그림자**: `var(--shadow-*)` 토큰만 사용. 임의 `box-shadow` 금지.
8. **앰버(secondary)**: `--secondary`·`--secondary-tint`는 배지에만. 버튼·대형 표면 금지.
9. **다크 모드**: 시맨틱 토큰을 올바르게 쓰면 자동 대응된다. Tailwind `dark:` 클래스로 색상을 재정의하지 않는다.
