import { NextResponse } from 'next/server';

/**
 * API 응답 봉투 + 에러코드 레지스트리 (api-spec §13).
 *
 * 성공: { success: true, data, message? }
 * 실패: { success: false, error: { code, message, details } }
 *
 * 코드는 api-spec §13에 정의된 값만 사용. INTERNAL_ERROR(500)는 처리되지 않은
 * 예외용 공용 fallback(§13 추가 제안 — #dev 공지 대상).
 */

export const ERROR_STATUS = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  VALIDATION_ERROR: 400,
  MEETING_NOT_FOUND: 404,
  MEMBER_NOT_FOUND: 404,
  CANDIDATE_NOT_FOUND: 404,
  RECEIPT_NOT_FOUND: 404,
  SETTLEMENT_NOT_FOUND: 404,
  PAYMENT_NOT_FOUND: 404,
  ALREADY_JOINED_MEETING: 409,
  INVALID_INVITE_CODE: 400,
  MEETING_CAPACITY_EXCEEDED: 409,
  INVALID_MEETING_STATUS_TRANSITION: 409,
  INVALID_SETTLEMENT_STATUS: 409,
  INVALID_PAYMENT_STATUS: 409,
  VOTING_CLOSED: 409,
  ALREADY_CONFIRMED_PLACE: 409,
  MEETING_EXPIRED: 409,
  NICKNAME_DUPLICATED: 409,
  SETTLEMENT_ALREADY_EXISTS: 409,
  VOTING_SETTING_LOCKED: 409,
  RECEIPT_LOCKED: 409,
  SETTLEMENT_CALCULATION_PENDING: 409,
  RECEIPT_ALREADY_OCR_SUCCEEDED: 409,
  RECEIPT_REQUIRED: 422,
  RECEIPT_LIMIT_EXCEEDED: 422,
  SETTLEMENT_AMOUNT_MISMATCH: 422,
  PAYMENTS_NOT_COMPLETED: 422,
  OCR_REQUEST_FAILED: 502,
  OBJECT_UPLOAD_FAILED: 502,
  INTERNAL_ERROR: 500,
} as const;

export type ErrorCode = keyof typeof ERROR_STATUS;

/** 라우트 어디서든 throw → handleRoute가 봉투로 변환. */
export class ApiError extends Error {
  readonly code: ErrorCode;
  readonly details: unknown;

  constructor(code: ErrorCode, message?: string, details?: unknown) {
    super(message ?? code);
    this.name = 'ApiError';
    this.code = code;
    this.details = details ?? null;
  }
}

interface SuccessBody<T> {
  success: true;
  data: T;
  message?: string;
}

interface ErrorBody {
  success: false;
  error: { code: ErrorCode; message: string; details: unknown };
}

/** 성공 봉투. init에 숫자를 주면 status로 사용(예: 201). */
export function apiSuccess<T>(
  data: T,
  message?: string,
  init?: number | ResponseInit
): NextResponse<SuccessBody<T>> {
  const body: SuccessBody<T> = { success: true, data };
  if (message) body.message = message;
  const responseInit = typeof init === 'number' ? { status: init } : init;
  return NextResponse.json(body, responseInit);
}

/** 실패 봉투. ApiError 인스턴스 또는 ErrorCode를 받는다. */
export function apiError(
  error: ApiError | ErrorCode,
  message?: string,
  details?: unknown
): NextResponse<ErrorBody> {
  const err =
    error instanceof ApiError ? error : new ApiError(error, message, details);
  const body: ErrorBody = {
    success: false,
    error: {
      code: err.code,
      message: err.message,
      details: err.details ?? null,
    },
  };
  return NextResponse.json(body, { status: ERROR_STATUS[err.code] });
}

/**
 * 라우트 핸들러 래퍼. ApiError는 봉투로, 그 외 예외는 INTERNAL_ERROR(500)로 변환.
 *
 *   export const GET = handleRoute(async (req) => { ... });
 */
export function handleRoute<Args extends unknown[]>(
  handler: (...args: Args) => Promise<NextResponse> | NextResponse
) {
  return async (...args: Args): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (err) {
      if (err instanceof ApiError) return apiError(err);
      console.error('[api] unhandled error:', err);
      return apiError('INTERNAL_ERROR', '서버 오류가 발생했습니다.');
    }
  };
}
