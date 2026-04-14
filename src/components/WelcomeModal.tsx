"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const KEY = "bordercart_welcomed";

export function WelcomeModal({ name }: { name?: string | null }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem(KEY)) {
      const t = setTimeout(() => setOpen(true), 400);
      return () => clearTimeout(t);
    }
  }, []);

  function dismiss() {
    if (typeof window !== "undefined") localStorage.setItem(KEY, "1");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) dismiss(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Welcome to BorderCart{name ? `, ${name}` : ""} 🎉</DialogTitle>
          <DialogDescription>Paste any U.S. product link and we'll deliver it to your door in Mexico.</DialogDescription>
        </DialogHeader>
        <div className="mt-3 rounded-lg bg-[var(--blue-light)] border border-[var(--blue)]/20 p-4 text-sm">
          <p className="font-semibold text-[var(--blue-dark)]">How it works</p>
          <ol className="mt-2 space-y-1 list-decimal list-inside text-[var(--ink-2)]">
            <li>Paste a U.S. product link</li>
            <li>See the final price in MXN</li>
            <li>Pay securely with Stripe</li>
            <li>Track every step to your door</li>
          </ol>
        </div>
        <Button onClick={dismiss} variant="orange" size="lg" className="w-full mt-5">Get started</Button>
      </DialogContent>
    </Dialog>
  );
}
