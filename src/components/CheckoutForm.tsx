"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMXN } from "@/lib/utils/currency";
import { Gift } from "lucide-react";

type Addr = {
  id: string; label: string; street: string;
  exteriorNumber: string | null; interiorNumber: string | null;
  colonia: string | null; city: string; state: string; postalCode: string; isDefault: boolean;
};

export function CheckoutForm({ quoteId, addresses, totalMXN, creditMXN }: {
  quoteId: string; addresses: Addr[]; totalMXN: number; creditMXN: number;
}) {
  const [selected, setSelected] = useState<string | null>(addresses[0]?.id ?? null);
  const [newAddr, setNewAddr] = useState({ label: "Home", street: "", exteriorNumber: "", interiorNumber: "", colonia: "", city: "", state: "", postalCode: "" });
  const [adding, setAdding] = useState(addresses.length === 0);
  const [useCredit, setUseCredit] = useState(creditMXN > 0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const applied = useCredit ? Math.min(creditMXN, Math.max(0, totalMXN - 10)) : 0;
  const charged = Math.max(0, totalMXN - applied);

  async function submit() {
    setErr(null); setLoading(true);
    let addressId = selected;
    if (adding) {
      const res = await fetch("/api/addresses", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAddr),
      }).catch(() => null);
      if (res?.ok) { const a = await res.json(); addressId = a.id; }
    }
    const r = await fetch("/api/checkout", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quoteId, addressId, useCredit }),
    });
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      setErr(d.error || "Checkout failed"); setLoading(false); return;
    }
    const { url } = await r.json();
    if (url) window.location.href = url;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-semibold">Shipping Address</h2>
        {addresses.length > 0 && !adding && (
          <div className="mt-3 space-y-2">
            {addresses.map((a) => (
              <label key={a.id} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 ${selected === a.id ? "border-[var(--blue)] bg-[var(--blue-light)]" : "border-[var(--border)] bg-white"}`}>
                <input type="radio" checked={selected === a.id} onChange={() => setSelected(a.id)} className="mt-1 accent-[var(--blue)]" />
                <div>
                  <p className="font-medium">{a.label}</p>
                  <p className="text-sm text-[var(--ink-2)]">
                    {a.street}{a.exteriorNumber ? ` ${a.exteriorNumber}` : ""}{a.interiorNumber ? `, Int. ${a.interiorNumber}` : ""}
                    {a.colonia ? `, ${a.colonia}` : ""}, {a.city}, {a.state} {a.postalCode}
                  </p>
                </div>
              </label>
            ))}
            <button onClick={() => setAdding(true)} className="text-sm text-[var(--blue)] hover:underline">+ Add new address</button>
          </div>
        )}
        {adding && (
          <div className="mt-3 grid gap-3">
            <Input placeholder="Label (Home)" value={newAddr.label} onChange={(e) => setNewAddr({ ...newAddr, label: e.target.value })} />
            <Input placeholder="Street (Calle)" value={newAddr.street} onChange={(e) => setNewAddr({ ...newAddr, street: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Exterior #" value={newAddr.exteriorNumber} onChange={(e) => setNewAddr({ ...newAddr, exteriorNumber: e.target.value })} />
              <Input placeholder="Interior # (opt)" value={newAddr.interiorNumber} onChange={(e) => setNewAddr({ ...newAddr, interiorNumber: e.target.value })} />
            </div>
            <Input placeholder="Colonia" value={newAddr.colonia} onChange={(e) => setNewAddr({ ...newAddr, colonia: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="City" value={newAddr.city} onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })} />
              <Input placeholder="State" value={newAddr.state} onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })} />
            </div>
            <Input placeholder="Postal code" value={newAddr.postalCode} onChange={(e) => setNewAddr({ ...newAddr, postalCode: e.target.value })} />
            {addresses.length > 0 && (
              <button onClick={() => setAdding(false)} className="text-left text-sm text-[var(--ink-2)] hover:text-[var(--ink)]">Use saved address</button>
            )}
          </div>
        )}
      </div>

      {creditMXN > 0 && (
        <label className="flex items-start gap-3 rounded-lg border border-[var(--orange)]/30 bg-[var(--orange-light)] p-4 cursor-pointer">
          <input type="checkbox" checked={useCredit} onChange={(e) => setUseCredit(e.target.checked)} className="mt-1 accent-[var(--orange)]" />
          <div className="flex-1">
            <p className="font-medium flex items-center gap-1.5"><Gift className="h-4 w-4 text-[var(--orange)]" /> Apply BorderCart credit</p>
            <p className="text-sm text-[var(--ink-2)]">{formatMXN(creditMXN)} available · applying {formatMXN(applied)}</p>
          </div>
        </label>
      )}

      <div className="rounded-lg bg-[var(--bg)] p-4 space-y-1 text-sm">
        <div className="flex justify-between"><span className="text-[var(--ink-2)]">Subtotal</span><span>{formatMXN(totalMXN)}</span></div>
        {applied > 0 && <div className="flex justify-between text-[var(--success)]"><span>Credit</span><span>−{formatMXN(applied)}</span></div>}
        <div className="flex justify-between font-bold text-base pt-2 border-t border-[var(--border)]"><span>Total</span><span className="text-[var(--blue)]">{formatMXN(charged)}</span></div>
      </div>

      {err && <p className="text-sm text-[var(--danger)]">{err}</p>}
      <Button size="xl" variant="orange" className="w-full" onClick={submit} disabled={loading}>
        {loading ? "Preparing..." : "Pay Now"}
      </Button>
    </div>
  );
}
