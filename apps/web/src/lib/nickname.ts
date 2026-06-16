/**
 * 게스트 랜덤 닉네임 생성 (형용사 + 동물).
 * GET /api/v1/auth/nickname/random 응답용. 중복 보장은 하지 않으며,
 * 실제 중복 검사는 게스트 생성 시점에서 수행한다.
 */

const ADJECTIVES = [
  "용감한",
  "행복한",
  "느긋한",
  "씩씩한",
  "엉뚱한",
  "다정한",
  "냉정한",
  "수줍은",
  "활발한",
  "신비한",
  "졸린",
  "배고픈",
  "재빠른",
  "포근한",
  "엉큼한",
  "당당한",
] as const;

const ANIMALS = [
  "수달",
  "너구리",
  "고양이",
  "판다",
  "여우",
  "사슴",
  "고슴도치",
  "올빼미",
  "다람쥐",
  "수리",
  "돌고래",
  "햄스터",
  "두더지",
  "표범",
  "물범",
  "코알라",
] as const;

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** 예: "용감한수달". 닉네임 스키마(1~20자) 범위 내. */
export function randomNickname(): string {
  return `${pick(ADJECTIVES)}${pick(ANIMALS)}`;
}
