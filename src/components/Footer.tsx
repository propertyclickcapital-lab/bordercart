import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-16 bg-[var(--navy)] text-white/80">
      <div className="mx-auto max-w-7xl px-6 py-12 grid gap-8 md:grid-cols-4">
        <div>
          <div className="text-white font-bold text-lg flex items-center gap-1.5">BorderCart <span>🇲🇽🇺🇸</span></div>
          <p className="mt-3 text-sm text-white/70">Shop any U.S. store and we'll deliver to Mexico.</p>
        </div>
        <FooterCol title="Company" links={[["How it works", "#how"], ["FAQ", "#faq"], ["Contact", "mailto:hello@bordercart.com"]]} />
        <FooterCol title="For you" links={[["Dashboard", "/dashboard"], ["Orders", "/orders"], ["Profile", "/profile"]]} />
        <FooterCol title="Team" links={[["Admin", "/admin"], ["Warehouse", "/warehouse"]]} />
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/60">
          <p>© {new Date().getFullYear()} BorderCart. Shop the U.S. from Mexico.</p>
          <div className="flex items-center gap-5">
            <a href="#" className="hover:text-white">Privacy</a>
            <a href="#" className="hover:text-white">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h4 className="text-white text-sm font-semibold">{title}</h4>
      <ul className="mt-3 space-y-2 text-sm">
        {links.map(([label, href]) => (
          <li key={label}><Link href={href} className="hover:text-white transition-colors">{label}</Link></li>
        ))}
      </ul>
    </div>
  );
}
