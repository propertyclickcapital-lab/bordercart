import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const s = await getServerSession(authOptions);
  if (!s?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const prefs = await prisma.notificationPreference.upsert({
    where: { userId: s.user.id }, create: { userId: s.user.id }, update: {},
  });
  return NextResponse.json(prefs);
}

export async function PATCH(req: Request) {
  const s = await getServerSession(authOptions);
  if (!s?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const prefs = await prisma.notificationPreference.upsert({
    where: { userId: s.user.id },
    create: {
      userId: s.user.id,
      emailOrders: body.emailOrders ?? true,
      emailMarketing: body.emailMarketing ?? false,
      smsOrders: body.smsOrders ?? false,
    },
    update: { emailOrders: body.emailOrders, emailMarketing: body.emailMarketing, smsOrders: body.smsOrders },
  });
  return NextResponse.json(prefs);
}
