"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { formatMXN, formatUSD } from "@/lib/utils/currency";
import { useRouter } from "next/navigation";

export function AdminManualQuoteBuilder({
  manualRequestId, sourceUrl, userEmail, userTier, fxRate, defaultTakeRate, alreadySent,
}: {
  manualRequestId: string;
  sourceUrl: string;
  userEmail: string;
  userTier: string;
  fxRate: number;
  defaultTakeRate: number;
  alreadySent: boolean;
}) {
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [store, setStore] = useState(new URL(sourceUrl).hostname.replace(/^www\./, ""));
  const [productCostUSD, setProductCost] = useState("");
  const [shippingSd, setShipSd] = useState("12");
  const [shippingMx, setShipMx] = useState("18");
  const [customsPct, setCustoms] = useState("5");
  const [handling, setHandling] = useState("3.5");
  const [takePct, setTake] = useState((defaultTakeRate * 100).toFixed(1));
  const [fx, setFx] = useState(fxRate.toFixed(4));
  const [adminNote, setAdminNote] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const breakdown = useMemo(() => {
    const p = parseFloat(productCostUSD) || 0;
    const ssd = parseFloat(shippingSd) || 0;
    const smx = parseFloat(shippingMx) || 0;
    const cpct = (parseFloat(customsPct) || 0) / 100;
    const hnd = parseFloat(handling) || 0;
    const tpct = (parseFloat(takePct) || 0) / 100;
    const r = parseFloat(fx) || 1;

    const productMXN = p * r;
    const shippingUsUSD = ssd;
    const shippingMxUSD = smx;
    const shippingUsMXN = shippingUsUSD * r;
    const shippingMxMXN = shippingMxUSD * r;
    const handlingMXN = hnd * r;
    const subtotalMXN = productMXN + shippingUsMXN + shippingMxMXN + handlingMXN;
    const customsMXN = subtotalMXN * cpct;
    const commissionMXN = subtotalMXN * tpct;
    const totalMXN = Math.round(subtotalMXN + customsMXN + commissionMXN);
    const marginMXN = commissionMXN;
    const marginPct = totalMXN > 0 ? (marginMXN / totalMXN) * 100 : 0;

    return {
      productMXN, shippingUsMXN, shippingMxMXN, handlingMXN, customsMXN, commissionMXN,
      totalMXN, marginMXN, marginPct, productUSD: p, shippingSdUSD: shippingUsUSD, shippingMxUSD, handlingUSD: hnd,
    };
  }, [productCostUSD, shippingSd, shippingMx, customsPct, handling, takePct, fx]);

  async function send() {
    if (!title.trim() || breakdown.totalMXN <= 0) {
      toast({ title: "Fill title and product cost", variant: "error" });
      return;
    }
    setLoading(true);
    const r = await fetch(`/api/admin/manual-reviews/${manualRequestId}/approve`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title, imageUrl, store,
        productCostUSD: parseFloat(productCostUSD) || 0,
        shippingToSdUSD: parseFloat(shippingSd) || 0,
        shippingToMxUSD: parseFloat(shippingMx) || 0,
        customsBufferPercent: (parseFloat(customsPct) || 0) / 100,
        handlingFeeUSD: parseFloat(handling) || 0,
        commissionPercent: (parseFloat(takePct) || 0) / 100,
        fxRateUsed: parseFloat(fx) || 17.5,
        totalMXN: breakdown.totalMXN,
        adminNote,
      }),
    });
    setLoading(false);
    if (r.ok) {
      const d = await r.json();
      toast({ title: "Quote sent to buyer", variant: "success" });
      setTimeout(() => router.push(`/admin/manual-reviews`), 600);
    } else {
      const d = await r.json().catch(() => ({}));
      toast({ title: d.error || "Failed to send quote", variant: "error" });
    }
  }

  return (
    <div className="grid lg:grid-cols-[1.2fr_1fr] gap-6">
      <div className="space-y-5">
        <Section title="Product">
          <Field label="Product title">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nike Air Force 1" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Store">
              <Input value={store} onChange={(e) => setStore(e.target.value)} />
            </Field>
            <Field label="Product image URL">
              <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
            </Field>
          </div>
          {imageUrl && (
            <div className="mt-2 rounded-md border border-[var(--border)] bg-[var(--bg)] p-3 flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="" className="h-20 w-20 rounded bg-white object-contain p-1 border border-[var(--border)]" />
              <span className="text-xs text-[var(--ink-2)]">Image preview</span>
            </div>
          )}
        </Section>

        <Section title="Cost breakdown">
          <Field label="Product cost" suffix="USD">
            <Input type="number" step="0.01" value={productCostUSD} onChange={(e) => setProductCost(e.target.value)} placeholder="120.00" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Shipping to San Diego" suffix="USD"><Input type="number" step="0.01" value={shippingSd} onChange={(e) => setShipSd(e.target.value)} /></Field>
            <Field label="Shipping to Mexico" suffix="USD"><Input type="number" step="0.01" value={shippingMx} onChange={(e) => setShipMx(e.target.value)} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Customs buffer" suffix="%"><Input type="number" step="0.1" value={customsPct} onChange={(e) => setCustoms(e.target.value)} /></Field>
            <Field label="Handling fee" suffix="USD"><Input type="number" step="0.01" value={handling} onChange={(e) => setHandling(e.target.value)} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={`Commission (${userTier})`} suffix="%"><Input type="number" step="0.1" value={takePct} onChange={(e) => setTake(e.target.value)} /></Field>
            <Field label="FX rate" suffix="USD→MXN"><Input type="number" step="0.0001" value={fx} onChange={(e) => setFx(e.target.value)} /></Field>
          </div>
        </Section>

        <Section title="Admin note (optional)">
          <textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)} rows={2} className="w-full rounded-md border border-[var(--border)] p-2 text-sm" />
        </Section>

        <Button size="lg" variant="orange" onClick={send} disabled={loading || alreadySent} className="w-full">
          {alreadySent ? "Quote already sent" : loading ? "Sending..." : `Send Quote to ${userEmail}`}
        </Button>
      </div>

      <aside className="lg:sticky lg:top-6 h-fit">
        <div className="rounded-lg border border-[var(--border)] bg-white p-5 font-mono text-sm">
          <h3 className="font-sans font-semibold mb-3">Live calculation</h3>
          <Row label="Product cost" usd={breakdown.productUSD} mxn={breakdown.productMXN} />
          <Row label="Shipping US→SD" usd={breakdown.shippingSdUSD} mxn={breakdown.shippingUsMXN} />
          <Row label="Shipping SD→MX" usd={breakdown.shippingMxUSD} mxn={breakdown.shippingMxMXN} />
          <Row label="Customs buffer" pct={parseFloat(customsPct) || 0} mxn={breakdown.customsMXN} />
          <Row label="Handling fee" usd={breakdown.handlingUSD} mxn={breakdown.handlingMXN} />
          <Row label="Our commission" pct={parseFloat(takePct) || 0} mxn={breakdown.commissionMXN} />
          <div className="my-2 border-t border-dashed border-[var(--border)]" />
          <div className="flex items-center justify-between py-1.5">
            <span className="font-sans font-semibold">Total buyer pays</span>
            <span className="font-bold text-[var(--blue)]">{formatMXN(breakdown.totalMXN)}</span>
          </div>
          <div className="flex items-center justify-between py-1 text-xs text-[var(--ink-2)]">
            <span className="font-sans">Our margin</span>
            <span>{formatMXN(breakdown.marginMXN)} ({breakdown.marginPct.toFixed(1)}%)</span>
          </div>
          <p className="mt-3 font-sans text-xs text-[var(--ink-3)]">FX rate: {fx} USD→MXN</p>
        </div>
      </aside>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-white p-5">
      <h2 className="text-sm font-semibold mb-3">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, suffix, children }: { label: string; suffix?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-[var(--ink-2)]">{label} {suffix && <span className="text-[var(--ink-3)]">({suffix})</span>}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Row({ label, usd, pct, mxn }: { label: string; usd?: number; pct?: number; mxn: number }) {
  const left = usd != null ? formatUSD(usd) : pct != null ? `${pct.toFixed(1)}%` : "";
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs">{label}</span>
      <span className="flex gap-3 items-center tabular-nums">
        <span className="text-[var(--ink-2)] text-xs w-20 text-right">{left}</span>
        <span className="text-[var(--ink)] text-xs w-24 text-right">{formatMXN(mxn)}</span>
      </span>
    </div>
  );
}
