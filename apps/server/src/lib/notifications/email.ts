import nodemailer from 'nodemailer';
import { renderPaymentReminderHtml } from './templates/paymentReminder.js';
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

export async function sendPaymentReminderEmail(opts: {
  to: string;
  nickname: string;
  meetingTitle: string;
  amount: number;
}): Promise<void> {
  const html = renderPaymentReminderHtml(opts);
  const info = await transporter.sendMail({
    from: process.env.MAIL_FROM ?? '"얌피" <noreply@yummpi.app>',
    to: opts.to,
    subject: `[얌피] 송금 독촉 알림 — ${opts.meetingTitle}`,
    html,
  });
  if (!process.env.SMTP_HOST) {
    console.log(
      '[email:mock]',
      (info as unknown as { message: string }).message
    );
  }
}

/** 범용 알림 이메일 (송금 독촉 외 카테고리도 재사용). 상대경로 url은 절대경로로 보정. */
export async function sendNotificationEmail(opts: {
  to: string;
  title: string;
  body: string;
  url?: string;
}): Promise<void> {
  const base = process.env.NEXTAUTH_URL ?? 'https://yummpi.app';
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
    from: process.env.MAIL_FROM ?? '"얌피" <noreply@yummpi.app>',
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
