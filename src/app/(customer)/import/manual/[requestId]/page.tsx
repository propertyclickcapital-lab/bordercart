import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { ManualReviewScreen } from "@/components/ManualReviewScreen";

export default async function ManualReviewPage({ params }: { params: Promise<{ requestId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const { requestId } = await params;
  const req = await prisma.manualRequest.findUnique({ where: { id: requestId } });
  if (!req || req.userId !== session.user.id) notFound();
  return <ManualReviewScreen requestId={req.id} sourceUrl={req.sourceUrl} initialPhone={req.whatsappNumber} />;
}
