import { prisma } from "@/lib/prisma";
import { TierBadge } from "@/components/TierBadge";
import { formatMXN } from "@/lib/utils/currency";
import { format } from "date-fns";

export default async function AdminUsers() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { tierStatus: true, _count: { select: { orders: true } } },
    take: 300,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Users</h1>
      <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--bg)] text-[var(--ink-2)]">
              <tr className="text-left">
                <th className="px-4 py-3 font-semibold">User</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Tier</th>
                <th className="px-4 py-3 font-semibold">Orders</th>
                <th className="px-4 py-3 font-semibold">Spent</th>
                <th className="px-4 py-3 font-semibold">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-[var(--border-soft)] hover:bg-[var(--bg)]">
                  <td className="px-4 py-3">
                    <p className="font-medium">{u.name || u.email}</p>
                    <p className="text-xs text-[var(--ink-2)]">{u.email}</p>
                  </td>
                  <td className="px-4 py-3 text-[var(--ink-2)]">{u.role}</td>
                  <td className="px-4 py-3"><TierBadge tier={u.tier} /></td>
                  <td className="px-4 py-3">{u._count.orders}</td>
                  <td className="px-4 py-3 font-semibold">{formatMXN(Number(u.tierStatus?.totalSpendMXN ?? 0))}</td>
                  <td className="px-4 py-3 text-[var(--ink-2)]">{format(new Date(u.createdAt), "MMM d, yyyy")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
