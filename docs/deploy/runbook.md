# yummpi 배포 실행 런북 (B-day 순서)

> 목적: **리소스 발급(로드맵 B)이 끝난 날**, 위에서 아래로 따라 실행하는 단일 순서표.
> 이 문서는 **실행 순서 인덱스**다. 각 단계의 근거·상세는 [`aws-vercel.md`](./aws-vercel.md)(공개 계획서)의 해당 §를 가리킨다 — 여기서 재설명하지 않는다.
> 실 secret 값은 이 문서에 **절대 기재하지 않는다**(`aws-vercel.md` §14 공개 문서 규칙).
> 담당: ⑤(플랫폼). 단, 실값·계정 작업 일부는 도메인 owner 책임(0단계 참조).

---

## 진행 게이트 (요약)

```
0. 사전 준비(B)        → 리소스 6종 + 도메인 발급 확인
1. GitHub 등록         → repo Secrets / Variables
2. server 비밀값        → SSM/Secrets Manager + task def REPLACE_*
3. DB migration        → RDS 직접 연결로 migrate deploy
4. server 배포          → ECR push + ECS 롤아웃 (워크플로 수동)
5. web 배포            → Vercel 프로젝트 생성 + env 주입
6. 연결 검증           → wss 핸드셰이크 · BullMQ · 도달성
7. Go/No-Go           → §12 체크리스트 통과
8. 롤백(필요 시)        → §13
```

> 순서 원칙: **server(2~4) → web(5) → 연결(6)**. server 비밀값·DB가 준비되기 전 web을 띄우면 런타임 연결이 깨진다. migration(3)은 server 이미지 롤아웃(4)보다 **먼저**(§10.3).

---

## 0. 사전 준비 — 리소스 발급 확인 (로드맵 B)

발급은 **도메인 owner 책임**, ⑤은 발급 완료 여부만 확인한다(실값은 팀 공유 채널).

- [ ] AWS 계정 · IAM · VPC
- [ ] RDS PostgreSQL 17 (server 직접 연결용)
- [ ] Upstash Redis (web·server 공유 `rediss://`)
- [ ] S3 버킷 — **콘솔 작업 ⑤**(계정 1개 공유), **내용 결정 ④**
      - ④ 확정 대기: 버킷명 · lifecycle · 객체 경로(`receipts/{meetingId}/{receiptId}`) · 파일 제약(타입·용량) · 마스킹 원본 여부
      - ⚠️ lifecycle 갭: 기획 "종료 후 90일" vs S3 "업로드 후 N일"(종료 시점 미감지) → (a)업로드후90일 / (b)앱 직접삭제+긴 lifecycle 중 ④ 택1
      - ⑤ 후속: 확정 후 버킷 생성 + CORS(`yummpi.app`) + 퍼블릭차단 + IAM 최소권한 + access key → SSM secret 주입
- [ ] Prisma Accelerate 연결 (web `prisma://`) — §3.2
- [ ] ECR 레지스트리
- [ ] 도메인 `yummpi.app` + `ws.yummpi.app` DNS · TLS

> DB 접근은 **2경로**다: web = Accelerate(`prisma://`), server = RDS 직접(VPC), migration = RDS 직접. 섞지 말 것(§3.2 · §5 · §10.1).

---

## 1. GitHub 등록 — repo Secrets / Variables

현재 워크플로 주석·`deploy/README.md`에 흩어져 있는 항목을 한 표로 모은다. (Settings → Secrets and variables → Actions)

### Secrets

| 키 | 쓰이는 곳 | 비고 |
| --- | --- | --- |
| `AWS_DEPLOY_ROLE_ARN` | `deploy-server.yml` (OIDC role assume) | ECR push·ECS 롤아웃 권한 role의 ARN |
| `AUTH_SECRET` | `ci.yml` (e2e `NEXTAUTH_SECRET`) | **CI e2e 보안 테스트 skip 해제용** — 배포 런타임 secret 아님. 등록 후 `tests/security/payments.spec.ts` skip 해제 검토 |

