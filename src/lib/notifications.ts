import nodemailer from "nodemailer";
import axios from "axios";
import { prisma } from "./prisma";

const smtpConfigured =
  !!process.env.SMTP_HOST &&
  process.env.SMTP_HOST !== "placeholder" &&
  !!process.env.SMTP_USER &&
  process.env.SMTP_USER !== "placeholder";

const twilioConfigured =
  !!process.env.TWILIO_ACCOUNT_SID &&
  process.env.TWILIO_ACCOUNT_SID !== "placeholder" &&
  !!process.env.TWILIO_AUTH_TOKEN &&
  process.env.TWILIO_AUTH_TOKEN !== "placeholder";

const transporter = smtpConfigured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587", 10),
      secure: process.env.SMTP_PORT === "465",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  : null;

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (!transporter) {
    console.warn(`[email] SMTP not configured, skipping send to ${to}: ${subject}`);
    return { skipped: true };
  }
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || "BorderCart <hello@bordercart.com>",
      to, subject, html,
    });
    return { messageId: info.messageId };
  } catch (err) {
    console.error("[email] send failed", err);
    return { error: String(err) };
  }
}

export async function sendWhatsAppMessage(to: string, message: string) {
  if (!twilioConfigured) {
    console.warn(`[whatsapp] Twilio not configured, skipping send to ${to}: ${message}`);
    return { skipped: true };
  }
  try {
    const sid = process.env.TWILIO_ACCOUNT_SID!;
    const token = process.env.TWILIO_AUTH_TOKEN!;
    const from = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886";
    const body = new URLSearchParams({
      From: from,
      To: `whatsapp:${to.replace(/[^\d+]/g, "")}`,
      Body: message,
    });
    const { data } = await axios.post(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      body.toString(),
      {
        auth: { username: sid, password: token },
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );
    return { sid: data?.sid };
  } catch (err) {
    console.error("[whatsapp] send failed", err);
    return { error: String(err) };
  }
}

export const STATUS_EMAIL: Record<string, { subject: string; heading: string; body: string }> = {
  awaiting_payment: {
    subject: "Your BorderCart order — complete payment",
    heading: "Your order is confirmed — complete payment",
    body: "We're holding your quote. Complete payment to lock in your price.",
  },
  purchased_from_store: {
    subject: "Great news — we purchased your item!",
    heading: "We just purchased your item",
    body: "Our team placed the order with the U.S. store. Next stop: our San Diego warehouse.",
  },
  received_at_warehouse: {
    subject: "Your package arrived at our warehouse",
    heading: "Package received at the San Diego warehouse",
    body: "We checked it in and it's ready to be forwarded to Mexico.",
  },
  forwarded_to_mexico: {
    subject: "Your order is on its way to Mexico 🇲🇽",
    heading: "Your order is on its way to Mexico",
    body: "Your package crossed the border and is heading to your door.",
  },
  delivered: {
    subject: "Your order has been delivered! 🎉",
    heading: "Delivered! 🎉",
    body: "Your BorderCart order just arrived. We hope you love it.",
  },
};

export function renderOrderEmail({
  customerName, productTitle, productImageUrl, orderId, statusLabel, body, trackingUrl,
}: {
  customerName: string | null;
  productTitle: string;
  productImageUrl: string | null;
  orderId: string;
  statusLabel: string;
  body: string;
  trackingUrl: string;
}): string {
  return `
<!DOCTYPE html>
<html><head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f8f9fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,Arial,sans-serif;color:#0f1111;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #dddddd;border-radius:8px;overflow:hidden;">
        <tr><td style="background:#131921;padding:18px 24px;color:#ffffff;font-size:18px;font-weight:700;">BorderCart 🇲🇽🇺🇸</td></tr>
        <tr><td style="padding:24px;">
          <h1 style="font-size:22px;margin:0 0 8px 0;">${statusLabel}</h1>
          <p style="margin:0 0 8px 0;color:#565959;font-size:15px;">Hi ${customerName || "there"},</p>
          <p style="margin:0 0 16px 0;font-size:15px;line-height:1.5;">${body}</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;border-radius:8px;margin:12px 0;">
            <tr>
              ${productImageUrl ? `<td width="80" style="padding:16px;"><img src="${productImageUrl}" width="64" style="display:block;border-radius:4px;" alt="" /></td>` : ""}
              <td style="padding:16px;">
                <div style="font-size:12px;color:#565959;text-transform:uppercase;letter-spacing:0.05em;">Order #${orderId.slice(-6).toUpperCase()}</div>
                <div style="font-size:15px;font-weight:600;margin-top:4px;">${productTitle}</div>
              </td>
            </tr>
          </table>
          <a href="${trackingUrl}" style="display:inline-block;background:#0071ce;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Track your order</a>
        </td></tr>
        <tr><td style="background:#f8f9fa;padding:16px 24px;border-top:1px solid #dddddd;color:#565959;font-size:12px;text-align:center;">
          © ${new Date().getFullYear()} BorderCart · Cross-border shopping, simplified.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export async function sendOrderEmail(userId: string, orderId: string, status: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: { include: { notificationPrefs: true } } },
  });
  if (!order || order.user.notificationPrefs?.emailOrders === false) return;
  const tpl = STATUS_EMAIL[status];
  if (!tpl || !order.user.email) return;
  const origin = process.env.NEXT_PUBLIC_APP_URL || "";
  const html = renderOrderEmail({
    customerName: order.user.name,
    productTitle: order.productTitle,
    productImageUrl: order.productImageUrl,
    orderId: order.id,
    statusLabel: tpl.heading,
    body: tpl.body,
    trackingUrl: `${origin}/orders/${order.id}`,
  });
  await sendEmail({ to: order.user.email, subject: tpl.subject, html });
}
