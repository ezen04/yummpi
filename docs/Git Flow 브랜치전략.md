# Git Flow 브랜치 전략

## 브랜치 구조

| 브랜치 | 분기 기준 | 설명 |
| --- | --- | --- |
| **main** | — | 배포 가능한 상태만 유지. 직접 push 금지. dev, hotfix 경유만 허용. |
| **dev** | main | 개발 통합 브랜치. 모든 feature 브랜치가 merge되는 곳. 배포 시 main으로 merge. |
| **feature/** | dev | 기능 개발 브랜치. 작업 완료 후 dev로 PR. |
| **hotfix/** | main | 프로덕션 긴급 수정 브랜치. 수정 완료 후 main + dev에 merge. |

---

## 브랜치 흐름도

`main  ──────────────────── v1.0 ── v1.0.1 ──▶
                             ↑         ↑
                            dev     hotfix/*
                             ↑         ↑
dev   ── f/A ── f/B ── f/C ─┘         │
                                       │
      ◀──── hotfix도 dev에 반영 ────────┘`

---

## 브랜치별 작업 흐름

### feature — 일반 기능 개발

**분기**: dev → **merge 대상**: dev

```jsx
# 1. dev 기준으로 브랜치 생성
git checkout dev
git checkout -b feature/map-api

# 2. 작업 후 커밋
git add .
git commit -m "feat: 카카오 지도 API 연동"

# 3. 푸시 후 GitHub에서 PR (dev ← feature/map-api)
git push origin feature/map-api
```

**브랜치 명명**: `feature/작업내용` (예: `feature/ocr-upload`, `feature/settlement-ui`)

---

### hotfix — 프로덕션 긴급 수정

**분기**: main → **merge 대상**: main + dev

```jsx
# 1. main에서 분기
git checkout main
git checkout -b hotfix/결제-오류-수정

# 2. 긴급 버그만 수정

# 3. main에 merge + 태그
git checkout main
git merge hotfix/결제-오류-수정
git tag v1.0.1

# 4. dev에도 반영 (누락 시 다음 배포에서 버그 재발)
git checkout dev
git merge hotfix/결제-오류-수정

# 5. 브랜치 삭제
git branch -D hotfix/결제-오류-수정
git push origin --delete hotfix/결제-오류-수정
```

---

## feature 전체 작업 순서 (단계별)

1. 최초 `git clone` 후 dev 이동

```jsx
git checkout dev
```

1. dev에서 feature 브랜치 생성

```jsx
git checkout -b feature/작업내용
# 또는 VS Code에서 dev 클릭 → "새 분기 만들기"
```

1. 작업 완료 후 스테이징 → 커밋 → 푸시

```jsx
git add .
git commit -m "feat: 작업 내용"
git push origin feature/작업내용
```

1. GitHub에서 PR 생성
    - Pull Requests → New pull request
    - **`dev ← feature/작업내용` 방향 반드시 확인**
    - Create pull request → Merge pull request
2. merge 완료 후 원격 브랜치 삭제 (GitHub에서 Delete branch 클릭)
3. 로컬 정리

```jsx
git checkout dev
git pull origin dev
git branch -D feature/작업내용
```

한 번에 처리:

```jsx
git checkout dev
git push origin --delete feature/작업내용 && git branch -D feature/작업내용
```

> `git fetch -p` 로 원격에서 삭제된 브랜치를 로컬에서 정리할 수 있음
> 

---

## 작업 중 dev 최신화 필요 시

> 개인 브랜치 작업 중(미커밋 상태), dev에 다른 팀원 변경사항이 생겼을 때
> 

```jsx
# 1. 현재 작업 임시 저장
git stash -u

# 2. dev 최신화
git checkout dev
git pull origin dev

# 3. 개인 브랜치로 복귀 후 dev 병합
git checkout feature/작업내용
git merge dev

# 4. 작업 복원
git stash pop
```

---

## 주의사항

- `main` 직접 push 금지 — dev 또는 hotfix 경유만 허용
- `dev` 직접 push 금지 — feature 브랜치 PR만 허용
- hotfix를 main에만 merge하고 dev에 반영하지 않으면 다음 배포 때 버그 재발
- 같은 파일을 동시에 작업하지 않기
- push 후 Discord에 알리기
- 작업 중 수시로 fetch 또는 pull 해서 브랜치 상태 확인
- 터미널 / VS Code 하단에서 현재 브랜치 항상 확인