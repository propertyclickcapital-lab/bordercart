"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { AlertTriangle } from "lucide-react";

type Pkg = {
  trackingNumber: string | null;
  carrier: string | null;
  weight: number | null;
  dimensions: any;
  notes: string | null;
  issueType: string | null;
};

const ISSUE_TYPES = ["Wrong item", "Damaged in transit", "Missing parts", "Lost package", "Other"];

export function WarehouseDetailForm({ orderId, pkg }: { orderId: string; pkg: Pkg | null }) {
  const [tracking, setTracking] = useState(pkg?.trackingNumber ?? "");
  const [carrier, setCarrier] = useState(pkg?.carrier ?? "");
  const [weight, setWeight] = useState(pkg?.weight?.toString() ?? "");
  const [L, setL] = useState(pkg?.dimensions?.L?.toString() ?? "");
  const [W, setW] = useState(pkg?.dimensions?.W?.toString() ?? "");
  const [H, setH] = useState(pkg?.dimensions?.H?.toString() ?? "");
  const [notes, setNotes] = useState(pkg?.notes ?? "");
  const [mxTracking, setMxTracking] = useState("");
  const [mxCarrier, setMxCarrier] = useState("");
  const [issueType, setIssueType] = useState(pkg?.issueType ?? ISSUE_TYPES[0]);
  const [loading, setLoading] = useState<string | null>(null);

  async function save(next?: string, issueFlag?: boolean) {
    setLoading(next || "save");
    await fetch(`/api/warehouse/${orderId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trackingNumber: tracking || null,
        carrier: carrier || null,
        weight: weight ? parseFloat(weight) : null,
        dimensions: (L || W || H) ? { L: parseFloat(L) || 0, W: parseFloat(W) || 0, H: parseFloat(H) || 0 } : null,
        notes: notes || null,
        issueFlag: issueFlag ?? undefined,
        issueType: issueFlag ? issueType : undefined,
        status: next,
        trackingNumberMX: mxTracking || undefined,
        carrierMX: mxCarrier || undefined,
      }),
    });
    setLoading(null);
    if (next) location.href = "/warehouse";
    else location.reload();
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-[var(--border)] bg-white p-5 space-y-3">
        <h2 className="text-sm font-semibold">Package details</h2>
        <Input placeholder="U.S. tracking #" value={tracking} onChange={(e) => setTracking(e.target.value)} />
        <Input placeholder="Carrier (USPS, UPS, FedEx, DHL)" value={carrier} onChange={(e) => setCarrier(e.target.value)} />
        <Input type="number" placeholder="Weight (lb)" value={weight} onChange={(e) => setWeight(e.target.value)} />
        <div className="grid grid-cols-3 gap-2">
          <Input type="number" placeholder="L" value={L} onChange={(e) => setL(e.target.value)} />
          <Input type="number" placeholder="W" value={W} onChange={(e) => setW(e.target.value)} />
          <Input type="number" placeholder="H" value={H} onChange={(e) => setH(e.target.value)} />
        </div>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Notes" className="w-full rounded-lg border border-[var(--border)] bg-white p-3 text-sm" />
        <div className="rounded-md border border-dashed border-[var(--border)] p-4 text-center text-sm text-[var(--ink-2)]">Photo upload — coming soon</div>
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-white p-5 space-y-3">
        <h2 className="text-sm font-semibold">Forward to Mexico</h2>
        <Input placeholder="MX tracking #" value={mxTracking} onChange={(e) => setMxTracking(e.target.value)} />
        <Select value={mxCarrier} onChange={(e) => setMxCarrier(e.target.value)}>
          <option value="">MX carrier…</option>
          {["DHL MX", "Estafeta", "FedEx MX", "Paquetexpress", "99 Minutos"].map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" onClick={() => save()} disabled={loading !== null}>{loading === "save" ? "Saving..." : "Save"}</Button>
        <Button onClick={() => save("forwarded_to_mexico")} disabled={loading !== null || !mxTracking}>
          {loading === "forwarded_to_mexico" ? "..." : "Forward to Mexico"}
        </Button>
      </div>

      <div className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-3">
        <div className="flex items-center gap-2 text-[var(--danger)]"><AlertTriangle className="h-4 w-4" /> Flag an issue</div>
        <Select value={issueType} onChange={(e) => setIssueType(e.target.value)}>
          {ISSUE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </Select>
        <Button variant="danger" className="w-full" onClick={() => save("issue_flagged", true)} disabled={loading !== null}>
          {loading === "issue_flagged" ? "..." : "Flag issue"}
        </Button>
      </div>
    </div>
  );
}
