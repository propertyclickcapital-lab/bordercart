"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

type StoreData = {
  registry: Array<{ key: string; name: string; domain: string; category: string; supported?: boolean }>;
  statsByStore: Record<string, { success: number; fail: number }>;
  storeRequests: Array<{ id: string; storeName: string; storeUrl: string; status: string; createdAt: string; user: { email: string } }>;
};

export function StoresView() {
  const [data, setData] = useState<StoreData | null>(null);
  useEffect(() => { fetch("/api/admin/stores").then((r) => r.json()).then(setData).catch(() => {}); }, []);
  if (!data) return <div className="h-64 shimmer rounded-lg" />;

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-sm font-semibold mb-3">Store registry · scraping success (last 7 days)</h2>
        <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[var(--bg)] text-[var(--ink-2)]">
                <tr className="text-left">
                  <th className="px-4 py-3 font-semibold">Store</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Domain</th>
                  <th className="px-4 py-3 font-semibold">Supported</th>
                  <th className="px-4 py-3 font-semibold">Success</th>
                  <th className="px-4 py-3 font-semibold">Fail</th>
                </tr>
              </thead>
              <tbody>
                {data.registry.map((s) => {
                  const stats = data.statsByStore[s.key] || { success: 0, fail: 0 };
                  return (
                    <tr key={s.key} className="border-t border-[var(--border-soft)]">
                      <td className="px-4 py-2 font-medium">{s.name}</td>
                      <td className="px-4 py-2 text-[var(--ink-2)]">{s.category}</td>
                      <td className="px-4 py-2 text-[var(--ink-2)]">{s.domain}</td>
                      <td className="px-4 py-2">{s.supported ? <Badge variant="success">Yes</Badge> : <Badge variant="default">Generic</Badge>}</td>
                      <td className="px-4 py-2 text-[var(--success)] font-semibold">{stats.success}</td>
                      <td className="px-4 py-2 text-[var(--danger)] font-semibold">{stats.fail}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold mb-3">Customer store requests</h2>
        {data.storeRequests.length === 0 ? (
          <p className="text-sm text-[var(--ink-2)]">No store requests yet.</p>
        ) : (
          <div className="rounded-lg border border-[var(--border)] bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--bg)] text-[var(--ink-2)]">
                <tr className="text-left"><th className="px-4 py-3">Store</th><th className="px-4 py-3">URL</th><th className="px-4 py-3">User</th><th className="px-4 py-3">Status</th></tr>
              </thead>
              <tbody>
                {data.storeRequests.map((r) => (
                  <tr key={r.id} className="border-t border-[var(--border-soft)]">
                    <td className="px-4 py-2 font-medium">{r.storeName}</td>
                    <td className="px-4 py-2 text-[var(--ink-2)] truncate max-w-md">{r.storeUrl}</td>
                    <td className="px-4 py-2 text-[var(--ink-2)]">{r.user.email}</td>
                    <td className="px-4 py-2"><Badge variant="info">{r.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
