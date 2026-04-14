import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function WarehouseLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "WAREHOUSE_OPERATOR" && session.user.role !== "ADMIN")) {
    redirect("/dashboard");
  }
  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)]">
      <header className="bg-[var(--navy)] text-white sticky top-0 z-40">
        <div className="mx-auto max-w-7xl flex items-center justify-between px-6 py-4">
          <Link href="/warehouse" className="flex items-center gap-2">
            <span className="text-lg font-bold">BorderCart 🇲🇽🇺🇸</span>
            <span className="text-xs uppercase tracking-wider text-[var(--orange)]">Warehouse</span>
          </Link>
          <nav className="flex items-center gap-5 text-sm">
            <Link href="/warehouse" className="text-white/80 hover:text-white">Queue</Link>
            {session.user.role === "ADMIN" && <Link href="/admin" className="text-white/80 hover:text-white">Admin</Link>}
            <Link href="/dashboard" className="text-white/80 hover:text-white">Customer view</Link>
          </nav>
        </div>
      </header>
      <div className="flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">{children}</div>
      </div>
    </div>
  );
}
