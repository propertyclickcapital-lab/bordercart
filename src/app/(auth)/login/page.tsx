"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}

function Inner() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setErr(null);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) { setErr("Invalid email or password"); return; }
    router.push(params.get("callbackUrl") || "/dashboard");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 bg-[var(--bg)]">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center text-xl font-bold">BorderCart 🇲🇽🇺🇸</Link>
        <div className="mt-6 rounded-lg border border-[var(--border)] bg-white p-7 shadow-sm">
          <h1 className="text-2xl font-bold">Sign in</h1>
          <p className="mt-1 text-sm text-[var(--ink-2)]">Welcome back.</p>
          <form onSubmit={submit} className="mt-5 space-y-3">
            <label className="block"><span className="text-xs font-semibold">Email</span>
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" />
            </label>
            <label className="block"><span className="text-xs font-semibold">Password</span>
              <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" />
            </label>
            {err && <p className="text-sm text-[var(--danger)]">{err}</p>}
            <Button type="submit" size="lg" variant="orange" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
          <p className="mt-5 text-center text-sm text-[var(--ink-2)]">
            New here? <Link href="/signup" className="text-[var(--blue)] font-medium hover:underline">Create an account</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
