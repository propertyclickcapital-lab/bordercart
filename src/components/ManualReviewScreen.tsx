"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

const STEPS = [
  { key: "received", label: "Link received", type: "done" as const },
  { key: "store", label: "Store identified", type: "done" as const },
  { key: "availability", label: "Checking product availability...", type: "spin" as const },
  { key: "price", label: "Calculating your MXN price...", type: "spin" as const },
  { key: "ready", label: "Almost ready...", type: "spin" as const },
];

export function ManualReviewScreen({
  requestId,
  initialPhone,
}: {
  requestId: string;
  sourceUrl: string;
  initialPhone?: string | null;
}) {
  const [revealed, setRevealed] = useState(0);
  const [phone, setPhone] = useState((initialPhone ?? "").replace(/^\+?52/, ""));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const ids: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i <= STEPS.length; i++) {
      ids.push(setTimeout(() => setRevealed(i), i * 2000));
    }
    return () => ids.forEach(clearTimeout);
  }, []);

  async function notify() {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      toast({ title: "Enter a valid WhatsApp number", variant: "error" });
      return;
    }
    setSaving(true);
    const r = await fetch(`/api/manual-requests/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ whatsappNumber: `+52${digits}` }),
    });
    setSaving(false);
    if (r.ok) {
      setSaved(true);
      toast({ title: "We'll WhatsApp you when ready.", variant: "success" });
    } else {
      toast({ title: "Could not save. Try again.", variant: "error" });
    }
  }

  return (
    <main className="min-h-screen bg-white flex flex-col items-center px-4 py-16">
      <style>{`
        .bc-check-svg circle {
          stroke-dasharray: 283;
          stroke-dashoffset: 283;
          animation: bc-check-circle 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .bc-check-svg path {
          stroke-dasharray: 60;
          stroke-dashoffset: 60;
          animation: bc-check-tick 0.35s cubic-bezier(0.16, 1, 0.3, 1) 0.55s forwards;
        }
        @keyframes bc-check-circle { to { stroke-dashoffset: 0; } }
        @keyframes bc-check-tick { to { stroke-dashoffset: 0; } }
        @keyframes bc-step-in {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .bc-step { animation: bc-step-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) both; }
      `}</style>

      <svg viewBox="0 0 100 100" className="bc-check-svg h-24 w-24" aria-hidden>
        <circle cx="50" cy="50" r="45" fill="none" stroke="#067d62" strokeWidth="5" />
        <path d="M30 52 L45 67 L72 38" fill="none" stroke="#067d62" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      <h1 className="mt-6 text-3xl sm:text-4xl font-bold text-center text-[var(--ink)]">
        Your order request is being reviewed
      </h1>
      <p className="mt-3 text-[var(--ink-2)] text-center max-w-lg">
        Our team is checking availability and preparing your final price. Usually under 2 hours.
      </p>

      <ol className="mt-10 w-full max-w-md space-y-3">
        {STEPS.map((s, i) => {
          if (i >= revealed) return null;
          return (
            <li
              key={s.key}
              className="bc-step flex items-center gap-3 rounded-lg border border-[var(--border)] bg-white p-3"
            >
              {s.type === "done" ? (
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-green-50 text-[var(--success)]">
                  <Check className="h-4 w-4" strokeWidth={3} />
                </span>
              ) : (
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[var(--blue-light)] text-[var(--blue)]">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </span>
              )}
              <span className={`text-sm ${s.type === "done" ? "text-[var(--ink)] font-medium" : "text-[var(--ink-2)]"}`}>
                {s.label}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="mt-10 w-full max-w-md rounded-xl border border-[var(--border)] bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-[var(--ink)]">Enter your WhatsApp to get notified</p>
        <div className="mt-3 flex items-stretch rounded-lg border border-[var(--border)] overflow-hidden focus-within:ring-2 focus-within:ring-[var(--blue)] focus-within:border-[var(--blue)]">
          <span className="flex items-center gap-1 px-3 bg-[var(--bg)] border-r border-[var(--border)] text-sm text-[var(--ink-2)]">
            <span>🇲🇽</span>
            <span className="font-medium">+52</span>
          </span>
          <input
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="55 1234 5678"
            className="flex-1 px-3 py-2 text-sm outline-none"
          />
        </div>
        <Button onClick={notify} disabled={saving || saved} className="w-full mt-3">
          {saved ? "✓ We'll notify you" : saving ? "Saving..." : "Notify me when ready"}
        </Button>
      </div>

      <div className="mt-10 flex flex-col sm:flex-row gap-3 text-xs text-[var(--ink-2)] text-center">
        <span>🔒 No charge until you approve</span>
        <span className="hidden sm:inline">·</span>
        <span>✓ Free to request</span>
        <span className="hidden sm:inline">·</span>
        <span>💬 We'll WhatsApp you</span>
      </div>
    </main>
  );
}
