import { apiSuccess, handleRoute } from "@/lib/api-response";
import { randomNickname } from "@/lib/nickname";

// GET /api/v1/auth/nickname/random — 게스트 랜덤 닉네임 제안
export const GET = handleRoute(async () => {
  return apiSuccess({ nickname: randomNickname() });
});
