"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Lock, ShieldCheck, CheckCircle2, CreditCard, Building2, Store, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatMXN } from "@/lib/utils/currency";
import { CardTab } from "./checkout/CardTab";
import { OxxoTab } from "./checkout/OxxoTab";
import { SpeiTab } from "./checkout/SpeiTab";

type Quote = {
  id: string;
  totalMXN: number;
  deliveryDaysMin: number;
  deliveryDaysMax: number;
  product: { title: string; imageUrl: string | null; store: string };
};

type Addr = {
  id: string; label: string; street: string;
  exteriorNumber: string | null; interiorNumber: string | null;
  colonia: string | null; city: string; state: string; postalCode: string; isDefault: boolean;
};

type User = { name: string; email: string; creditMXN: number };

export function CustomCheckout({
  quote, addresses, user, publishableKey,
}: {
  quote: Quote; addresses: Addr[]; user: User; publishableKey: string;
}) {
  const stripePromise = useMemo(() => (publishableKey ? loadStripe(publishableKey) : null), [publishableKey]);

  const [tab, setTab] = useState<"card" | "spei" | "oxxo">("card");
  const [addressId, setAddressId] = useState<string | null>(addresses[0]?.id ?? null);
  const [adding, setAdding] = useState(addresses.length === 0);
  const [newAddr, setNewAddr] = useState({
    label: "Casa", street: "", exteriorNumber: "", interiorNumber: "",
    colonia: "", city: "", state: "", postalCode: "",
  });
  const [useCredit, setUseCredit] = useState(user.creditMXN > 0);
  const [summaryOpen, setSummaryOpen] = useState(false);

  const applied = useCredit ? Math.min(user.creditMXN, Math.max(0, quote.totalMXN - 10)) : 0;
  const charged = Math.max(0, quote.totalMXN - applied);

  async function resolveAddressId(): Promise<string | null> {
    if (!adding) return addressId;
    const r = await fetch("/api/addresses", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newAddr),
    });
    if (!r.ok) return null;
    const a = await r.json();
    return a.id;
  }

  const summary = (
    <div className="space-y-5">
      <Link href="/" className="text-lg font-bold text-[var(--ink)] flex items-center gap-1.5">
        BorderCart <span>🇲🇽🇺🇸</span>
      </Link>
      <div>
        <h2 className="text-lg font-semibold">Order Summary</h2>
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-white p-4 flex gap-4">
        <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-[var(--bg)] border border-[var(--border-soft)]">
          {quote.product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={quote.product.imageUrl} alt="" className="h-full w-full object-contain p-1" />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <Badge variant="orange" className="mb-1">{quote.product.store.toUpperCase()}</Badge>
          <p className="font-medium text-sm line-clamp-2">{quote.product.title}</p>
          <Badge variant="blue" className="mt-2">
            Delivered in {quote.deliveryDaysMin}–{quote.deliveryDaysMax} days
          </Badge>
        </div>
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-white p-5">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-[var(--ink-2)]">Delivered price</span>
          <span className="text-3xl font-extrabold text-[var(--blue)]">{formatMXN(charged)}</span>
        </div>
        {applied > 0 && (
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-[var(--ink-2)]">Subtotal {formatMXN(quote.totalMXN)} · credit</span>
            <span className="text-[var(--success)]">−{formatMXN(applied)}</span>
          </div>
        )}
        {user.creditMXN > 0 && (
          <label className="mt-3 flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={useCredit} onChange={(e) => setUseCredit(e.target.checked)} className="accent-[var(--orange)]" />
            Apply {formatMXN(user.creditMXN)} credit
          </label>
        )}
        <div className="my-4 h-px bg-[var(--border)]" />
        <p className="flex items-center gap-2 text-xs text-[var(--success)]">
          <CheckCircle2 className="h-4 w-4" />
          All duties and fees included
        </p>
        <p className="mt-1 flex items-center gap-2 text-xs text-[var(--ink-2)]">
          <Lock className="h-4 w-4" /> Secure checkout
        </p>
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-white p-4 flex items-center justify-around text-xs text-[var(--ink-2)]">
        <span className="flex items-center gap-1.5 font-semibold text-[var(--ink)]"><span className="text-[#635BFF] font-bold">Stripe</span></span>
        <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> 256-bit SSL</span>
        <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Buyer Protection</span>
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-4 text-sm text-[var(--ink-2)] text-center">
        Miles de mexicanos ya compran con BorderCart 🇲🇽
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="bg-[var(--navy)] text-white">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5 text-lg font-bold">
            BorderCart <span>🇲🇽🇺🇸</span>
          </Link>
          <div className="flex items-center gap-2 text-xs text-white/80">
            <Lock className="h-4 w-4" /> Pago seguro
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 md:py-10 grid md:grid-cols-[1fr_1.1fr] gap-6">
        <aside className="order-2 md:order-1">
          <details className="md:hidden rounded-lg bg-white border border-[var(--border)] p-4" open={summaryOpen} onToggle={(e) => setSummaryOpen((e.target as HTMLDetailsElement).open)}>
            <summary className="flex items-center justify-between cursor-pointer list-none">
              <span className="font-semibold">Order Summary — {formatMXN(charged)}</span>
              <ChevronDown className="h-4 w-4 transition-transform" />
            </summary>
            <div className="mt-4">{summary}</div>
          </details>
          <div className="hidden md:block rounded-lg bg-white border border-[var(--border)] shadow-sm p-6">
            {summary}
          </div>
        </aside>

        <section className="order-1 md:order-2 rounded-lg bg-white border border-[var(--border)] shadow-sm p-5 md:p-8">
          <h1 className="text-2xl font-bold">Completa tu pago</h1>

          <div className="mt-6">
            <h3 className="text-sm font-semibold mb-3">Dirección de envío</h3>
            {addresses.length > 0 && !adding && (
              <div className="space-y-2">
                {addresses.map((a) => (
                  <label key={a.id} className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 ${addressId === a.id ? "border-[var(--blue)] bg-[var(--blue-light)]" : "border-[var(--border)] bg-white"}`}>
                    <input type="radio" checked={addressId === a.id} onChange={() => setAddressId(a.id)} className="mt-1 accent-[var(--blue)]" />
                    <div>
                      <p className="font-medium text-sm">{a.label}</p>
                      <p className="text-xs text-[var(--ink-2)]">
                        {a.street}{a.exteriorNumber ? ` ${a.exteriorNumber}` : ""}{a.interiorNumber ? `, Int. ${a.interiorNumber}` : ""}
                        {a.colonia ? `, ${a.colonia}` : ""}, {a.city}, {a.state} {a.postalCode}
                      </p>
                    </div>
                  </label>
                ))}
                <button onClick={() => setAdding(true)} className="text-sm text-[var(--blue)] hover:underline">+ Agregar nueva dirección</button>
              </div>
            )}
            {adding && <AddressForm value={newAddr} onChange={setNewAddr} onCancel={addresses.length ? () => setAdding(false) : undefined} />}
          </div>

          <div className="mt-8 border-b border-[var(--border)]">
            <div className="grid grid-cols-3">
              <TabButton active={tab === "card"} onClick={() => setTab("card")} icon={<CreditCard className="h-4 w-4" />} label="Tarjeta" />
              <TabButton active={tab === "spei"} onClick={() => setTab("spei")} icon={<Building2 className="h-4 w-4" />} label="SPEI" />
              <TabButton active={tab === "oxxo"} onClick={() => setTab("oxxo")} icon={<Store className="h-4 w-4" />} label="OXXO" />
            </div>
          </div>

          <div className="mt-6">
            {!stripePromise && (
              <div className="rounded-md border border-red-300 bg-red-50 p-4 text-sm text-[var(--danger)]">
                Stripe is not configured — set STRIPE_PUBLISHABLE_KEY in environment.
              </div>
            )}
            {stripePromise && (
              <Elements stripe={stripePromise} options={{ appearance: { theme: "stripe" } }}>
                {tab === "card" && (
                  <CardTab quoteId={quote.id} charged={charged} resolveAddressId={resolveAddressId} useCredit={useCredit} />
                )}
                {tab === "spei" && (
                  <SpeiTab quoteId={quote.id} charged={charged} resolveAddressId={resolveAddressId} useCredit={useCredit} />
                )}
                {tab === "oxxo" && (
                  <OxxoTab
                    quoteId={quote.id}
                    charged={charged}
                    resolveAddressId={resolveAddressId}
                    useCredit={useCredit}
                    initialName={user.name}
                    initialEmail={user.email}
                  />
                )}
              </Elements>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors ${active ? "border-[var(--blue)] text-[var(--blue)]" : "border-transparent text-[var(--ink-2)] hover:text-[var(--ink)]"}`}
    >
      {icon}
      {label}
    </button>
  );
}

function AddressForm({
  value, onChange, onCancel,
}: {
  value: { label: string; street: string; exteriorNumber: string; interiorNumber: string; colonia: string; city: string; state: string; postalCode: string };
  onChange: (v: any) => void;
  onCancel?: () => void;
}) {
  const field = (k: keyof typeof value, placeholder: string, extra = "") => (
    <input
      className={`h-11 rounded-md border border-[var(--border)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--blue)] focus:border-[var(--blue)] ${extra}`}
      placeholder={placeholder}
      value={value[k]}
      onChange={(e) => onChange({ ...value, [k]: e.target.value })}
    />
  );
  return (
    <div className="grid gap-3 mt-2">
      {field("street", "Calle", "w-full")}
      <div className="grid grid-cols-2 gap-3">
        {field("exteriorNumber", "Número exterior")}
        {field("interiorNumber", "Número interior (opcional)")}
      </div>
      {field("colonia", "Colonia", "w-full")}
      <div className="grid grid-cols-2 gap-3">
        {field("city", "Ciudad")}
        {field("state", "Estado")}
      </div>
      {field("postalCode", "CP", "w-full")}
      {onCancel && (
        <button type="button" onClick={onCancel} className="text-left text-sm text-[var(--ink-2)] hover:text-[var(--ink)]">
          Usar dirección guardada
        </button>
      )}
    </div>
  );
}
