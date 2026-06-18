import {
  PaymentListResponseSchema,
  UpdatePaymentResponseSchema,
  CompleteMeetingResponseSchema,
  type PaymentAction,
  type PaymentListResponse,
  type UpdatePaymentResponse,
  type CompleteMeetingResponse,
} from '@yummpi/schemas';

export class PaymentApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'PaymentApiError';
  }
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  const json = (await res.json()) as {
    success: boolean;
    data?: T;
    error?: { code: string; message: string; details?: unknown };
  };

  if (!json.success) {
    throw new PaymentApiError(
      json.error?.code ?? 'UNKNOWN_ERROR',
      json.error?.message ?? '알 수 없는 오류가 발생했습니다.',
      json.error?.details
    );
  }

  return json.data as T;
}

// 정산 확정 후 Payment를 idempotent하게 생성한다.
// 오류 코드 INVALID_SETTLEMENT_STATUS | SETTLEMENT_NOT_FOUND → 정산 미확정 상태로 처리.
export async function initializePayments(meetingId: string): Promise<void> {
  await apiFetch(`/api/v1/meetings/${meetingId}/payments/initialize`, {
    method: 'POST',
  });
}

export async function getPayments(
  meetingId: string
): Promise<PaymentListResponse> {
  const data = await apiFetch<unknown>(
    `/api/v1/meetings/${meetingId}/payments`
  );
  return PaymentListResponseSchema.parse(data);
}

export async function updatePayment(
  meetingId: string,
  paymentId: string,
  action: PaymentAction
): Promise<UpdatePaymentResponse> {
  const data = await apiFetch<unknown>(
    `/api/v1/meetings/${meetingId}/payments/${paymentId}`,
    { method: 'PATCH', body: JSON.stringify({ action }) }
  );
  return UpdatePaymentResponseSchema.parse(data);
}

export async function completePayments(
  meetingId: string
): Promise<CompleteMeetingResponse> {
  const data = await apiFetch<unknown>(
    `/api/v1/meetings/${meetingId}/payments/complete`,
    { method: 'POST' }
  );
  return CompleteMeetingResponseSchema.parse(data);
}
