## 변경 내용

- 스펙/이슈:
- 1 PR = 1 기능 단위 — 이 PR이 담은 기능:

## 담당 영역 확인

- [ ] 변경 파일이 전부 내 역할(①~⑤)의 허용 경로 안이다
- [ ] 경계 밖 파일을 건드렸다면: 해당 오너에게 리뷰 요청했다 → @
- [ ] 공용 자원(apps/server/prisma/schema.prisma / packages/schemas / apps/server Socket / .github) 변경 시 사전 공지했다

## AI 생성 코드 체크리스트 (커밋 전 필수)

- [ ] AI 출력을 직접 읽고 이해했다 (이해 못 한 코드 머지 금지)
- [ ] 하드코딩된 키·시크릿·HEX 색상 없음
- [ ] `{success, data, message}` 응답 봉투 + 정의된 에러 코드만 사용
- [ ] 금액은 INTEGER 연산, 다중 쓰기는 트랜잭션
- [ ] 버전 정책 준수 (package.json 임의 변경 없음)
- [ ] `pnpm typecheck && pnpm lint` 로컬 통과
- [ ] 브라우저/Playwright로 실제 동작 확인 (검증 없이 완료 선언 금지)
- [ ] 새 API가 있다면 적대적 테스트 케이스 1개 이상 추가 (`e2e/security/README.md` 기준)
- [ ] 정산 엔진·상태 머신 변경이라면 테스트 먼저 작성했다 (TDD)

## 리뷰

- [ ] code-reviewer Agent 결과: PASS / BLOCK (Blocker 0건)
- 사람 리뷰어: @
