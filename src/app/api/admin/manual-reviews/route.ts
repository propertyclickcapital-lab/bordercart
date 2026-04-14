import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const s = await getServerSession(authOptions);
  if (!s?.user || s.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const items = await prisma.manualRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { email: true, name: true } } },
    take: 200,
  });
  return NextResponse.json(items);
}

export async function PATCH(req: Request) {
  const s = await getServerSession(authOptions);
  if (!s?.user || s.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id, status, adminNote, quotedPriceMXN } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const updated = await prisma.manualRequest.update({
    where: { id },
    data: {
      ...(status ? { status } : {}),
      ...(adminNote !== undefined ? { adminNote } : {}),
      ...(quotedPriceMXN !== undefined ? { quotedPriceMXN } : {}),
    },
  });
  return NextResponse.json(updated);
}
