import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
import { sendOrderEmail } from "@/lib/notifications";

export async function PATCH(req: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role === "CUSTOMER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { orderId } = await params;
  const { status, note, trackingNumberUS, trackingNumberMX, carrierUS, carrierMX, adminNotes } = await req.json();

  if (status && !Object.values(OrderStatus).includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const order = await tx.order.update({
      where: { id: orderId },
      data: {
        ...(status ? { status } : {}),
        ...(trackingNumberUS !== undefined ? { trackingNumberUS } : {}),
        ...(trackingNumberMX !== undefined ? { trackingNumberMX } : {}),
        ...(carrierUS !== undefined ? { carrierUS } : {}),
        ...(carrierMX !== undefined ? { carrierMX } : {}),
        ...(adminNotes !== undefined ? { adminNotes } : {}),
      },
    });
    if (status) {
      await tx.orderStatusHistory.create({
        data: { orderId, status, note: note || null, changedBy: session.user.id },
      });
    }
    return order;
  });

  if (status) {
    sendOrderEmail(updated.userId, updated.id, status).catch(() => {});
  }

  return NextResponse.json(updated);
}
