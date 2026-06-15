# 얌피 핵심 다이어그램

> 산출물 ③. ERD는 `docs/erd-v2.2.md` 참조.

## 1. 모임 상태 머신

전 도메인이 공유하는 핵심 규칙. 건너뛰기·역행 시 `409 INVALID_MEETING_STATUS_TRANSITION`.

```mermaid
stateDiagram-v2
    [*] --> DRAFT : 모임 생성 (회원)
    DRAFT --> RECRUITING : 초대 링크 공유
    RECRUITING --> VOTING : 후보 등록 후 투표 시작 (호스트)
    VOTING --> PLACE_CONFIRMED : 장소 확정 (호스트, 동률 시 수동 선택)
    PLACE_CONFIRMED --> IN_PROGRESS : 예약 완료·모임 진행
    IN_PROGRESS --> SETTLING : 참석 체크 → 정산 시작 (호스트)
    SETTLING --> COMPLETED : 전원 송금 PAID/EXEMPT
    DRAFT --> CANCELLED
    RECRUITING --> CANCELLED
    VOTING --> CANCELLED
    PLACE_CONFIRMED --> CANCELLED
    note right of CANCELLED : 호스트만 가능<br/>COMPLETED 이후 삭제 불가(보관)
    note right of COMPLETED : expires_at 경과 시<br/>자동 종료 (BullMQ Job)
```

## 2. 실시간 투표 시퀀스 (REST 저장 + Socket 전파)

```mermaid
sequenceDiagram
    participant A as 참석자 A (FE)
    participant API as Next.js API
    participant DB as PostgreSQL
    participant S as Socket 서버 (apps/server)
    participant R as Redis (Adapter)
    participant B as 참석자 B~N (FE)

    A->>A: 낙관적 업데이트 (즉시 UI 반영)
    A->>API: PUT /meetings/:id/votes {candidateId}
    API->>DB: $transaction (UNIQUE meeting+member → 기존 표 UPDATE)
    DB-->>API: 저장 + 서버 집계 재계산
    API->>S: vote:updated 발행 (집계값 포함)
    S->>R: Redis Pub/Sub (수평 확장)
    S-->>B: vote:updated 브로드캐스트 (room: meeting:{id})
    S-->>A: vote:updated (서버값으로 최종 동기화)
    Note over A: 실패 시 스냅샷 롤백<br/>mutation 중 수신 이벤트는 버퍼링
    Note over API,DB: 클라이언트 집계값 불신 — 서버 재계산만 전파
```

## 3. 정산 파이프라인 (다중 영수증 → OCR → 분배 → 송금)

```mermaid
flowchart TD
    A[영수증 N장 접수\n촬영 + 갤러리 혼합] --> B[presigned URL 다건 발급\n→ S3 직접 업로드]
    B --> C[장당 RECEIPT 생성\nocr_status 독립 추적]
    C --> D{CLOVA OCR\n영수증별 개별 처리}
    D -- 성공 --> E[검수 화면\n메뉴·금액 수정]
    D -- 실패 --> F[fallback:\n직접 입력 or 1/N 균등]
    F --> E
    E --> G[소비 항목 선택\n메뉴별 참석자 체크 + 수량]
    G --> H[분배 엔진 calculate\n모임당 SETTLEMENT 1건에 전체 영수증 합산\n봉사료·세금 비율 배분 + 1원 보정]
    H --> I{Σ final == total?}
    I -- 아니오 --> H
    I -- 예 --> J[정산 확정 — 호스트\n금액 잠금 + PAYMENT 생성]
    J --> K[송금 딥링크\n토스/카카오페이]
    K --> L[송금 현황\nD+1/D+3 독촉 알림 BullMQ]
    L --> M[전원 PAID → 모임 COMPLETED]
    J -.->|수정 필요 시| N[재오픈\n전원 PENDING일 때만]
    N -.-> E
```

## 4. 인증 플로우 (카카오 회원 + 게스트)

```mermaid
flowchart TD
    subgraph 회원
        K1[카카오 로그인] --> K2[NextAuth + PrismaAdapter\nUser upsert]
        K2 --> K3[세션 발급] --> K4[대시보드·모임 생성·호스트 권한]
    end
    subgraph 게스트
        G1[초대 링크 /join/:code] --> G2{모임 유효?\n만료·인원 체크}
        G2 -- 아니오 --> G3[차단 화면\n409 MEETING_EXPIRED 등]
        G2 -- 예 --> G4[닉네임 입력\n중복 시 suffix: 지훈2]
        G4 --> G5[MEETING_MEMBER 생성\nuser_id NULL + guest_token_hash]
        G5 --> G6[모임 범위 토큰 쿠키] --> G7[투표·후보 추가·소비 선택만 가능]
    end
    K4 & G7 --> M[공통 미들웨어\ngetCurrentMember : 세션 OR 게스트 토큰]
    M --> H{호스트 전용 API?}
    H -- 예 --> H2[assertHost 검사\n게스트·일반 멤버 403]
```

> 게스트 인증 구현 방식(NextAuth JWT vs 자체 토큰)은 ① 담당 결정 대기 — 위 플로우는 자체 토큰(b안) 기준이며, (a)안 채택 시 G5~G6만 NextAuth 세션으로 대체된다.
