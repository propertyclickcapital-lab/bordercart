"use client";

import { useEffect, useState } from "react";
import { Gift, Copy, Users, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { formatMXN } from "@/lib/utils/currency";

export function ReferralCard() {
  const [data, setData] = useState<{ referralCode: string; referralCount: number; creditMXN: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => { fetch("/api/referral").then((r) => r.json()).then(setData).catch(() => {}); }, []);

  if (!data) return null;
  const url = `${typeof window !== "undefined" ? window.location.origin : ""}/signup?ref=${data.referralCode}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({ title: "Link copied!", variant: "success" });
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <div className="rounded-lg border border-[var(--border)] bg-gradient-to-br from-[var(--orange-light)] via-white to-white p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--orange)] text-white">
          <Gift className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h2 className="font-semibold">Invite friends, earn $100 MXN per order they complete</h2>
          <p className="mt-1 text-sm text-[var(--ink-2)]">Share your link. They get access. You get credit.</p>
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-[var(--border)] bg-white p-2">
            <code className="flex-1 text-xs sm:text-sm font-mono text-[var(--ink-2)] truncate px-2">{url}</code>
            <Button size="sm" onClick={copy} variant={copied ? "secondary" : "default"}>
              {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <Mini label="Your code" value={data.referralCode} />
            <Mini label="Friends referred" value={data.referralCount.toString()} icon={<Users className="h-3 w-3" />} />
            <Mini label="Credit earned" value={formatMXN(data.creditMXN)} highlight />
          </div>
        </div>
      </div>
    </div>
  );
}

function Mini({ label, value, highlight, icon }: { label: string; value: string; highlight?: boolean; icon?: React.ReactNode }) {
  return (
    <div className="rounded-md bg-white border border-[var(--border)] p-2">
      <p className="text-[10px] uppercase tracking-wider text-[var(--ink-2)] flex items-center justify-center gap-1">{icon}{label}</p>
      <p className={`mt-0.5 text-sm font-bold ${highlight ? "text-[var(--orange)]" : "text-[var(--ink)]"}`}>{value}</p>
    </div>
  );
}
