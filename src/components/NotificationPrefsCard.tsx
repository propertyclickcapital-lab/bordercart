"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/toast";

type Prefs = { emailOrders: boolean; emailMarketing: boolean; smsOrders: boolean };

export function NotificationPrefsCard() {
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetch("/api/notifications").then((r) => r.json()).then((d) => {
      setPrefs({ emailOrders: d.emailOrders, emailMarketing: d.emailMarketing, smsOrders: d.smsOrders });
    }).catch(() => {});
  }, []);

  async function update(k: keyof Prefs, v: boolean) {
    if (!prefs) return;
    const next = { ...prefs, [k]: v };
    setPrefs(next);
    await fetch("/api/notifications", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    toast({ title: "Preferences saved", variant: "success" });
  }

  if (!prefs) return null;

  return (
    <div className="rounded-lg border border-[var(--border)] bg-white p-5">
      <h2 className="text-sm font-semibold">Notifications</h2>
      <div className="mt-3 space-y-1">
        <Toggle label="Email me when my order status changes" checked={prefs.emailOrders} onChange={(v) => update("emailOrders", v)} />
        <Toggle label="Send me occasional deals and tips" checked={prefs.emailMarketing} onChange={(v) => update("emailMarketing", v)} />
        <Toggle label="SMS updates for my orders" checked={prefs.smsOrders} onChange={(v) => update("smsOrders", v)} />
      </div>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between py-2 cursor-pointer">
      <span className="text-sm">{label}</span>
      <button
        type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition-colors ${checked ? "bg-[var(--blue)]" : "bg-[var(--border)]"}`}
      >
        <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : ""}`} />
      </button>
    </label>
  );
}
