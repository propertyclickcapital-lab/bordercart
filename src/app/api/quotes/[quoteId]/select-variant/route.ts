import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;

  const { quoteId } = await params;
  const { selectedSize, selectedColor, selectedVariant } = await req.json();

  const quote = await prisma.quote.findUnique({ where: { id: quoteId } });
  if (!quote || quote.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.quote.update({
    where: { id: quoteId },
    data: {
      selectedSize: selectedSize ?? null,
      selectedColor: selectedColor ?? null,
      selectedVariant: selectedVariant ?? null,
    },
  });

  return NextResponse.json({ ok: true, quote: updated });
}
