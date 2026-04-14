"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

export function ManualReviewScreen({ requestId, sourceUrl, initialPhone }: { requestId: string; sourceUrl: string; initialPhone?: string | null }) {
  const [step, setStep] = useState(0);
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const ids = [
      setTimeout(() => setStep(1), 800),
      setTimeout(() => setStep(2), 1800),
      setTimeout(() => setStep(3), 2800),
    ];
    return () => ids.forEach(clearTimeout);
  }, []);

  async function savePhone() {
    setSaving(true);
    await fetch(`/api/manual-requests/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ whatsappNumber: phone }),
    });
    setSaving(false);
    toast({ title: "We'll text you shortly.", variant: "success" });
  }

  return (
    <div className="mx-auto max-w-xl py-12 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--blue-light)] text-[var(--blue)]">
        <Clock className="h-7 w-7 animate-pulse" />
      </div>
      <h1 className="mt-5 text-3xl font-bold">We're on it</h1>
      <p className="mt-2 text-[var(--ink-2)]">Our team is pricing this product manually.<br />You'll hear from us within 24 hours.</p>

      <div className="mx-auto mt-8 max-w-sm h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
        <div className="h-full bg-[var(--blue)] transition-all duration-700" style={{ width: `${(step / 3) * 100}%` }} />
      </div>

      <ul className="mt-8 text-left space-y-3 max-w-sm mx-auto">
        <Row label="Link received" done={step >= 1} />
        <Row label="Request logged for our team" done={step >= 2} />
        <Row label="Pricing team notified" done={step >= 3} />
      </ul>

      <div className="mt-10 rounded-lg border border-[var(--border)] bg-white p-5 text-left">
        <p className="text-sm font-semibold">Want updates on WhatsApp?</p>
        <p className="text-xs text-[var(--ink-2)] mt-1">Drop your number and we'll send the quote when ready.</p>
        <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
          <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+52 ..." />
          <Button onClick={savePhone} disabled={!phone || saving}>{saving ? "..." : "Save"}</Button>
        </div>
      </div>
      <p className="mt-4 text-xs text-[var(--ink-3)] break-all">URL: {sourceUrl}</p>
    </div>
  );
}

function Row({ label, done }: { label: string; done: boolean }) {
  return (
    <li className={`flex items-center gap-3 text-sm ${done ? "text-[var(--ink)]" : "text-[var(--ink-3)]"}`}>
      <CheckCircle2 className={`h-5 w-5 ${done ? "text-[var(--success)] animate-check" : "text-[var(--border)]"}`} />
      {label}
    </li>
  );
}
