"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar } from "recharts";
import { formatMXN } from "@/lib/utils/currency";

type A = {
  totalOrders: number; revenueMXN: number; totalUsers: number; pendingWarehouse: number;
  topStores: Array<{ store: string; _count: number }>;
  timeseries: Array<{ date: string; orders: number; revenue: number }>;
};

export function AnalyticsView() {
  const [data, setData] = useState<A | null>(null);
  useEffect(() => { fetch("/api/admin/analytics").then((r) => r.json()).then(setData).catch(() => {}); }, []);
  if (!data) return <div className="h-64 shimmer rounded-lg" />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Revenue" value={formatMXN(data.revenueMXN)} />
        <Stat label="Orders" value={data.totalOrders.toString()} />
        <Stat label="Users" value={data.totalUsers.toString()} />
        <Stat label="Pending warehouse" value={data.pendingWarehouse.toString()} />
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-white p-5">
        <h2 className="text-sm font-semibold mb-3">Orders (last 30 days)</h2>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.timeseries}>
              <CartesianGrid stroke="#eaeaea" strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke="#888" fontSize={11} />
              <YAxis stroke="#888" fontSize={11} />
              <Tooltip />
              <Line type="monotone" dataKey="orders" stroke="#0071ce" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-white p-5">
        <h2 className="text-sm font-semibold mb-3">Revenue MXN (last 30 days)</h2>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.timeseries}>
              <CartesianGrid stroke="#eaeaea" strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke="#888" fontSize={11} />
              <YAxis stroke="#888" fontSize={11} />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="#ff6900" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-white p-5">
        <h2 className="text-sm font-semibold mb-3">Top stores by product count</h2>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.topStores.map((s) => ({ store: s.store, count: s._count }))}>
              <CartesianGrid stroke="#eaeaea" strokeDasharray="3 3" />
              <XAxis dataKey="store" stroke="#888" fontSize={11} />
              <YAxis stroke="#888" fontSize={11} />
              <Tooltip />
              <Bar dataKey="count" fill="#0071ce" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-white p-5">
      <p className="text-xs uppercase tracking-wider text-[var(--ink-2)]">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
