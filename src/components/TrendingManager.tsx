"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";

type Item = {
  id?: string; title: string; imageUrl: string | null; priceUSD: number;
  store: string; sourceUrl: string; category: string | null;
  position: number; isActive: boolean;
};

const EMPTY: Item = { title: "", imageUrl: "", priceUSD: 0, store: "amazon", sourceUrl: "", category: null, position: 0, isActive: true };

export function TrendingManager({ initial }: { initial: Item[] }) {
  const [items, setItems] = useState<Item[]>(initial);
  const [draft, setDraft] = useState<Item>(EMPTY);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function add() {
    if (!draft.title || !draft.sourceUrl) return toast({ title: "Title and URL required", variant: "error" });
    setLoading(true);
    const r = await fetch("/api/admin/trending", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) });
    setLoading(false);
    if (r.ok) {
      const it = await r.json();
      setItems([...items, { ...it, priceUSD: Number(it.priceUSD) }]);
      setDraft(EMPTY);
      toast({ title: "Added", variant: "success" });
    }
  }

  async function toggle(id: string, isActive: boolean) {
    await fetch("/api/admin/trending", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, isActive }) });
    setItems(items.map((i) => (i.id === id ? { ...i, isActive } : i)));
  }

  async function remove(id: string) {
    await fetch(`/api/admin/trending?id=${id}`, { method: "DELETE" });
    setItems(items.filter((i) => i.id !== id));
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-[var(--border)] bg-white p-5">
        <h2 className="text-sm font-semibold">Add trending product</h2>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <Input placeholder="Title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          <Input placeholder="Source URL" value={draft.sourceUrl} onChange={(e) => setDraft({ ...draft, sourceUrl: e.target.value })} />
          <Input placeholder="Image URL" value={draft.imageUrl ?? ""} onChange={(e) => setDraft({ ...draft, imageUrl: e.target.value })} />
          <Input type="number" placeholder="Price USD" value={draft.priceUSD || ""} onChange={(e) => setDraft({ ...draft, priceUSD: parseFloat(e.target.value) || 0 })} />
          <Select value={draft.store} onChange={(e) => setDraft({ ...draft, store: e.target.value })}>
            {["amazon", "walmart", "target", "nike", "bestbuy", "other"].map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
          <Input type="number" placeholder="Position" value={draft.position || 0} onChange={(e) => setDraft({ ...draft, position: parseInt(e.target.value || "0", 10) })} />
        </div>
        <Button className="mt-3" variant="orange" onClick={add} disabled={loading}>{loading ? "Adding..." : "Add product"}</Button>
      </div>

      <div className="space-y-2">
        {items.map((i) => (
          <div key={i.id} className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-white p-3">
            <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded bg-[var(--bg)]">
              {i.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={i.imageUrl} alt="" className="h-full w-full object-contain p-1" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm truncate">{i.title}</p>
              <p className="text-xs text-[var(--ink-2)]">{i.store} · ${i.priceUSD} · pos {i.position}</p>
            </div>
            <label className="flex items-center gap-1 text-xs text-[var(--ink-2)]">
              <input type="checkbox" checked={i.isActive} onChange={(e) => i.id && toggle(i.id, e.target.checked)} /> Active
            </label>
            <Button size="sm" variant="outline" onClick={() => i.id && remove(i.id)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-[var(--ink-2)]">No trending products yet.</p>}
      </div>
    </div>
  );
}
