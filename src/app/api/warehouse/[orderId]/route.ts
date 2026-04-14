import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendOrderEmail } from "@/lib/notifications";

export async function PATCH(req: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const s = await getServerSession(authOptions);
  if (!s?.user || (s.user.role !== "WAREHOUSE_OPERATOR" && s.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { orderId } = await params;
  const body = await req.json();

  const pkg = await prisma.warehousePackage.upsert({
    where: { orderId },
    create: {
      orderId,
      trackingNumber: body.trackingNumber ?? null,
      carrier: body.carrier ?? null,
      receivedAt: body.receivedAt ? new Date(body.receivedAt) : null,
      weight: body.weight ?? null,
      dimensions: body.dimensions ?? null,
      notes: body.notes ?? null,
      forwardedAt: body.forwardedAt ? new Date(body.forwardedAt) : null,
      issueFlag: body.issueFlag ?? false,
      issueType: body.issueType ?? null,
      issueNote: body.issueNote ?? null,
      photoUrls: body.photoUrls ?? [],
    },
    update: {
      trackingNumber: body.trackingNumber,
      carrier: body.carrier,
      receivedAt: body.receivedAt ? new Date(body.receivedAt) : undefined,
      weight: body.weight,
      dimensions: body.dimensions,
      notes: body.notes,
      forwardedAt: body.forwardedAt ? new Date(body.forwardedAt) : undefined,
      issueFlag: body.issueFlag,
      issueType: body.issueType,
      issueNote: body.issueNote,
      photoUrls: body.photoUrls,
    },
  });

  if (body.status) {
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const o = await tx.order.update({
        where: { id: orderId },
        data: {
          status: body.status,
          ...(body.trackingNumberMX !== undefined ? { trackingNumberMX: body.trackingNumberMX } : {}),
          ...(body.carrierMX !== undefined ? { carrierMX: body.carrierMX } : {}),
        },
      });
      await tx.orderStatusHistory.create({
        data: { orderId, status: body.status, changedBy: s.user.id, note: body.note },
      });
      return o;
    });
    sendOrderEmail(updatedOrder.userId, updatedOrder.id, body.status).catch(() => {});
  }

  return NextResponse.json(pkg);
}
