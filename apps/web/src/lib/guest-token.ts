import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * 게스트 b안 자체 토큰 (NextAuth 미사용).
 *
 * 토큰 = base64url(payload).base64url(HMAC-SHA256(payload, secret))
 *   payload = JSON{ m: memberId, g: meetingId, iat }
 * DB(meeting_members.guest_token_hash)에는 sha256(token)을 저장한다.
 * 검증 시 서명(위조 방지) + 해시(폐기/멤버 바인딩)를 이중 확인.
 * 쿠키는 모임 범위(yummpi_guest_<meetingId>)로 분리해 다중 모임 게스트를 지원.
 */

const COOKIE_PREFIX = "yummpi_guest_";
const MAX_AGE_SEC = 60 * 60 * 24 * 30; // 30일

interface GuestPayload {
  m: string; // memberId
  g: string; // meetingId
  iat: number;
}

function secret(): string {
  const s = process.env.GUEST_TOKEN_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!s) {
    throw new Error("GUEST_TOKEN_SECRET(또는 NEXTAUTH_SECRET)이 설정되지 않았습니다.");
  }
  return s;
}

function sign(payloadB64: string): string {
  return createHmac("sha256", secret()).update(payloadB64).digest("base64url");
}

/** 게스트 토큰 발급. */
export function signGuestToken(memberId: string, meetingId: string): string {
  const payload: GuestPayload = { m: memberId, g: meetingId, iat: Date.now() };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${payloadB64}.${sign(payloadB64)}`;
}

/** 서명 + meetingId 일치 검증. 통과 시 memberId 반환, 아니면 null. */
export function verifyGuestToken(
  token: string,
  meetingId: string
): { memberId: string } | null {
  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return null;

  const expected = sign(payloadB64);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString()
    ) as GuestPayload;
    if (payload.g !== meetingId || !payload.m) return null;
    return { memberId: payload.m };
  } catch {
    return null;
  }
}

/** DB 저장용 토큰 해시 (meeting_members.guest_token_hash). */
export function hashGuestToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function guestCookieName(meetingId: string): string {
  return `${COOKIE_PREFIX}${meetingId}`;
}

/** 모임 범위 게스트 쿠키 발급. */
export async function setGuestCookie(
  meetingId: string,
  token: string
): Promise<void> {
  const store = await cookies();
  store.set(guestCookieName(meetingId), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SEC,
  });
}

/** 현재 요청의 게스트 쿠키 값. */
export async function readGuestCookie(
  meetingId: string
): Promise<string | null> {
  const store = await cookies();
  return store.get(guestCookieName(meetingId))?.value ?? null;
}

/** 게스트 쿠키 제거. */
export async function clearGuestCookie(meetingId: string): Promise<void> {
  const store = await cookies();
  store.delete(guestCookieName(meetingId));
}
