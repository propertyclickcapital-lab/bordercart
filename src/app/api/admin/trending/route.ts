import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function isAdmin(role?: string) { return role === "ADMIN"; }

export async function GET() {
  const s = await getServerSession(authOptions);
  if (!isAdmin(s?.user?.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const items = await prisma.trendingProduct.findMany({ orderBy: [{ position: "asc" }, { createdAt: "desc" }] });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const s = await getServerSession(authOptions);
  if (!isAdmin(s?.user?.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const item = await prisma.trendingProduct.create({
    data: {
      title: body.title,
      imageUrl: body.imageUrl || null,
      priceUSD: body.priceUSD || 0,
      store: body.store || "amazon",
      sourceUrl: body.sourceUrl,
      category: body.category || null,
      position: body.position ?? 0,
      isActive: body.isActive ?? true,
    },
  });
  return NextResponse.json(item);
}

export async function PATCH(req: Request) {
  const s = await getServerSession(authOptions);
  if (!isAdmin(s?.user?.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id, ...data } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const item = await prisma.trendingProduct.update({ where: { id }, data });
  return NextResponse.json(item);
}

export async function DELETE(req: Request) {
  const s = await getServerSession(authOptions);
  if (!isAdmin(s?.user?.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.trendingProduct.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
