"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Gift } from "lucide-react";

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}

function Inner() {
  const router = useRouter();
  const params = useSearchParams();
  const initialRef = params.get("ref") || "";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [ref, setRef] = useState(initialRef);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setErr(null);
    const r = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, phone, ref: ref || undefined }),
    });
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      setErr(d.error || "Something went wrong");
      setLoading(false);
      return;
    }
    await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 bg-[var(--bg)]">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center text-xl font-bold">BorderCart 🇲🇽🇺🇸</Link>
        <div className="mt-6 rounded-lg border border-[var(--border)] bg-white p-7 shadow-sm">
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="mt-1 text-sm text-[var(--ink-2)]">Takes 30 seconds.</p>
          {initialRef && (
            <div className="mt-4 flex items-start gap-2 rounded-md border border-[var(--orange)]/20 bg-[var(--orange-light)] p-3">
              <Gift className="h-4 w-4 text-[var(--orange)] mt-0.5" />
              <p className="text-xs">You were invited with code <strong>{initialRef}</strong>.</p>
            </div>
          )}
          <form onSubmit={submit} className="mt-5 space-y-3">
            <label className="block"><span className="text-xs font-semibold">Your name</span>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
            </label>
            <label className="block"><span className="text-xs font-semibold">Email</span>
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" />
            </label>
            <label className="block"><span className="text-xs font-semibold">Password (8+ chars)</span>
              <Input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" />
            </label>
            <label className="block"><span className="text-xs font-semibold">Phone (optional)</span>
              <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1" placeholder="+52 ..." />
            </label>
            <label className="block"><span className="text-xs font-semibold">Referral code (optional)</span>
              <Input value={ref} onChange={(e) => setRef(e.target.value.toUpperCase())} className="mt-1" placeholder="ABCD1234" />
            </label>
            {err && <p className="text-sm text-[var(--danger)]">{err}</p>}
            <Button type="submit" size="lg" variant="orange" className="w-full" disabled={loading}>
              {loading ? "Creating..." : "Create account"}
            </Button>
          </form>
          <p className="mt-5 text-center text-sm text-[var(--ink-2)]">
            Already have an account? <Link href="/login" className="text-[var(--blue)] font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
