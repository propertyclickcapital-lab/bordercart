"use client";

import { useState } from "react";
import { useStripe } from "@stripe/react-stripe-js";
import { Store, Copy } from "lucide-react";
import { formatMXN } from "@/lib/utils/currency";
import { useToast } from "@/components/ui/toast";

type Voucher = {
  number?: string;
  expiresAt?: number;
  hostedVoucherUrl?: string;
};

export function OxxoTab({
  quoteId, charged, resolveAddressId, useCredit, initialName, initialEmail,
}: {
  quoteId: string;
  charged: number;
  resolveAddressId: () => Promise<string | null>;
  useCredit: boolean;
  initialName: string;
  initialEmail: string;
}) {
  const stripe = useStripe();
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [voucher, setVoucher] = useState<Voucher | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const { toast } = useToast();

  async function generate() {
    if (!stripe) return;
    setErr(null);
    setLoading(true);
    try {
      if (!name.trim() || !email.trim()) {
        setErr("Nombre y email son requeridos");
        setLoading(false);
        return;
      }
      const addressId = await resolveAddressId();
      if (!addressId) {
        setErr("Completa tu dirección de envío");
        setLoading(false);
        return;
      }

      const r = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId, addressId, useCredit, method: "oxxo" }),
      });
      const data = await r.json();
      if (!r.ok || !data.clientSecret) {
        setErr(data.error || "No pudimos generar el voucher");
        setLoading(false);
        return;
      }
      setOrderId(data.orderId);

      const result = await stripe.confirmOxxoPayment(data.clientSecret, {
        payment_method: { billing_details: { name, email } },
      });

      if (result.error) {
        setErr(result.error.message || "No pudimos generar el voucher");
        setLoading(false);
        return;
      }

      const pi = result.paymentIntent;
      const oxxo = (pi?.next_action as any)?.oxxo_display_details;
      setVoucher({
        number: oxxo?.number,
        expiresAt: oxxo?.expires_after,
        hostedVoucherUrl: oxxo?.hosted_voucher_url,
      });
      setLoading(false);
    } catch (e: any) {
      setErr(e?.message || "Algo salió mal");
      setLoading(false);
    }
  }

  async function copyVoucher() {
    if (!voucher?.number) return;
    try {
      await navigator.clipboard.writeText(voucher.number);
      toast({ title: "Número copiado", variant: "success" });
    } catch {}
  }

  if (voucher) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-[var(--orange)] bg-[var(--orange-light)] p-5">
          <div className="flex items-center gap-2 text-[var(--orange-dark)]">
            <Store className="h-5 w-5" />
            <h3 className="font-semibold">Tu voucher OXXO</h3>
          </div>
          <p className="mt-2 text-sm text-[var(--ink-2)]">Presenta este número en cualquier OXXO de México.</p>
          <div className="mt-5 bg-white rounded-md border border-[var(--border)] p-4">
            <p className="text-[10px] uppercase tracking-wider text-[var(--ink-2)]">Número de voucher</p>
            <p className="font-mono text-lg sm:text-2xl break-all">{voucher.number || "—"}</p>
            <button onClick={copyVoucher} className="mt-2 inline-flex items-center gap-1 text-xs text-[var(--blue)] hover:underline">
              <Copy className="h-3 w-3" /> Copiar
            </button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div className="bg-white rounded-md border border-[var(--border)] p-3">
              <p className="text-[10px] uppercase tracking-wider text-[var(--ink-2)]">Monto</p>
              <p className="font-bold">{formatMXN(charged)}</p>
            </div>
            <div className="bg-white rounded-md border border-[var(--border)] p-3">
              <p className="text-[10px] uppercase tracking-wider text-[var(--ink-2)]">Vence en</p>
              <p className="font-bold">48 horas</p>
            </div>
          </div>
          {voucher.hostedVoucherUrl && (
            <a href={voucher.hostedVoucherUrl} target="_blank" rel="noopener noreferrer" className="mt-4 block text-center text-sm text-[var(--blue)] hover:underline">
              Descargar voucher PDF →
            </a>
          )}
        </div>
        <p className="text-xs text-[var(--ink-2)] text-center">Los pagos OXXO se confirman en 1–4 horas.</p>
        {orderId && (
          <a href={`/orders/${orderId}`} className="block w-full text-center h-[52px] leading-[52px] rounded-lg bg-[var(--blue)] hover:bg-[var(--blue-dark)] text-white font-semibold">
            Ir a mi pedido
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-[var(--border)] bg-white p-5">
        <div className="flex items-center gap-2">
          <Store className="h-5 w-5 text-[var(--orange)]" />
          <h3 className="font-semibold">Pago en efectivo en OXXO</h3>
        </div>
        <p className="mt-2 text-sm text-[var(--ink-2)]">Genera un voucher y paga en cualquier OXXO de México.</p>
      </div>
      <label className="block">
        <span className="block text-xs font-semibold text-[var(--ink)] mb-1">Nombre completo</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-11 w-full rounded-md border border-[var(--border)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--blue)] focus:border-[var(--blue)]"
        />
      </label>
      <label className="block">
        <span className="block text-xs font-semibold text-[var(--ink)] mb-1">Email</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-11 w-full rounded-md border border-[var(--border)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--blue)] focus:border-[var(--blue)]"
        />
      </label>

      {err && <p className="text-sm text-[var(--danger)]">{err}</p>}

      <button
        onClick={generate}
        disabled={!stripe || loading}
        className="w-full h-[52px] rounded-lg bg-[var(--blue)] hover:bg-[var(--blue-dark)] disabled:opacity-70 text-white font-semibold text-base transition-colors"
      >
        {loading ? "Generando..." : `Generar voucher OXXO · ${formatMXN(charged)}`}
      </button>
      <p className="text-center text-xs text-[var(--ink-2)]">Los pagos OXXO se confirman en 1–4 horas.</p>
    </div>
  );
}
