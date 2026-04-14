"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, ShoppingCart, Users, Tags, Flame, BarChart3, Warehouse, Store, Inbox, LogOut } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/pricing", label: "Pricing Rules", icon: Tags },
  { href: "/admin/trending", label: "Trending", icon: Flame },
  { href: "/admin/manual-reviews", label: "Manual reviews", icon: Inbox },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/stores", label: "Stores", icon: Store },
  { href: "/warehouse", label: "Warehouse", icon: Warehouse },
];

export function AdminSidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex w-60 flex-col bg-[var(--navy)] text-white/90 min-h-screen sticky top-0">
      <div className="px-5 py-5 border-b border-white/10">
        <Link href="/" className="text-lg font-bold text-white flex items-center gap-1.5">BorderCart <span>🇲🇽🇺🇸</span></Link>
        <p className="text-xs uppercase tracking-wider text-[var(--orange)] mt-1">Admin</p>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {ITEMS.map((it) => {
          const active = pathname === it.href || (it.href !== "/admin" && pathname.startsWith(it.href));
          return (
            <Link key={it.href} href={it.href} className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm",
              active ? "bg-white/15 text-white font-medium" : "hover:bg-white/10 text-white/80"
            )}>
              <it.icon className="h-4 w-4" /> {it.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-white/10 space-y-1">
        <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-white/80 hover:bg-white/10">Customer view</Link>
        <button onClick={() => signOut({ callbackUrl: "/" })} className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-white/80 hover:bg-white/10">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </aside>
  );
}
