import Link from "next/link";
import { ShieldCheck, Truck, Tag, Lock, PackageCheck, Globe, ChevronDown, Check } from "lucide-react";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { LinkInput } from "@/components/LinkInput";
import { StoreLogoStrip } from "@/components/StoreLogoStrip";
import { Button } from "@/components/ui/button";
import { TrendingHome } from "@/components/TrendingHome";

const STEPS = [
  { title: "Paste Link", body: "Drop any U.S. product URL" },
  { title: "See MXN Price", body: "One all-in price. No surprises." },
  { title: "We Deliver", body: "Door-to-door in Mexico, 7–14 days" },
];

const WHY = [
  "No U.S. credit card required",
  "No customs paperwork for you",
  "Real-time tracking every step",
  "Flat transparent pricing",
];

const REVIEWS = [
  { name: "María G.", city: "CDMX", body: "I bought my Nikes from Foot Locker and they arrived in 9 days. The price was exactly what I saw." },
  { name: "Luis P.", city: "Monterrey", body: "Best way to buy from Amazon US. No scary customs fees when it arrived." },
  { name: "Carla R.", city: "Guadalajara", body: "Finally ordered a Dyson that doesn't ship here. Worth every peso." },
];

const FAQ = [
  { q: "How long does delivery take?", a: "7–14 business days from payment. We'll keep you updated at every step." },
  { q: "Do I need a U.S. credit card?", a: "No. Pay in pesos at checkout with any card, or OXXO/SPEI via Stripe." },
  { q: "Are customs included?", a: "Yes. Our quote already includes all duties and handling — no surprise charges." },
  { q: "What if you can't find my product?", a: "We'll send you a manual quote within 24 hours by WhatsApp." },
];

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-[var(--bg)]">
      <div className="bg-[var(--orange)] text-white text-center text-xs md:text-sm py-1.5 px-4">
        🎁 First order? Unlock better pricing instantly — <Link href="/signup" className="underline font-semibold">Sign up free →</Link>
      </div>
      <TopNav />

      <section className="bg-white border-b border-[var(--border)]">
        <div className="mx-auto max-w-7xl grid md:grid-cols-5 gap-10 px-6 py-12 md:py-20">
          <div className="md:col-span-3">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.05]">
              Buy anything from the U.S.<br />
              <span className="text-[var(--blue)]">Delivered to your door in Mexico.</span>
            </h1>
            <p className="mt-5 text-lg text-[var(--ink-2)] max-w-xl">
              No U.S. address. No customs. No stress. Just paste the link — we handle the rest.
            </p>
            <div className="mt-7 max-w-xl">
              <LinkInput size="lg" autoFocus />
            </div>
            <p className="mt-5 text-sm text-[var(--ink-2)]">Trusted by thousands of shoppers across Mexico 🇲🇽</p>
          </div>
          <div className="md:col-span-2 hidden md:flex items-center justify-center">
            <div className="w-full rounded-lg border border-[var(--border)] bg-[var(--blue-light)] p-6">
              <p className="text-xs uppercase tracking-wider text-[var(--ink-2)] font-semibold">Your all-in price</p>
              <p className="mt-1 text-4xl font-extrabold text-[var(--blue)]">$2,499 MXN</p>
              <p className="mt-1 text-sm text-[var(--ink-2)]">Delivered in 7–14 days · all fees included</p>
              <div className="mt-5 rounded-md bg-white border border-[var(--border)] p-3 flex items-center gap-3">
                <div className="h-12 w-12 rounded bg-[var(--bg)]" />
                <div className="min-w-0">
                  <p className="text-xs text-[var(--ink-2)]">Amazon</p>
                  <p className="text-sm font-medium truncate">AirPods Pro (2nd generation)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white border-b border-[var(--border)]">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <p className="text-center text-xs uppercase tracking-wider text-[var(--ink-2)] mb-5">
            Shop from any of these 70+ stores
          </p>
          <StoreLogoStrip />
        </div>
      </section>

      <section id="how" className="mx-auto max-w-7xl w-full px-6 py-14">
        <h2 className="text-3xl font-bold text-center">How it works</h2>
        <p className="text-center text-[var(--ink-2)] mt-2">Three simple steps.</p>
        <div className="mt-10 grid md:grid-cols-3 gap-4">
          {STEPS.map((s, i) => (
            <div key={s.title} className="rounded-lg border border-[var(--border)] bg-white p-6 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--blue)] text-white font-bold text-lg">{i + 1}</div>
              <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
              <p className="mt-1 text-[var(--ink-2)] text-sm">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white border-y border-[var(--border)]">
        <div className="mx-auto max-w-7xl px-6 py-14 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-3xl font-bold">Why BorderCart?</h2>
            <ul className="mt-6 space-y-3">
              {WHY.map((w) => (
                <li key={w} className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[var(--success)] mt-0.5 flex-shrink-0" />
                  <span className="text-[var(--ink)]">{w}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Feat icon={<ShieldCheck className="h-5 w-5" />} label="Secure Payment" />
            <Feat icon={<Truck className="h-5 w-5" />} label="7–14 Days" />
            <Feat icon={<Tag className="h-5 w-5" />} label="No Hidden Fees" />
            <Feat icon={<Lock className="h-5 w-5" />} label="Stripe Protected" />
            <Feat icon={<Globe className="h-5 w-5" />} label="Top U.S. Stores" />
            <Feat icon={<PackageCheck className="h-5 w-5" />} label="Mexico Nationwide" />
          </div>
        </div>
      </section>

      <section className="bg-[var(--navy)] text-white">
        <div className="mx-auto max-w-7xl px-6 py-14 text-center">
          <h2 className="text-3xl font-bold">Stop overpaying to buy from the U.S.</h2>
          <p className="mt-3 text-white/80 max-w-xl mx-auto">
            Forwarders charge you surprise fees. We don't. One price, all included, door to door.
          </p>
          <div className="mt-6">
            <Link href="/signup"><Button variant="orange" size="lg">Create my free account</Button></Link>
          </div>
        </div>
      </section>

      <section className="bg-[var(--navy-2)] text-white">
        <div className="mx-auto max-w-7xl px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <Trust n="10,000+" label="Orders delivered" />
          <Trust n="Stripe" label="Secure checkout" />
          <Trust n="San Diego" label="U.S. warehouse" />
          <Trust n="Nationwide" label="Mexico delivery" />
        </div>
      </section>

      <TrendingHome />

      <section className="mx-auto max-w-7xl w-full px-6 py-14">
        <h2 className="text-3xl font-bold text-center">What shoppers are saying</h2>
        <div className="mt-8 grid md:grid-cols-3 gap-4">
          {REVIEWS.map((r) => (
            <div key={r.name} className="rounded-lg border border-[var(--border)] bg-white p-5 shadow-sm">
              <div className="text-[var(--orange)]">★★★★★</div>
              <p className="mt-3 text-sm text-[var(--ink)]">{r.body}</p>
              <p className="mt-3 text-xs text-[var(--ink-2)]">— {r.name}, {r.city}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gradient-to-br from-[var(--blue)] to-[var(--navy)] text-white">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <h2 className="text-3xl md:text-4xl font-bold">Get your first price in 30 seconds</h2>
          <p className="mt-3 text-white/80">Paste any link. See the peso price.</p>
          <div className="mt-6"><LinkInput size="lg" onHero /></div>
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-3xl w-full px-6 py-14">
        <h2 className="text-3xl font-bold text-center">Frequently asked</h2>
        <div className="mt-8 space-y-3">
          {FAQ.map((f) => (
            <details key={f.q} className="group rounded-lg border border-[var(--border)] bg-white p-5">
              <summary className="flex items-center justify-between cursor-pointer list-none font-semibold">
                {f.q}
                <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-sm text-[var(--ink-2)]">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}

function Feat({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-white p-4 flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--blue-light)] text-[var(--blue)]">{icon}</div>
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

function Trust({ n, label }: { n: string; label: string }) {
  return (
    <div>
      <p className="text-2xl font-extrabold">{n}</p>
      <p className="mt-1 text-xs uppercase tracking-wider text-white/70">{label}</p>
    </div>
  );
}
