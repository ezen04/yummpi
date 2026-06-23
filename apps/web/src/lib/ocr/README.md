# `@/lib/ocr` — CLOVA General OCR V2 래퍼

⑤ 소유. CLOVA General OCR V2 동기 호출 진입점 + 정규화/재시도/큐 limiter.

## 서버 측 호출 (Next.js Route Handler·Server Action 등)

```ts
import { callGeneralOcr } from '@/lib/ocr';

const tokens = await callGeneralOcr(imageBase64, 'jpg');
// tokens: OcrToken[]  (@yummpi/schemas)
```

`@/lib/ocr` 진입점은 `'server-only'` 가드가 걸려 있다. 클라이언트 컴포넌트에서 import하면 빌드 시점에 에러 발생.

## 클라이언트 측 에러 처리 (④ FE)

`callGeneralOcr`는 다음 경우에 `OcrFailedError`를 throw한다:

| kind | 의미 | ④ 메시지 분기 |
| --- | --- | --- |
| `TRANSPORT` | 네트워크/timeout/non-2xx 3회 실패 | "OCR 일시 오류. 잠시 후 다시 시도해주세요" |
| `INFER_FAILURE` | 200 응답 `inferResult: FAILURE` (영수증 흐림·잘림) | "영수증이 흐릿해요. 다시 찍어주세요" |
| `INFER_ERROR` | 200 응답 `inferResult: ERROR` (이미지별 처리 예외) | "OCR 처리 중 오류가 발생했어요. 잠시 후 다시 시도해주세요" |
| `CONFIG` | CLOVA env 미설정 또는 입력 크기(6MB) 초과 | (서버 설정 오류 — 운영 알림) |
| `MALFORMED_RESPONSE` | CLOVA 응답 형식 이상 | (서버 알림 + 사용자 일반 오류) |
| `QUEUE_OVERFLOW` | OCR 큐 가득 (한도 50건) — 동시 업로드 폭주 시 | "지금 처리량이 많아요. 잠시 후 다시 시도해주세요" |

서버 Route Handler가 `OcrFailedError`를 catch해서 API 응답으로 변환한 뒤, 클라이언트는 응답 봉투의 `error.code`/`error.details.kind`로 분기하는 게 일반 흐름. 만약 클라이언트 코드에서 직접 `OcrFailedError` 타입을 참조해야 한다면 (드물지만), `'server-only'` 가드를 우회하기 위해 `errors`에서 **직접 import**한다:

```ts
// 클라이언트 컴포넌트
import { OcrFailedError, type OcrFailureKind } from '@/lib/ocr/errors';
// '@/lib/ocr'에서 import하면 server-only 가드에 막힘
```

타입만 필요하면 `import type`은 어디서나 안전 (런타임 코드 없음):

```ts
import type { OcrFailureKind, OcrInferResult } from '@/lib/ocr/errors';
```

## env

서버 전용:

```
CLOVA_OCR_INVOKE_URL=
CLOVA_OCR_SECRET=
```

미설정 시 `OcrFailedError('CONFIG')` 즉시 throw. 실제 값은 팀 공유 채널.

## 정책 (④과 합의 종결분)

| 항목 | 값 |
| --- | --- |
| 호출 단위 | A안 단건. 클라에서 `Promise.allSettled`로 N장 동시 처리 |
| limiter 한도 초과 | A1 queue 대기 (429 안 떨굼) |
| 재시도 범위 | 전송 실패만. `INFER_FAILURE`·`INFER_ERROR`는 재시도 없음 |
| 재시도 횟수 / backoff | 2회 / 100ms · 300ms |
| per-request timeout | **잠정 3000ms** (E2E·실기기에서 ④과 함께 재조정 예정) |

자세한 결정 로그: `ocr-parser-work-role5-collaboration.local.md` (루트, gitignore)
