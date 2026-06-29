import { randomInt } from 'node:crypto';

/**
 * 초대 코드 생성 — 8자 영숫자. 혼동 문자(I, O, 0, 1) 제외.
 * 충돌 검사는 호출측에서 (meetings.invite_code UNIQUE).
 * 초대 링크: {배포 도메인}/join/{inviteCode}
 */

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 8;

export function generateInviteCode(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += ALPHABET[randomInt(ALPHABET.length)];
  }
  return code;
}

export function inviteUrl(inviteCode: string): string {
  // 배포 도메인 기준. NEXTAUTH_URL은 Vercel=배포 도메인, 로컬=http://localhost:3000으로 이미 세팅됨.
  // (커스텀 도메인 붙으면 NEXTAUTH_URL만 교체 → 코드 무변경)
  const base = (process.env.NEXTAUTH_URL ?? 'https://yummpi.com').replace(
    /\/+$/,
    ''
  );
  return `${base}/join/${inviteCode}`;
}
