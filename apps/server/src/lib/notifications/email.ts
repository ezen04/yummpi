import nodemailer from 'nodemailer';
import { renderNotificationHtml } from './templates/notification.js';

function createTransporter() {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  // MVP: 실제 발송 없이 JSON 직렬화 후 콘솔 출력
  return nodemailer.createTransport({ jsonTransport: true });
}

const transporter = createTransporter();

/** 범용 알림 이메일 (모든 카테고리 공용). 상대경로 url은 절대경로로 보정. */
export async function sendNotificationEmail(opts: {
  to: string;
  title: string;
  body: string;
  url?: string;
}): Promise<void> {
  const base = process.env.NEXTAUTH_URL ?? 'https://yummpi.com';
  const absoluteUrl = opts.url
    ? opts.url.startsWith('http')
      ? opts.url
      : `${base}${opts.url.startsWith('/') ? '' : '/'}${opts.url}`
    : undefined;
  const html = renderNotificationHtml({
    title: opts.title,
    body: opts.body,
    url: absoluteUrl,
  });
  const info = await transporter.sendMail({
    from: process.env.MAIL_FROM ?? '"얌피" <noreply@yummpi.com>',
    to: opts.to,
    subject: `[얌피] ${opts.title}`,
    html,
  });
  if (!process.env.SMTP_HOST) {
    console.log(
      '[email:mock]',
      (info as unknown as { message: string }).message
    );
  }
}
