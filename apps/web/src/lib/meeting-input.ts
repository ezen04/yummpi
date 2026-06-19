import { ApiError } from '@/lib/api-response';

/**
 * 모임 입력 수동 검증 헬퍼.
 * (apps/web에 zod·@yummpi/schemas 배선 후 공용 스키마로 교체 예정 — ⑤ 핸드오프)
 * 모든 opt* 헬퍼는 값이 없으면 undefined를 반환하고, 있으면 검증한다.
 * 기본값(생성 시 anonymousVoting=true 등)은 호출측에서 적용한다.
 */

export function bad(msg: string): never {
  throw new ApiError('VALIDATION_ERROR', msg);
}

export function reqString(
  v: unknown,
  field: string,
  min: number,
  max: number
): string {
  if (typeof v !== 'string') bad(`${field}는 문자열이어야 합니다.`);
  const s = v.trim();
  if (s.length < min || s.length > max) {
    bad(`${field}는 ${min}~${max}자여야 합니다.`);
  }
  return s;
}

export function optString(
  v: unknown,
  field: string,
  min: number,
  max: number
): string | undefined {
  if (v === undefined || v === null) return undefined;
  return reqString(v, field, min, max);
}

export function optInt(v: unknown, field: string): number | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v !== 'number' || !Number.isInteger(v) || v <= 0) {
    bad(`${field}는 양의 정수여야 합니다.`);
  }
  return v;
}

export function optBool(v: unknown, field: string): boolean | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v !== 'boolean') bad(`${field}는 boolean이어야 합니다.`);
  return v;
}

export function optDate(v: unknown, field: string): Date | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v !== 'string') bad(`${field}는 ISO 날짜 문자열이어야 합니다.`);
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) bad(`${field} 날짜 형식이 올바르지 않습니다.`);
  return d;
}

export function optStringArray(
  v: unknown,
  field: string
): string[] | undefined {
  if (v === undefined || v === null) return undefined;
  if (!Array.isArray(v) || v.some((x) => typeof x !== 'string')) {
    bad(`${field}는 문자열 배열이어야 합니다.`);
  }
  return v as string[];
}

export function reqBool(v: unknown, field: string): boolean {
  if (typeof v !== 'boolean') bad(`${field}는 boolean이어야 합니다.`);
  return v;
}

export function optLatitude(v: unknown, field: string): number | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v !== 'number' || !Number.isFinite(v) || v < -90 || v > 90) {
    bad(`${field}는 -90~90 사이의 숫자여야 합니다.`);
  }
  return v;
}

export function optLongitude(v: unknown, field: string): number | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v !== 'number' || !Number.isFinite(v) || v < -180 || v > 180) {
    bad(`${field}는 -180~180 사이의 숫자여야 합니다.`);
  }
  return v;
}

export function optEnum<T extends string>(
  v: unknown,
  field: string,
  allowed: readonly T[]
): T | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v !== 'string' || !allowed.includes(v as T)) {
    bad(`${field}는 다음 중 하나여야 합니다: ${allowed.join(', ')}`);
  }
  return v as T;
}
