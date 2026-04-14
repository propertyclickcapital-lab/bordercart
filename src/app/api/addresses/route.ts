import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const s = await getServerSession(authOptions);
  if (!s?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const addresses = await prisma.address.findMany({
    where: { userId: s.user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(addresses);
}

export async function POST(req: Request) {
  const s = await getServerSession(authOptions);
  if (!s?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const existing = await prisma.address.count({ where: { userId: s.user.id } });
  const addr = await prisma.address.create({
    data: {
      userId: s.user.id,
      label: body.label || "Home",
      street: body.street || "",
      exteriorNumber: body.exteriorNumber || null,
      interiorNumber: body.interiorNumber || null,
      colonia: body.colonia || null,
      city: body.city || "",
      state: body.state || "",
      postalCode: body.postalCode || "",
      country: "MX",
      isDefault: existing === 0,
    },
  });
  return NextResponse.json(addr);
}
