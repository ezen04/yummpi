import Handlebars from 'handlebars';

const SOURCE = `<!DOCTYPE html>
<html lang="ko">
<body style="font-family: sans-serif; line-height: 1.6; color: #222;">
  <p>안녕하세요, <strong>{{nickname}}</strong>님</p>
  <p>
    <strong>{{meetingTitle}}</strong> 모임의 정산 금액
    <strong>{{amountFormatted}}원</strong>이 아직 미송금 상태입니다.
  </p>
  <p>빠른 시일 내에 송금해 주시면 감사하겠습니다.</p>
  <hr />
  <p style="font-size: 12px; color: #888;">본 메일은 발신 전용입니다. 문의는 얌피 앱 내 고객센터를 이용해 주세요.</p>
</body>
</html>`;

const compiled = Handlebars.compile(SOURCE);

export function renderPaymentReminderHtml(data: {
  nickname: string;
  meetingTitle: string;
  amount: number;
}): string {
  return compiled({
    nickname: data.nickname,
    meetingTitle: data.meetingTitle,
    amountFormatted: data.amount.toLocaleString('ko-KR'),
  });
}
