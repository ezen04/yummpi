# deploy/ — server 배포 골격

`apps/server`(Socket.io + BullMQ) 컨테이너를 AWS ECS Fargate에 올리기 위한 **골격**.
실 배포 리소스 발급 전까지 비활성 상태다. 공개 계획서: `docs/deploy/aws-vercel.md`.

## 구성

| 파일 | 역할 |
| --- | --- |
| `.github/workflows/deploy-server.yml` | ECR push + ECS 롤아웃 워크플로 (수동 트리거, `DEPLOY_ENABLED` 가드) |
| `deploy/ecs-task-definition.json` | ECS Fargate task 정의 템플릿 |

## 활성화 절차 (리소스 발급 후)

1. AWS OIDC role / ECR repo / ECS cluster·service 생성
2. **repo secret**: `AWS_DEPLOY_ROLE_ARN`
3. **repo variable**: `DEPLOY_ENABLED=true` (필요 시 `AWS_REGION`·`ECR_REPOSITORY`·`ECS_SERVICE`·`ECS_CLUSTER` override)
4. `deploy/ecs-task-definition.json`의 `REPLACE_*` 채우기 (아래)
5. 자동 배포 원하면 `deploy-server.yml`의 `on:`에 `push`(main)/tag 트리거 추가

## task 정의에서 채울 값 (`REPLACE_*`)

| 키 | 설명 |
| --- | --- |
| `REPLACE_EXECUTION_ROLE_ARN` | ECS task 실행 role (ECR pull·로그·SSM 접근) |
| `REPLACE_TASK_ROLE_ARN` | 컨테이너 런타임 role |
| `REPLACE_IMAGE` | 배포 시 워크플로가 자동 주입 (수동 등록 시만 교체) |
| `REPLACE_SSM_*` | 각 secret의 SSM Parameter Store / Secrets Manager ARN (`secrets` 블록). 환경변수 키는 `docs/deploy/aws-vercel.md` §5 server 목록 기준 |
| `REPLACE_CLIENT_ORIGIN` | 프론트 origin (예: `https://yummpi.app`). 비밀 아님 → `environment` 평문 |
| `REPLACE_SMTP_PORT` | SMTP 포트 (예: `587`). 비밀 아님 → `environment` 평문 |
| `REPLACE_AWS_REGION` | 로그 전송 리전 |

> secret 실값(`secrets` 블록)은 task 정의에 **평문 금지** — SSM/Secrets Manager ARN(`valueFrom`)으로만 주입. `environment` 블록은 비밀 아닌 값만.

## health check

- 컨테이너 `healthCheck`(task 정의) → `/health` (liveness). `startPeriod: 15`로 초기 Redis 연결 buffer.
- 트래픽 라우팅(readiness)은 **ALB target group health check를 `/ready`로** 두는 별도 설정. (ECS task 정의 밖)
- 근거: `2026-06-24-server-health-liveness-coordination.local.md`.

## CPU/메모리

- 초기값 `256 / 512`(0.25 vCPU). BullMQ Worker 상시 폴링 + Socket 부하 보고 조정.
