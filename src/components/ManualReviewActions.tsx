"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

export function ManualReviewActions({
  id, initialStatus, initialQuoted, initialNote,
}: {
  id: string; initialStatus: string; initialQuoted: number | null; initialNote: string;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [quoted, setQuoted] = useState(initialQuoted?.toString() ?? "");
  const [note, setNote] = useState(initialNote);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function save(newStatus?: string) {
    setLoading(true);
    const r = await fetch("/api/admin/manual-reviews", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id, status: newStatus || status, adminNote: note,
        quotedPriceMXN: quoted ? parseFloat(quoted) : null,
      }),
    });
    setLoading(false);
    if (r.ok) {
      setStatus(newStatus || status);
      toast({ title: "Saved", variant: "success" });
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="orange">Send Quote</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send custom quote</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <label className="block">
            <span className="text-xs font-semibold">Quoted price MXN</span>
            <Input type="number" value={quoted} onChange={(e) => setQuoted(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-xs font-semibold">Admin note</span>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="w-full rounded-lg border border-[var(--border)] p-3 text-sm" />
          </label>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => save("reviewed")} disabled={loading}>Mark reviewed</Button>
            <Button variant="orange" onClick={() => save("quoted")} disabled={loading || !quoted}>Mark quoted</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
