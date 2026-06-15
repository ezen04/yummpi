# harness/ — 바이브코딩 하네스 배치 가이드

리포 골격이 준비되면 아래 표대로 파일을 옮긴다. (H-Phase 1~4 산출물)

| 파일 | 배치 위치 | H-Phase |
| --- | --- | --- |
| `../CLAUDE-yummpi.md` | 리포 루트 `CLAUDE.md` (이름 변경) | H-1.1 |
| `../design.md` | 리포 루트 또는 `docs/design.md` | H-1.1 |
| `../docs/erd-v2.1.md` | `docs/erd.md` | H-1.1 |
| `claude-settings.json` | `.claude/settings.json` (커밋해서 5인 공유) | H-1.2 |
| `roles/01~05-*.CLAUDE.md` | 각 도메인 폴더의 `CLAUDE.md` (아래 매핑) | H-2 |
| `agents/code-reviewer.md` | `.claude/agents/code-reviewer.md` | H-3.2 |
| `agents/refactorer.md` | `.claude/agents/refactorer.md` | H-3.3 |
| `PULL_REQUEST_TEMPLATE.md` | `.github/PULL_REQUEST_TEMPLATE.md` | H-4.1 |
| `security-tests.md` | `e2e/security/` 테스트 작성 기준 | H-5.2 |

## 에이전트 피드백 루프 운영 규칙

```
코드 작성 → code-reviewer 실행 → 리뷰 결과(BLOCK 사유)를 refactorer 프롬프트에 전달
→ refactorer 수정 → code-reviewer 재실행 → PASS 시 PR
```

- 루프는 자동으로 돌리되 **머지는 반드시 사람 1명이 승인** (CLAUDE.md의 승인 원칙과 동일)
- refactorer는 단일 도메인 한정 — 리뷰 지적이 다른 도메인 수정을 요구하면 루프 중단 후 해당 오너에게 인계
- 루프 2회 반복 후에도 BLOCK이면 자동 반복 중지, 사람이 개입

## 역할별 CLAUDE.md 매핑 (골격 확정 후 경로 조정)

| 파일 | 배치 폴더 |
| --- | --- |
| `roles/01-meeting-lifecycle.CLAUDE.md` | `features/meeting/CLAUDE.md` |
| `roles/02-place-design.CLAUDE.md` | `features/place/CLAUDE.md` + `components/common/CLAUDE.md` |
| `roles/03-realtime-vote.CLAUDE.md` | `features/vote/CLAUDE.md` |
| `roles/04-settlement.CLAUDE.md` | `features/settlement/CLAUDE.md` |
| `roles/05-payment-platform.CLAUDE.md` | `features/payment/CLAUDE.md` |

> Claude Code는 작업 중인 폴더의 CLAUDE.md를 자동 로드한다 — 도메인 폴더 배치가 "자기 역할 밖 수정 금지"를 가장 강하게 강제하는 방법.

## 남은 작업 (리포 생성 후)

- [ ] H-3.2 PR 자동 리뷰: GitHub Actions `anthropics/claude-code-action` 워크플로 추가 (`ANTHROPIC_API_KEY` 시크릿 필요)
- [ ] H-3.1 `docs/ai-harness.md`: 컨텍스트 관리·프롬프트 체인 원칙 (CLAUDE.md에 넣지 말 것 — 토큰 낭비)
- [ ] H-5: CI에 `tsc --noEmit` + lint 게이트 (⑤의 ci.yml)
- [ ] 브랜치 보호 규칙: main 직접 push 금지, PR 리뷰 1인 + CI 통과 필수
