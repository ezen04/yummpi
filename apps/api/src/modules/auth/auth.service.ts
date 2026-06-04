import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/prisma.service';
import { guestJoinSchema, type GuestJoinInput } from '@gatherflow/shared';

// OWNER ① — 게스트 닉네임 입장 = Credentials. 호스트는 이메일/비번.
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async guestJoin(input: GuestJoinInput) {
    const data = guestJoinSchema.parse(input); // 공용 Zod 검증
    // TODO(①): Membership 생성 → JWT 발급
    return { token: this.jwt.sign({ nickname: data.nickname, role: 'GUEST' }) };
  }
}
