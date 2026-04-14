"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart, Menu } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { SearchBar } from "./SearchBar";
import { getTierLabel } from "@/lib/pricing/tiers";
import { Badge } from "@/components/ui/badge";

const CATEGORIES = ["Electronics", "Fashion", "Beauty", "Home", "Sports", "Shoes", "Luxury", "Auto", "Pets", "Baby", "Books", "Office", "Food"];

export function TopNav() {
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [wishCount, setWishCount] = useState(0);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/wishlist").then((r) => r.json()).then((items) => setWishCount(Array.isArray(items) ? items.length : 0)).catch(() => {});
  }, [status]);

  const user = session?.user;

  return (
    <div className="w-full sticky top-0 z-40">
      <header className="bg-[var(--navy)] text-white">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <button className="md:hidden p-2 -ml-2 rounded hover:bg-white/10" onClick={() => setMenuOpen((v) => !v)} aria-label="Menu">
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/" className="flex items-center gap-1.5 text-lg font-bold tracking-tight">
            <span>BorderCart</span>
            <span aria-hidden>🇲🇽🇺🇸</span>
          </Link>
          <div className="ml-2 hidden md:block flex-1 max-w-2xl">
            <SearchBar />
          </div>
          <nav className="ml-auto flex items-center gap-1 md:gap-3 text-sm">
            {status === "authenticated" && user ? (
              <>
                <Link href="/dashboard" className="hidden md:block rounded px-3 py-1.5 hover:bg-white/10">
                  <span className="text-[10px] block text-white/70">Hello, {user.name || user.email?.split("@")[0]}</span>
                  <span className="font-semibold">Account</span>
                </Link>
                {user.tier !== "DEFAULT" && <Badge variant="orange" className="hidden md:inline-flex">{getTierLabel(user.tier)}</Badge>}
                {user.role === "ADMIN" && <Link href="/admin" className="hidden md:inline rounded px-2 py-1 hover:bg-white/10">Admin</Link>}
                {(user.role === "ADMIN" || user.role === "WAREHOUSE_OPERATOR") && <Link href="/warehouse" className="hidden md:inline rounded px-2 py-1 hover:bg-white/10">Warehouse</Link>}
                <Link href="/wishlist" className="relative flex items-center gap-1 rounded px-2 py-1 hover:bg-white/10">
                  <Heart className="h-5 w-5" />
                  {wishCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-[var(--orange)] text-[10px] font-bold">
                      {wishCount}
                    </span>
                  )}
                </Link>
                <button onClick={() => signOut({ callbackUrl: "/" })} className="hidden md:inline rounded px-2 py-1 hover:bg-white/10">
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="rounded px-3 py-1.5 hover:bg-white/10">Login</Link>
                <Link href="/signup" className="rounded bg-[var(--orange)] hover:bg-[var(--orange-dark)] px-3 py-1.5 font-medium">Sign Up</Link>
              </>
            )}
          </nav>
        </div>
        <div className="md:hidden px-4 pb-3">
          <SearchBar />
        </div>
      </header>
      <div className="bg-[var(--navy-2)] text-white">
        <div className="mx-auto max-w-7xl px-4 overflow-x-auto">
          <ul className="flex items-center gap-1 py-1.5 text-sm whitespace-nowrap">
            {CATEGORIES.map((c) => (
              <li key={c}>
                <Link href={`/search?category=${encodeURIComponent(c)}`} className="px-3 py-1.5 rounded hover:bg-white/10 text-white/90 inline-block">
                  {c}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {menuOpen && (
        <div className="md:hidden bg-white border-b border-[var(--border)] shadow-md">
          <div className="px-4 py-3 flex flex-col gap-2 text-sm">
            {user ? (
              <>
                <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="py-2">Dashboard</Link>
                <Link href="/orders" onClick={() => setMenuOpen(false)} className="py-2">Orders</Link>
                <Link href="/wishlist" onClick={() => setMenuOpen(false)} className="py-2">Saved items</Link>
                <Link href="/profile" onClick={() => setMenuOpen(false)} className="py-2">Profile</Link>
                {user.role === "ADMIN" && <Link href="/admin" className="py-2 text-[var(--blue)]">Admin</Link>}
                {(user.role === "ADMIN" || user.role === "WAREHOUSE_OPERATOR") && <Link href="/warehouse" className="py-2 text-[var(--blue)]">Warehouse</Link>}
                <button onClick={() => signOut({ callbackUrl: "/" })} className="text-left py-2 text-[var(--ink-2)]">Sign out</button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setMenuOpen(false)} className="py-2">Login</Link>
                <Link href="/signup" onClick={() => setMenuOpen(false)} className="py-2">Sign up</Link>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