### Variables

| 키 | 값 | 비고 |
| --- | --- | --- |
| `DEPLOY_ENABLED` | `true` | **이 값이 `true`가 되기 전까지 `deploy-server.yml` 두 job은 skip**(골격 안전장치) |
| `AWS_REGION` | (예: `ap-northeast-2`) | 미설정 시 워크플로 `env` 기본값(`ap-northeast-2`) |
| `ECR_REPOSITORY` | (예: `yummpi-server`) | 미설정 시 기본값(`yummpi-server`) |
| `ECS_SERVICE` | (예: `yummpi-server`) | `deploy-ecs` job `service`. 미설정 시 기본값(`yummpi-server`) |
| `ECS_CLUSTER` | (예: `yummpi`) | `deploy-ecs` job `cluster`. 미설정 시 기본값(`yummpi`) |

> 위 4개 variable은 모두 `${{ vars.X || 기본값 }}` 패턴 — **등록하면 override, 미등록이면 기본값**으로 동작한다(클러스터/서비스 이름이 기본값과 같으면 등록 불필요).

> 런타임 secret(DB·Redis·VAPID·SMTP·카카오·OCR)은 **GitHub에 넣지 않는다.** 각각 Vercel(web)·SSM(server)에 넣는다 — 2·5단계.

---

## 2. server 비밀값 — SSM/Secrets Manager + task def

server 컨테이너가 읽을 환경변수를 등록한다. 상세 키 목록은 `aws-vercel.md` **§5 AWS server**, task 정의 채우기는 `deploy/README.md`.

- [ ] §5 server 키 전부를 **SSM Parameter Store / Secrets Manager**에 등록 → 각 ARN 확보
- [ ] `deploy/ecs-task-definition.json`의 `REPLACE_*` 채우기:
  - `REPLACE_EXECUTION_ROLE_ARN` / `REPLACE_TASK_ROLE_ARN`
  - `secrets[].valueFrom` = 위 ARN (**평문 금지**)
  - `environment`(비밀 아님): `REPLACE_CLIENT_ORIGIN`(Vercel 운영 도메인) · `REPLACE_SMTP_PORT`(587) · `REPLACE_AWS_REGION`
- [ ] ⚠️ **`VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY` 누락 시 server 부팅 즉시 크래시**(webPush 초기화). 컨테이너가 안 뜨면 여기부터 본다(§12).

> `REPLACE_IMAGE`는 워크플로가 배포 시 자동 주입한다(수동 등록 시만 교체).

---

## 3. DB migration — RDS 직접 연결

`aws-vercel.md` **§10** 절차를 따른다. 핵심만:

- [ ] **RDS 직접 연결** `DATABASE_URL`(Accelerate `prisma://` 아님)을 주입한 환경에서 실행 — §10.1
- [ ] `pnpm --filter @yummpi/server exec npx prisma migrate deploy`
- [ ] 실행 위치는 RDS에 도달 가능한 러너(§10.2, MVP=수동/CI 수동 트리거)
- [ ] **순서: migrate 먼저 → server 이미지 롤아웃(4단계) 나중** — §10.3. 파괴적 변경은 expand→contract
- [ ] 운영 DB seed 금지, 백업 전제 — §10.4

---

## 4. server 배포 — ECR push + ECS 롤아웃

`deploy/README.md` "활성화 절차" + `deploy-server.yml`(현재 `workflow_dispatch` 수동).

- [ ] 1단계에서 `DEPLOY_ENABLED=true` + `AWS_DEPLOY_ROLE_ARN` 등록 완료 확인
- [ ] Actions → **Deploy Server (ECR + ECS)** → Run workflow(`workflow_dispatch`)
  - `build-push`: Docker 이미지 빌드 → ECR push(`:${{ github.sha }}` + `:latest`)
  - `deploy-ecs`: task def 렌더(이미지 주입) → 서비스 롤아웃(`wait-for-service-stability`)
