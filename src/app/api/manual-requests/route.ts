import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const s = await getServerSession(authOptions);
  if (!s?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { sourceUrl, whatsappNumber } = await req.json();
  if (!sourceUrl) return NextResponse.json({ error: "sourceUrl required" }, { status: 400 });
  const r = await prisma.manualRequest.create({
    data: { userId: s.user.id, sourceUrl, whatsappNumber: whatsappNumber || null },
  });
  return NextResponse.json(r);
}
