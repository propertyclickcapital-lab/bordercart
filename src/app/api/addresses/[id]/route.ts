import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = await getServerSession(authOptions);
  if (!s?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const addr = await prisma.address.findUnique({ where: { id } });
  if (!addr || addr.userId !== s.user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json();
  if (body.isDefault) {
    await prisma.address.updateMany({ where: { userId: s.user.id }, data: { isDefault: false } });
  }
  const updated = await prisma.address.update({ where: { id }, data: body });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = await getServerSession(authOptions);
  if (!s?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const addr = await prisma.address.findUnique({ where: { id } });
  if (!addr || addr.userId !== s.user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.address.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
