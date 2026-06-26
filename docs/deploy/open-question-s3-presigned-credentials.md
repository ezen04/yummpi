# Open Question — S3 presigned 자격증명 (web 라우트 vs task role)

> 상태: **A안 권고 — ④ 확인만 남음** · 작성 2026-06-25 (⑤)
> 관련: [`aws-vercel.md §15`](./aws-vercel.md) · `apps/web/src/features/settlement/CLAUDE.md` · `docs/api-spec.md §9`

---

## 1. 한 줄 결론

④가 작성할 presigned 발급 라우트는 **`apps/web`(Vercel)에서 돈다.** Vercel은 Fargate task role을 못 쓰므로 **운영에도 정적 키 1세트(`AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`)가 필요**하다.
이건 사실상 **유일하게 가능한 길(= A안)**이며 **인프라·스펙이 이미 다 준비돼 있다.** 새로 설계할 것 없음 — ⑤가 IAM 유저 만들어 키 발급 → Vercel 주입이면 끝.
`aws-vercel.md §15.6`의 "task role이라 access key를 안 넣는다"는 server에서 돌 때만 맞는 서술이라 **web 라우트 기준으로 정정**한다.

---

## 2. 무엇이 맞고 무엇이 틀렸나 (검증 결과)

### ✅ 맞는 부분 (코드·문서로 확인됨)

| 주장 | 근거 |
| --- | --- |
| ④는 AWS 계정·개인 키를 만들 필요 없음 | 역할 분담 (②③④는 키 발급 아님) |
| 버킷·CORS·lifecycle·IAM은 ⑤ 콘솔 작업 | `aws-vercel.md §15.2~15.5` |
| ④ 코드는 `new S3Client({ region })` — 키 미주입 | SDK 자격증명 체인이 env에서 자동 해석 |
| 5명이 각자 IAM 키 뽑는 게 아니라 팀 공용 키 | `.env.example`에 **이름만** 등록 |
| IAM은 `meetings/*` prefix 최소권한 (그냥 주는 게 아님) | `aws-vercel.md §15.5` 인라인 정책 |

### ⚠️ 틀린(부정확한) 부분 — "server-only"의 함정

"운영(ECS)은 task role이 자동 해석한다"는 서술은 **presigned 라우트가 Fargate(`apps/server`)에서 돈다고 가정**한다.
하지만 실제 라우트 위치는 **`apps/web`(Vercel)**이다:

1. **④ 도메인 문서** `apps/web/src/features/settlement/CLAUDE.md:15`
   → ④ 허용 경로 = `app/api/v1/meetings/[meetingId]/receipts/**` (Next.js App Router = **apps/web**)
2. **API 스펙** `docs/api-spec.md:263`
   → `POST /api/v1/meetings/:meetingId/receipts/upload-urls` (presigned 발급) = `/api/v1/` web 라우트
3. **소유권** ④ 금지영역 표에서 `apps/server`는 **③ 소유** → ④는 server에 코드를 둘 수 없음

**Vercel에는 Fargate task role이 없다.** 따라서 web에서 도는 한, `new S3Client({ region })`은 자격증명 체인에서 해석할 게 없어 **정적 키를 Vercel env로 주입해야** 작동한다.
→ ④가 받는 **로컬 dev 키와 동일한 종류의 정적 키가 운영(Vercel)에도 필요**하다.

---

## 3. 선택지 — ✅ **A 권고**

| 안 | 내용 | 평가 |
| --- | --- | --- |
| **✅ A. web 유지 + 정적 키** (권고) | presigned 라우트를 `apps/web`에 두고, Vercel env에 정적 IAM 키(dev/prod) 주입 | **인프라·스펙 이미 준비됨**, 설계·코드 변경 0. ④ 코드 위치·소유권 그대로 |
| B. server로 이전 | presigned 발급만 `apps/server`(Fargate)로 옮김 | task role 성립 → 정적 키 0개. 단 ④ 코드가 ③ 영역으로 넘어가고 라우트 분리·프록시 **재설계 필요** |
| C. 후속 차수 보류 | 영수증 업로드 자체를 다음 차수로 | 정산 P0 기능 지연 |

### 왜 A인가 — "이미 다 준비됨"

A는 사실상 **유일하게 가능한 길**이다. web 라우트가 Vercel에서 도는 한 task role을 못 쓰므로, B(server 이전)를 안 할 거면 정적 키 = A로 귀결된다. 그리고 A에 필요한 건 전부 이미 있다:

- `.env.example`에 `AWS_ACCESS_KEY_ID`·`AWS_SECRET_ACCESS_KEY`·`AWS_S3_BUCKET`·`AWS_REGION` **이름 등록 완료**
- IAM 최소권한 정책 JSON(`meetings/*`) **`§15.5`에 작성 완료**
- presigned 라우트 스펙 **`api-spec.md:263` 정의 완료**

**§15.6 대비 추가되는 작업은 딱 하나** — `§15.5` 정책은 task role에 붙는데, A는 web용이라 **동일 정책을 붙인 IAM 유저를 만들어 access key를 발급**하면 된다(콘솔 5분, 코드 변경 없음).

> 현재 배포는 **A의 일부(키 제외)** 상태 — Vercel env `AWS_*` 4종을 **제외하고** 진행 중. 즉 영수증 업로드는 운영에서 아직 동작하지 않는다. A 확정 + 키 주입으로 바로 해소된다.

---

## 4. 남은 확인 1건

- [ ] **④ 확인**: web 라우트에 정적 키 쓰는 A안 OK? (B로 옮길 이유 없으면 A 확정) — B 선택 시에만 ④↔③ 라우트 소유권 재배치 합의 필요

---

## 5. ⑤(본인)이 할 일

> ⑤는 키 이름 등록·서버 가드·버킷/IAM 콘솔 작업 담당. 실제 결정(A/B/C)은 ④+팀.

**지금 (A 권고 기준):**
- [x] 이 문서로 갭 명시 + A 권고 (현재 문서)
- [x] `aws-vercel.md §15` 상단에 "⚠️ 전제 미확정 — 이 문서 참조" 포인터 추가
- [ ] ④에게 이 문서 공유 → **A안 OK만 확인** (§4)

**A 확정되면 (콘솔 5분 + env 주입):**
- [ ] ⑤가 콘솔에서 **IAM 사용자 + 인라인 정책**(`§15.5`와 동일, `meetings/*` 최소권한) 생성 → **dev 키 1세트 + 운영 키 1세트** 발급
- [ ] dev 키 → 팀 공유 채널로 전달 (④ 로컬 `.env`)
- [ ] 운영 키 → Vercel env에 `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`/`AWS_S3_BUCKET`/`AWS_REGION` 주입 (Preview/Production 분리)
- [ ] `aws-vercel.md §5 Vercel env` 표에서 `AWS_*` 4종 "제외" 헤지 제거 → 정식 포함으로 정정
- [ ] `aws-vercel.md §15.6` 정정 — "web 라우트는 정적 키, server는 task role"로 분리 서술

**(만약 B로 뒤집히면):**
- ③↔④ 소유권 재배치는 ⑤ 영역 아님 — 결정만 중계, 인프라(task role 정책 `§15.5`)는 그대로 유효 / Vercel env `AWS_*`는 계속 제외

**공통:**
- [ ] Vercel 배포 origin 확정 시 버킷 CORS `AllowedOrigins`에 추가 (`§15.7`, 도메인 2단계와 함께)
