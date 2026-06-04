import { z } from 'zod';

export const voteValue = z.enum(['UP', 'DOWN', 'RANK']);
export type VoteValue = z.infer<typeof voteValue>;

/** F3. 투표 캐스팅 (Socket.io 페이로드) */
export const castVoteSchema = z.object({
  meetingId: z.string().uuid(),
  placeId: z.string(),
  value: voteValue,
  rank: z.number().int().min(1).optional(),
  anonymous: z.boolean().default(true),
});
export type CastVoteInput = z.infer<typeof castVoteSchema>;

/** 실시간 집계 브로드캐스트 페이로드 */
export const voteTallySchema = z.object({
  meetingId: z.string().uuid(),
  tallies: z.array(
    z.object({
      placeId: z.string(),
      up: z.number().int(),
      down: z.number().int(),
      score: z.number(),
    }),
  ),
  updatedAt: z.string().datetime(),
});
export type VoteTally = z.infer<typeof voteTallySchema>;

/** Socket.io 이벤트 이름 — FE·BE 공유 */
export const SOCKET_EVENTS = {
  JOIN_ROOM: 'vote:join',
  CAST: 'vote:cast',
  TALLY: 'vote:tally',
  CLOSED: 'vote:closed',
  CONFIRMED: 'place:confirmed',
} as const;
