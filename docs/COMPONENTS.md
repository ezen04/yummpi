
# 얌피 공통 컴포넌트 명세

> **출처**: Figma `yummpi_공통컴포넌트` / `공통 컴포넌트` 섹션 분석 결과  
> **Figma 파일**: [바로가기](https://www.figma.com/design/Q5510hpPSQG0R1dEUgUZrl/)  
> **기준 문서**: `docs/DESIGN.md` (색상·타이포·간격·둥글기 토큰)  
> **담당**: ② 디자인시스템 오너. 구현 시 다른 담당자와 페어링.

---

## 진행 상태 표기

| 기호 | 의미 |
|:---:|:---|
| ⬜ | 미구현 |
| 🔨 | 구현 중 |
| ✅ | 완료 |

---

## 1. 아이콘 시스템 (`icon/`)

> 24×24 단색 SVG. `currentColor` 기반. 4가지 색 variant를 `color` prop 하나로 처리한다.

| 상태 | 컴포넌트 | Variant | 비고 |
|:---:|:---|:---|:---|
| ⬜ | `Icon` | `default` / `colored` / `gray` / `white` | prop: `name`, `color` |

### 지원 아이콘 목록 (103종)

<details>
<summary>펼치기</summary>

| 아이콘 | colored | gray | white |
|:---|:---:|:---:|:---:|
| `arrow-up-right` | ✓ | ✓ | ✓ |
| `bell` | ✓ | ✓ | ✓ |
| `bell-filled` | — | ✓ | — |
| `calendar` | ✓ | ✓ | ✓ |
| `camera` | ✓ | ✓ | ✓ |
| `check` | ✓ | ✓ | ✓ |
| `check-white` | — | — | — |
| `chevron-down` | — | — | — |
| `chevron-left` | — | — | — |
| `chevron-right` | — | — | — |
| `circle-check-big-green` | — | — | — |
| `circle-check-big-red` | — | — | — |
| `clock` | — | — | — |
| `conffeti` | — | — | — |
| `ellipsis-vertical` | — | — | — |
| `eye` | — | — | — |
| `flame` | ✓ | ✓ | ✓ |
| `flame-filled` | — | — | — |
| `globe` | ✓ | ✓ | ✓ |
| `home-filled` | — | ✓ | — |
| `house` | ✓ | ✓ | ✓ |
| `kakao` | — | — | — |
| `mail` | — | — | ✓ |
| `map-pin` | ✓ | ✓ | ✓ |
| `minus` | ✓ | ✓ | ✓ |
| `mypage-filled` | — | ✓ | — |
| `pen` | ✓ | ✓ | ✓ |
| `people-filled` | — | ✓ | — |
| `phone` | — | — | — |
| `plus` | ✓ | ✓ | ✓ |
| `send-horizontal` | ✓ | ✓ | ✓ |
| `settings` | — | — | — |
| `share-2` | — | — | — |
| `share` | ✓ | ✓ | ✓ |
| `sparkles` | ✓ | ✓ | ✓ |
| `tag` | ✓ | ✓ | ✓ |
| `user-round` | ✓ | ✓ | ✓ |
| `users` | ✓ | ✓ | ✓ |
| `vote-colored` | — | — | — |
| `wallet` | ✓ | ✓ | ✓ |
| `x` | — | — | — |

</details>

---

## 2. 버튼 (`Button/`)

> 디자인 토큰: `DESIGN.md §5-5`

| 상태 | Variant | 설명 | 사용 화면 |
|:---:|:---|:---|:---|
| ✅ | `basic` | solid primary — 주요 CTA | 모임 생성, 정산 시작 |
| ✅ | `basic-hover` | solid primary hover | — |
| ✅ | `basic-icon` | 아이콘 포함 basic | 장소 추가 |
| ✅ | `nonColored` | solid assistive (회색 배경) | 취소, 닫기 |
| ✅ | `nonbordered` | 텍스트 전용 (테두리 없음) | 건너뛰기, 보조 링크 |
| ✅ | `nonbordered-gray` | 텍스트 gray | 비활성 보조 |
| ✅ | `outline-colored` | outlined primary | 재오픈, 장소 직접 추가 |
| ✅ | `outline-nonColored` | outlined gray | 보조 액션 |
| ✅ | `outline-icon-nonColored` | 아이콘 포함 outlined gray | — |
| ✅ | `radius` | 소형 둥근 버튼 | 태그형 버튼 |
| ✅ | `radius-border` | 소형 둥근 + 테두리 | 송금 독촉, 확인 |
| ✅ | `radius-border-colored` | 소형 둥근 + 테두리 primary | 완료 확인 |
| ✅ | `radius-border-inactive` | 소형 둥근 비활성 | — |
| ⬜ | `radius-border-selected` | 소형 둥근 선택됨 | — |
| ✅ | `inactive` | 전체 비활성 | 조건 미충족 시 |
| ✅ | `kakao` | 카카오 로그인 | 로그인 화면 |
| ✅ | `kakaopay` | 카카오페이 딥링크 | 송금 화면 |
| ✅ | `tosspay` | 토스페이 딥링크 | 송금 화면 |

---

## 3. 아이콘 버튼 (`icon-button/`)

> 아이콘만 들어있는 탭형 버튼 (원형 또는 정사각형).

| 상태 | Variant | 설명 |
|:---:|:---|:---|
| ⬜ | `normal` | 기본 |
| ⬜ | `hover` | 호버 |
| ⬜ | `clicked` | 클릭됨 |
| ⬜ | `done` | 완료 표시 |
| ⬜ | `draft` | 임시 저장 |
| ⬜ | `disabled` | 비활성 |

---

## 4. 입력 필드 (`input/`)

> 디자인 토큰: `DESIGN.md §5-10`

| 상태 | Variant | 설명 | 사용 화면 |
|:---:|:---|:---|:---|
| ✅ | `essential-basic` | 필수 항목 기본 | 모임 생성, 닉네임 입력 |
| ✅ | `essential-basic-focus` | 필수 항목 포커스 | — |
| ✅ | `essential-icon-right` | 필수 + 우측 아이콘 | 검색, 날짜 선택 |
| ✅ | `optional-basic` | 선택 항목 기본 | 모임 설명 |
| ✅ | `optional-basic-focus` | 선택 항목 포커스 | — |

---

## 5. 셀렉트박스 (`selectbox/`)

> 드롭다운 목록의 각 아이템 (상단/중간/하단).

| 상태 | Variant | 설명 |
|:---:|:---|:---|
| ⬜ | `top` / `top-hover` | 목록 첫 번째 아이템 |
| ⬜ | `mid` / `mid-hover` | 목록 중간 아이템 |
| ⬜ | `end` / `end-hover` | 목록 마지막 아이템 |

---

## 6. 폼 컨트롤

| 상태 | 컴포넌트 | Variant | 사용 화면 |
|:---:|:---|:---|:---|
| ✅ | `Check` | `active` / `inactive` | 소비 항목 선택 (정산) |
| ✅ | `Radio` | `active` / `inactive` | 정산 방식 선택 |
| ⬜ | `Toggle` | `active` / `inactive` | 알림 설정 on/off |
| ⬜ | `Menu-check` | `active` / `inactive` | 메뉴 체크 (OCR 검수) |

---

## 7. 헤더 (`Header/`)

> 탑 앱바. 높이 56px.

| 상태 | Variant | 설명 | 사용 화면 |
|:---:|:---|:---|:---|
| ✅ | `title` | 제목만 | 모임 상세, 정산 |
| ✅ | `title-subtitle` | 제목 + 서브타이틀 | 투표 화면 |
| ⬜ | `title-status` | 제목 + 상태 배지 | 모임 상세 |
| ✅ | `dashboard` | 로고 + 알림 아이콘 | 대시보드 홈 |
| ⬜ | `mypage` | 마이페이지 헤더 | 마이페이지 |
| ✅ | `nontitle-exit` | 제목 없음 + 닫기 버튼 | 바텀시트, 모달 |

---

## 8. 푸터 · 내비게이션 (`Footer/`, `Menubar/`)

| 상태 | 컴포넌트 | Variant | 설명 |
|:---:|:---|:---|:---|
| ✅ | `Footer` | `button` | 하단 단일 CTA 버튼 영역 |
| ✅ | `Footer` | `menubar` | 하단 탭 내비게이션 포함 |
| ✅ | `Menubar` | `normal` | 탭 비활성 |
| ✅ | `Menubar` | `clicked` | 탭 활성 |
| ✅ | `Menubar` | `primary` | 강조 탭 (홈 등) |

---

## 9. 바텀시트 (`BottomSheet/`)

| 상태 | Variant | 설명 | 사용 화면 |
|:---:|:---|:---|:---|
| ⬜ | `background` | 딤 배경 포함 | 정산 방식, 송금 앱 선택 |
| ⬜ | `non-background` | 배경 없음 | 가벼운 옵션 시트 |
| ⬜ | `solo` | 단독 콘텐츠 시트 | 닉네임 입력 |

---

## 10. 배지 (`Badge/`, `badge/`)

> 디자인 토큰: `DESIGN.md §5-7`, `§5-8`

| 상태 | Variant | 색상 | 사용 화면 |
|:---:|:---|:---|:---|
| ✅ | `Badge/black` | 다크 인버스 | 장소 카드 카테고리 |
| ✅ | `Badge/green` | status-positive | 완료, 예약 확정 |
| ✅ | `Badge/red` | status-negative | 미송금, 오류 |
| ✅ | `Badge/yellow` | secondary-tint | 투표 중, 주의 |
| ✅ | `badge/guest` | fill-normal | 게스트 표시 |
| ✅ | `badge/unpaid` | status-negative tint | 미송금 |
| ✅ | `badge/reservable` | secondary-tint | 예약 가능 |
| ✅ | `badge/icon-red` | 아이콘 포함 red | 알림 뱃지 |

---

## 11. 칩 (`Chip/`)

> 디자인 토큰: `DESIGN.md §5-6`

| 상태 | Variant | 사용 화면 |
|:---:|:---|:---|
| ⬜ | `Outline/active` | 음식 종류 필터, 정렬 옵션 |
| ⬜ | `Outline/inactive` | — |

---

## 12. 목록 아이템 (`List/`)

| 상태 | Variant | 설명 | 사용 화면 |
|:---:|:---|:---|:---|
| ⬜ | `Person/me` | 내 프로필 행 | 참석자 목록 |
| ⬜ | `Person/me/attendance` | 내 출석 상태 | 출석 체크 |
| ⬜ | `Person/me/result` | 내 투표 결과 | 투표 결과 |
| ⬜ | `Person/other` | 다른 참여자 행 | 참석자 목록 |
| ⬜ | `Person/other/admin` | 주최자 표시 포함 | — |
| ⬜ | `Person/other-inactive` | 비활성 참여자 | — |
| ⬜ | `Person/other/result` | 다른 참여자 결과 | 투표 결과 |
| ⬜ | `menu` | 설정 메뉴 행 | 마이페이지, 설정 |
| ⬜ | `result-b` | 투표 결과 (b타입) | 장소 투표 |
| ⬜ | `result-r` | 투표 결과 (r타입) | 장소 투표 |

---

## 13. 아바타 (`YAvatar/`, `attendance/`)

| 상태 | 컴포넌트 | Variant | 설명 |
|:---:|:---|:---|:---|
| ⬜ | `YAvatar` | `host/single` | 주최자 아바타 |
| ⬜ | `YAvatar` | `guest/single` | 게스트 아바타 |
| ⬜ | `attendance` | `host` | 출석 호스트 |
| ⬜ | `attendance` | `user` | 출석 일반 참여자 |
| ⬜ | `attendance` | `user-hover` | 호버 상태 |
| ⬜ | `attendance` | `user-selected` | 선택된 참여자 |
| ⬜ | `attendance` | `guest` | 출석 게스트 |

---

## 14. 썸네일 (`Thumbnail/`)

> 음식 카테고리 대표 이미지. 56×56 rounded-square.

| 상태 | Variant | 카테고리 |
|:---:|:---|:---|
| ⬜ | `korean` | 한식 |
| ⬜ | `japanese` | 일식 |
| ⬜ | `chinese` | 중식 |
| ⬜ | `meat` | 고기 |
| ⬜ | `cafe` | 카페 |
| ⬜ | `western` | 양식 |

---

## 15. 스텝 인디케이터 (`Step/`)

> 모임 생성, 정산 플로우 등 단계 표시.

| 상태 | Variant | 설명 |
|:---:|:---|:---|
| ⬜ | `complete` | 완료된 단계 |
| ⬜ | `now` | 현재 단계 |
| ⬜ | `yet` | 미완료 단계 |
| ⬜ | `Line/complete` | 단계 연결선 — 완료 |
| ⬜ | `Line/yet` | 단계 연결선 — 미완료 |

---

## 16. 투표 관련 컴포넌트

| 상태 | 컴포넌트 | Variant | 사용 화면 |
|:---:|:---|:---|:---|
| ⬜ | `VoteResultCard` | — | 투표 결과 카드 |
| ⬜ | `VoteResultBar` | `active` / `hover` / `inactive` | 투표 결과 바 |
| ⬜ | `VoteResultSelect` | `active` / `hover` / `inactive` | 투표 선택 항목 |

---

## 17. 모임 상세 관련 컴포넌트 (`group-detail/`)

| 상태 | Variant | 설명 |
|:---:|:---|:---|
| ⬜ | `todoCard-location-vote` | 투표 진행 중 TODO 카드 |
| ⬜ | `todoCard-adjustment` | 정산 진행 중 TODO 카드 |
| ⬜ | `todoCard-transfer` | 송금 진행 중 TODO 카드 |
| ⬜ | `waitingCard-location-vote` | 투표 대기 카드 |
| ⬜ | `waitingCard-adjustment` | 정산 대기 카드 |

---

## 18. 알림 · 안내 컴포넌트

| 상태 | 컴포넌트 | Variant | 사용 화면 |
|:---:|:---|:---|:---|
| ⬜ | `notification` | `unread` / `read` | 알림 목록 |
| ⬜ | `tipbox` | `normal` | 일반 안내 팁 |
| ⬜ | `tipbox` | `completed-vote` | 투표 완료 안내 |
| ⬜ | `tipbox` | `completed-title` | 제목 포함 완료 안내 |
| ⬜ | `Confirmbox` | `basic` | 확인 다이얼로그 |
| ⬜ | `Confirmbox` | `hover` | 확인 다이얼로그 호버 |

---

## 구현 우선순위 가이드

> P0 기능에 필요한 컴포넌트를 먼저 구현한다.

### P0 — 모임 생성·투표·정산·송금 필수

```
Button (basic, outline-colored, inactive, kakaopay, tosspay, radius-border)
input (essential-basic, essential-icon-right)
Header (title, dashboard, nontitle-exit)
Badge (red, green, yellow, guest, unpaid)
Check, Radio
VoteResultCard, VoteResultBar, VoteResultSelect
attendance (user, host, guest)
BottomSheet (background)
Footer (button, menubar)
Icon (필수 아이콘 30종 이상)
```

### P1 — 대시보드·알림

```
Header (title-status, mypage)
notification (unread, read)
group-detail (todoCard/waitingCard 전체)
Menubar
tipbox
Step
```

### P2 — 완성도

```
Thumbnail (6종)
selectbox
YAvatar
Chip
Confirmbox
List (전체 variant)
```

---

## 파일 위치 규칙

```
packages/ui/src/                  # @yummpi/ui — shadcn 기반 원자 컴포넌트 (이미 존재)
├── button.tsx
├── badge.tsx
├── avatar.tsx
├── checkbox.tsx
├── dialog.tsx
├── drawer.tsx
├── progress.tsx
├── select.tsx
├── skeleton.tsx
├── icons.tsx
└── index.ts                      # import { Button } from '@yummpi/ui'

apps/web/src/components/
├── common/                       # 얌피 웹앱 공통 컴포넌트 (② 오너)
│   │
│   ├── # 레이아웃
│   ├── Header.tsx                # title / dashboard / mypage 등 variant
│   ├── Footer.tsx                # button / menubar variant
│   ├── Menubar.tsx               # 하단 탭 내비게이션
│   ├── BottomSheet.tsx           # drawer(@yummpi/ui) 래핑
│   │
│   ├── # 입력·폼
│   ├── Button.tsx                # basic / outline / radius / kakaopay / tosspay 등 얌피 variant
│   ├── Input.tsx                 # essential-basic / optional-basic 등
│   ├── Check.tsx                 # checkbox(@yummpi/ui) 래핑, active/inactive
│   ├── Radio.tsx                 # active / inactive
│   ├── Toggle.tsx                # active / inactive
│   ├── Chip.tsx                  # Outline/active · inactive
│   ├── Selectbox.tsx             # top / mid / end + hover
│   │
│   ├── # 표시·피드백
│   ├── Badge.tsx                 # black / green / red / yellow / guest / unpaid / reservable / icon-red
│   ├── Icon.tsx                  # 얌피 커스텀 SVG 103종
│   ├── YAvatar.tsx               # host / guest avatar
│   ├── Thumbnail.tsx             # 음식 카테고리 6종 (56×56)
│   ├── Step.tsx                  # complete / now / yet + Line
│   │
│   ├── # 목록
│   ├── List/
│   │   ├── PersonItem.tsx        # me / other / admin / inactive / result
│   │   └── MenuItem.tsx          # 설정 메뉴 행
│   │
│   └── # 안내·알림
│       ├── Notification.tsx      # unread / read
│       ├── Tipbox.tsx            # normal / completed-vote / completed-title
│       └── Confirmbox.tsx        # basic / hover
│
└── providers/                    # Context Provider (현재 존재)
    ├── SessionProvider.tsx
    └── QueryProvider.tsx

```

> **import 경로 기준**
> - 원자 컴포넌트: `import { Button, Badge } from '@yummpi/ui'`
> - 도메인 공통: `import { Header } from '@/components/common/Header'`

---

## 관련 문서

- 디자인 토큰: [`docs/DESIGN.md`](./DESIGN.md)
- ERD: [`docs/erd-v2.2.md`](./erd-v2.2.md)
- API 스펙: [`docs/api-spec.md`](./api-spec.md)
- Figma 파일: [Figma 바로가기](https://www.figma.com/design/Q5510hpPSQG0R1dEUgUZrl/)
