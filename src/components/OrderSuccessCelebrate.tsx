"use client";

import { ConfettiSuccess } from "./ConfettiSuccess";

export function OrderSuccessCelebrate() {
  return (
    <>
      <ConfettiSuccess />
      <div className="rounded-lg border border-green-300 bg-green-50 p-4 flex items-start gap-3">
        <div className="text-2xl">🎉</div>
        <div>
          <p className="font-semibold text-[var(--success)]">Payment received!</p>
          <p className="text-sm text-[var(--ink-2)] mt-0.5">We're on it. You'll get email + WhatsApp updates as your order moves.</p>
        </div>
      </div>
    </>
  );
}