- [ ] ALB target group health check를 **`/ready`로** 설정(트래픽 라우팅, ECS task 정의 밖) — `deploy/README.md` health check 참조
- [ ] 컨테이너 `/health` 200 확인(liveness, §9)

> 자동 배포(main push/tag)는 MVP 범위 밖 — 필요 시 `deploy-server.yml` `on:`에 트리거 추가.

---

## 5. web 배포 — Vercel

`aws-vercel.md` **§6** 기준. 빌드 설정은 `apps/web/vercel.json`에 커밋돼 있고, 프로젝트 생성·env는 계정 작업.

- [ ] Vercel 프로젝트 생성 → **Root Directory = `apps/web`**(§6 표)
- [ ] 환경변수 주입(§5 Vercel 목록) — **Preview / Production 분리**(§6.2)
  - `DATABASE_URL` = Accelerate `prisma://`(pooling) · `REDIS_URL` = Upstash `rediss://`
  - `NEXT_PUBLIC_SOCKET_URL` = `https://ws.yummpi.app` · `NEXTAUTH_URL` = 운영 도메인
  - `NEXT_PUBLIC_*`은 브라우저 노출 가능 값만
- [x] web Prisma client에 Accelerate extension 적용 — ✅ **코드 적용 완료(#75)**(`apps/web/src/lib/prisma.ts`). 발급된 `prisma://`만 주입하면 됨 — §12
- [ ] PWA(serwist) 서비스워커가 **production 빌드**에서 생성·등록되는지 확인(§6.3)
- [ ] ⚠️ **NextAuth 쿠키 `domain=.yummpi.app`(§3.3)는 ① Auth 영역** — 도메인 연결 후 ①과 확인. ⑤이 코드 수정하지 않음(§6.3 노트)

---

## 6. 연결 검증 (로드맵 G)

리소스가 실제로 서로 닿는지 1회씩 통과시킨다.

- [ ] server CORS: `CLIENT_ORIGIN` = Vercel 운영 도메인으로 web→server 요청 통과
- [ ] **wss 쿠키 핸드셰이크**: 회원·게스트 둘 다 `ws.yummpi.app` 소켓 연결 인증 통과(§3.3). 실패 시 토큰 핸드셰이크 fallback
- [ ] **BullMQ enqueue(web)→consume(server) 1회**: 송금 독촉 Job이 web에서 큐 적재 → server worker가 소비
- [ ] 도달성: web→Upstash, server→RDS(VPC), server→Upstash

---

## 7. Go/No-Go 게이트

`aws-vercel.md` **§12 배포 전 체크리스트**를 전부 통과해야 운영 트래픽을 연다. 위 단계와 중복되는 항목은 거기서 한 번 더 교차 확인한다(특히 VAPID 주입·DB 2경로 분리·Accelerate extension·Redis 양쪽 주입).

---

## 8. 롤백

`aws-vercel.md` **§13** 따른다.

- **Vercel**: 이전 production deployment로 rollback → server API/socket 호환성 확인
- **AWS**: ECS 이전 task definition revision 복귀. 이미지는 고정 SHA 태그로 이력 추적
- **DB**: 파괴적 변경은 expand→contract로 회피 우선(§10.3). rollback 필요한 변경은 별도 계획

---

## 참조 맵

| 단계 | 근거 문서 |
| --- | --- |
| 0 사전 준비 | `deployment-roadmap.local.md` B 섹션(로컬) |
| 1 GitHub 등록 | `deploy-server.yml` 헤더 · `deploy/README.md` |
| 2 server 비밀값 | `aws-vercel.md` §5 · `deploy/README.md` |
| 3 migration | `aws-vercel.md` §10 |
| 4 server 배포 | `deploy/README.md` · `deploy-server.yml` |
| 5 web 배포 | `aws-vercel.md` §6 |
| 6 연결 검증 | `aws-vercel.md` §3.3 · §8 |
| 7 게이트 | `aws-vercel.md` §12 |
| 8 롤백 | `aws-vercel.md` §13 |
