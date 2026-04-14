import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail, sendWhatsAppMessage, renderOrderEmail } from "@/lib/notifications";
import { formatMXN } from "@/lib/utils/currency";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;

  const { quoteId, addressId, useCredit, confirmationImage } = await req.json();
  if (!quoteId) return NextResponse.json({ error: "quoteId required" }, { status: 400 });
  if (!confirmationImage || typeof confirmationImage !== "string") {
    return NextResponse.json({ error: "Confirmation image required" }, { status: 400 });
  }
  if (!confirmationImage.startsWith("data:")) {
    return NextResponse.json({ error: "Invalid image format" }, { status: 400 });
  }
  if (confirmationImage.length > Math.round(MAX_IMAGE_BYTES * 1.4)) {
    return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
  }

  const [quote, user] = await Promise.all([
    prisma.quote.findUnique({ where: { id: quoteId }, include: { product: true } }),
    prisma.user.findUnique({ where: { id: userId } }),
  ]);
  if (!quote || !user || quote.userId !== userId) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (quote.expiresAt.getTime() < Date.now()) return NextResponse.json({ error: "Quote expired" }, { status: 400 });

  const existing = await prisma.order.findUnique({ where: { quoteId } });
  if (existing && existing.status !== "awaiting_payment") {
    return NextResponse.json({ error: "Order already processed" }, { status: 409 });
  }

  const totalMXN = Number(quote.totalMXN);
  const creditAvailable = Number(user.creditMXN);
  const creditApplied = useCredit ? Math.min(creditAvailable, Math.max(0, totalMXN - 10)) : 0;
  const chargedMXN = Math.max(0, totalMXN - creditApplied);

  const order = existing
    ? await prisma.order.update({
        where: { id: existing.id },
        data: { addressId: addressId || existing.addressId, totalPaidMXN: chargedMXN, creditAppliedMXN: creditApplied },
      })
    : await prisma.order.create({
        data: {
          userId, quoteId: quote.id, addressId: addressId || null,
          status: "awaiting_payment",
          productTitle: quote.product.title,
          productImageUrl: quote.product.imageUrl,
          totalPaidMXN: chargedMXN,
          creditAppliedMXN: creditApplied,
          statusHistory: { create: { status: "awaiting_payment", changedBy: userId, note: "Manual transfer submitted" } },
        },
      });

  await prisma.payment.upsert({
    where: { orderId: order.id },
    create: {
      userId, orderId: order.id,
      status: "pending",
      amountMXN: chargedMXN,
      creditApplied,
      method: "manual_transfer",
      confirmationImageUrl: confirmationImage,
    },
    update: {
      status: "pending",
      method: "manual_transfer",
      confirmationImageUrl: confirmationImage,
      rejectionNote: null,
    },
  });

  const origin = process.env.NEXT_PUBLIC_APP_URL || "";
  const amountStr = formatMXN(chargedMXN);

  // Buyer confirmation email
  if (user.email) {
    const html = renderOrderEmail({
      customerName: user.name,
      productTitle: order.productTitle,
      productImageUrl: order.productImageUrl,
      orderId: order.id,
      statusLabel: "Recibimos tu comprobante",
      body: `Confirmaremos tu pago en 1-2 horas y activaremos tu pedido. Gracias por usar BorderCart.`,
      trackingUrl: `${origin}/orders/${order.id}`,
    });
    sendEmail({ to: user.email, subject: "Recibimos tu comprobante — verificando tu pago", html }).catch(() => {});
  }

  // Admin alerts
  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail) {
    const adminHtml = `
<div style="font-family:Inter,sans-serif;max-width:600px;margin:24px auto;border:1px solid #ddd;border-radius:8px;padding:24px;background:#fff;">
  <h2 style="margin:0 0 8px 0;">New manual transfer</h2>
  <p style="color:#565959;margin:0 0 16px 0;">Order #${order.id.slice(-6).toUpperCase()} · ${amountStr}</p>
  <p><b>Buyer:</b> ${user.name || "—"} (${user.email})</p>
  <p><b>Product:</b> ${order.productTitle}</p>
  <p><b>Amount:</b> ${amountStr}</p>
  <p style="margin-top:16px;"><a href="${origin}/admin/orders/${order.id}" style="background:#0071ce;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">Verify in admin →</a></p>
</div>`;
    sendEmail({
      to: adminEmail,
      subject: `New manual transfer — Order ${order.id.slice(-6).toUpperCase()} — ${amountStr} — ${user.name || user.email}`,
      html: adminHtml,
    }).catch(() => {});
  }

  const adminWa = process.env.ADMIN_WHATSAPP;
  if (adminWa) {
    sendWhatsAppMessage(
      adminWa,
      `💰 Nueva transferencia recibida. Orden ${order.id.slice(-6).toUpperCase()} — ${amountStr} — ${user.name || user.email}. Verificar comprobante en admin.`
    ).catch(() => {});
  }

  return NextResponse.json({ success: true, orderId: order.id });
}
