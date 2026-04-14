import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { storeName, storeUrl } = await req.json();
  if (!storeName || !storeUrl) return NextResponse.json({ error: "storeName and storeUrl required" }, { status: 400 });

  const req_ = await prisma.storeRequest.create({
    data: { userId: session.user.id, storeName, storeUrl },
  });
  return NextResponse.json(req_);
}
