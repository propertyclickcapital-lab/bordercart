import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-[var(--bg)]">
      <h1 className="text-6xl font-extrabold text-[var(--blue)]">404</h1>
      <p className="mt-3 text-[var(--ink-2)]">That page doesn't exist.</p>
      <Link href="/" className="mt-6 text-sm font-medium text-[var(--blue)] hover:underline">← Back home</Link>
    </main>
  );
}
