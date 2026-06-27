import Handlebars from 'handlebars';

const SOURCE = `<!DOCTYPE html>
<html lang="ko">
<body style="font-family: sans-serif; line-height: 1.6; color: #222;">
  <p style="font-size: 16px;"><strong>{{title}}</strong></p>
  <p>{{body}}</p>
  {{#if url}}
  <p><a href="{{url}}" style="color: #e94b35;">얌피에서 확인하기</a></p>
  {{/if}}
  <hr />
  <p style="font-size: 12px; color: #888;">본 메일은 발신 전용입니다. 문의는 얌피 앱 내 고객센터를 이용해 주세요.</p>
</body>
</html>`;

const compiled = Handlebars.compile(SOURCE);

export function renderNotificationHtml(data: {
  title: string;
  body: string;
  url?: string;
}): string {
  return compiled({ title: data.title, body: data.body, url: data.url });
}
