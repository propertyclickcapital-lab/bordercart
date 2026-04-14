"use client";

import { useState } from "react";
import { CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { formatMXN } from "@/lib/utils/currency";

const ELEMENT_STYLE = {
  base: {
    fontSize: "14px",
    color: "#0f1111",
    fontFamily: "Inter, system-ui, sans-serif",
    "::placeholder": { color: "#888888" },
  },
  invalid: { color: "#c40000" },
};

export function CardTab({
  quoteId, charged, resolveAddressId, useCredit,
}: {
  quoteId: string; charged: number; resolveAddressId: () => Promise<string | null>; useCredit: boolean;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function pay() {
    if (!stripe || !elements) return;
    setErr(null);
    setLoading(true);
    try {
      const addressId = await resolveAddressId();
      if (!addressId) {
        setErr("Completa tu dirección de envío");
        setLoading(false);
        return;
      }

      const r = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId, addressId, useCredit, method: "card" }),
      });
      const data = await r.json();
      if (!r.ok || !data.clientSecret) {
        setErr(data.error || "No pudimos crear el pago");
        setLoading(false);
        return;
      }

      const cardEl = elements.getElement(CardNumberElement);
      if (!cardEl) { setLoading(false); return; }

      const result = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: { card: cardEl, billing_details: { name } },
      });

      if (result.error) {
        setErr(result.error.message || "El pago falló");
        setLoading(false);
        return;
      }

      if (result.paymentIntent?.status === "succeeded") {
        await fetch("/api/checkout/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentIntentId: result.paymentIntent.id, orderId: data.orderId }),
        });
        window.location.href = `/orders/${data.orderId}?success=1`;
        return;
      }
      setErr("Estado de pago inesperado. Vuelve a intentar.");
      setLoading(false);
    } catch (e: any) {
      setErr(e?.message || "Algo salió mal");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <Field label="Número de tarjeta">
        <div className="h-11 rounded-md border border-[var(--border)] px-3 flex items-center">
          <CardNumberElement options={{ style: ELEMENT_STYLE }} className="w-full" />
        </div>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Expiración">
          <div className="h-11 rounded-md border border-[var(--border)] px-3 flex items-center">
            <CardExpiryElement options={{ style: ELEMENT_STYLE }} className="w-full" />
          </div>
        </Field>
        <Field label="CVC">
          <div className="h-11 rounded-md border border-[var(--border)] px-3 flex items-center">
            <CardCvcElement options={{ style: ELEMENT_STYLE }} className="w-full" />
          </div>
        </Field>
      </div>
      <Field label="Nombre en la tarjeta">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-11 w-full rounded-md border border-[var(--border)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--blue)] focus:border-[var(--blue)]"
          placeholder="Juan Pérez"
        />
      </Field>

      {err && <p className="text-sm text-[var(--danger)]">{err}</p>}

      <button
        onClick={pay}
        disabled={!stripe || loading}
        className="w-full h-[52px] rounded-lg bg-[var(--blue)] hover:bg-[var(--blue-dark)] disabled:opacity-70 text-white font-semibold text-base transition-colors"
      >
        {loading ? "Procesando..." : `Pagar ${formatMXN(charged)}`}
      </button>
      <p className="text-center text-xs text-[var(--ink-2)]">Tu tarjeta será cobrada inmediatamente</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-[var(--ink)] mb-1">{label}</span>
      {children}
    </label>
  );
}
