import nodemailer from 'nodemailer';
import { renderPaymentReminderHtml } from './templates/paymentReminder.js';

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
    from: '"얌피" <noreply@yummpi.app>',
    to: opts.to,
    subject: `[얌피] 송금 독촉 알림 — ${opts.meetingTitle}`,
    html,
  });
  if (!process.env.SMTP_HOST) {
    console.log('[email:mock]', (info as unknown as { message: string }).message);
  }
}
