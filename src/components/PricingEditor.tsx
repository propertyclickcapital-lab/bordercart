"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

type Rule = {
  takeRateDefault: number; takeRateActive: number; takeRatePower: number; takeRateVip: number;
  fxSpreadPercent: number; shippingMarginUSD: number; handlingFeeUSD: number;
  customsBufferPercent: number; minMarginMXN: number;
};

export function PricingEditor({ rule }: { rule: Rule }) {
  const [form, setForm] = useState<Rule>(rule);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  function set<K extends keyof Rule>(k: K, v: string) { setForm({ ...form, [k]: parseFloat(v) || 0 }); }

  async function save() {
    setLoading(true);
    const r = await fetch("/api/admin/pricing", {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    });
    setLoading(false);
    toast({ title: r.ok ? "Pricing saved" : "Save failed", variant: r.ok ? "success" : "error" });
  }

  return (
    <div className="space-y-6">
      <Section title="Tier take rates">
        <Field label="DEFAULT" suffix="%" value={form.takeRateDefault} onChange={(v) => set("takeRateDefault", v)} pct />
        <Field label="ACTIVE" suffix="%" value={form.takeRateActive} onChange={(v) => set("takeRateActive", v)} pct />
        <Field label="POWER" suffix="%" value={form.takeRatePower} onChange={(v) => set("takeRatePower", v)} pct />
        <Field label="VIP" suffix="%" value={form.takeRateVip} onChange={(v) => set("takeRateVip", v)} pct />
      </Section>
      <Section title="FX and fees">
        <Field label="FX spread" suffix="%" value={form.fxSpreadPercent} onChange={(v) => set("fxSpreadPercent", v)} pct />
        <Field label="Shipping" suffix="USD" value={form.shippingMarginUSD} onChange={(v) => set("shippingMarginUSD", v)} />
        <Field label="Handling" suffix="USD" value={form.handlingFeeUSD} onChange={(v) => set("handlingFeeUSD", v)} />
        <Field label="Customs buffer" suffix="%" value={form.customsBufferPercent} onChange={(v) => set("customsBufferPercent", v)} pct />
        <Field label="Min margin" suffix="MXN" value={form.minMarginMXN} onChange={(v) => set("minMarginMXN", v)} />
      </Section>
      <Button size="lg" onClick={save} disabled={loading} className="w-full">{loading ? "Saving..." : "Save changes"}</Button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-white p-5">
      <h2 className="text-sm font-semibold">{title}</h2>
      <div className="mt-3 grid grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

function Field({ label, suffix, value, onChange, pct }: { label: string; suffix?: string; value: number; onChange: (v: string) => void; pct?: boolean }) {
  const display = pct ? (value * 100).toFixed(2) : value.toString();
  return (
    <label className="block">
      <span className="text-xs font-medium text-[var(--ink-2)]">{label} <span className="text-[var(--ink-3)]">({suffix})</span></span>
      <Input type="number" step="0.01" value={display}
        onChange={(e) => onChange(pct ? (parseFloat(e.target.value) / 100).toString() : e.target.value)}
        className="mt-1" />
    </label>
  );
}
