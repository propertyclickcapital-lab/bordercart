"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-[var(--bg)]">
      <h1 className="text-3xl font-bold">Something went wrong</h1>
      <p className="mt-2 text-[var(--ink-2)]">Please try again.</p>
      <Button className="mt-6" onClick={reset}>Retry</Button>
    </main>
  );
}
