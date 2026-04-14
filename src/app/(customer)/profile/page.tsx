import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { TierProgress } from "@/components/TierProgress";
import { TierBadge } from "@/components/TierBadge";
import { formatMXN } from "@/lib/utils/currency";
import { MapPin } from "lucide-react";
import { ReferralCard } from "@/components/ReferralCard";
import { NotificationPrefsCard } from "@/components/NotificationPrefsCard";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { tierStatus: true, addresses: { orderBy: [{ isDefault: "desc" }] } },
  });
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="rounded-lg border border-[var(--border)] bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--blue-light)] text-[var(--blue)] text-xl font-bold">
            {(user.name || user.email)[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{user.name || user.email.split("@")[0]}</h1>
            <p className="text-sm text-[var(--ink-2)]">{user.email}{user.phone ? ` · ${user.phone}` : ""}</p>
            <div className="mt-1"><TierBadge tier={user.tier} /></div>
          </div>
        </div>
      </div>

      <TierProgress
        tier={user.tier}
        orderCount={user.tierStatus?.orderCount ?? 0}
        totalSpendMXN={Number(user.tierStatus?.totalSpendMXN ?? 0)}
      />

      <div className="grid grid-cols-2 gap-4">
        <Stat label="Total orders" value={(user.tierStatus?.orderCount ?? 0).toString()} />
        <Stat label="Total spent" value={formatMXN(Number(user.tierStatus?.totalSpendMXN ?? 0))} />
      </div>

      <ReferralCard />
      <NotificationPrefsCard />

      <div>
        <h2 className="text-sm font-semibold mb-3">Addresses</h2>
        {user.addresses.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[var(--border)] bg-white p-6 text-center text-[var(--ink-2)]">
            No addresses saved yet.
          </div>
        ) : (
          <div className="space-y-3">
            {user.addresses.map((a) => (
              <div key={a.id} className="rounded-lg border border-[var(--border)] bg-white p-4 flex items-start gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-[var(--blue-light)] text-[var(--blue)]">
                  <MapPin className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{a.label} {a.isDefault ? <span className="ml-2 text-xs text-[var(--blue)]">Default</span> : null}</p>
                  <p className="mt-0.5 text-sm text-[var(--ink-2)]">
                    {a.street}{a.exteriorNumber ? ` ${a.exteriorNumber}` : ""}{a.interiorNumber ? `, Int. ${a.interiorNumber}` : ""}
                    {a.colonia ? `, ${a.colonia}` : ""}, {a.city}, {a.state} {a.postalCode}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-white p-5 shadow-sm">
      <p className="text-xs uppercase tracking-wider text-[var(--ink-2)]">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
