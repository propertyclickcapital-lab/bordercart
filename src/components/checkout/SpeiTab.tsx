"use client";

import { useState } from "react";
import { Building2, Copy, CheckCircle2 } from "lucide-react";
import { formatMXN } from "@/lib/utils/currency";
import { useToast } from "@/components/ui/toast";

type Instructions = {
  clabe?: string;
  bankName?: string;
  accountNumber?: string;
  accountHolderName?: string;
  reference?: string;
  amountRemaining?: number;
};

export function SpeiTab({
  quoteId, charged, resolveAddressId, useCredit,
}: {
  quoteId: string; charged: number; resolveAddressId: () => Promise<string | null>; useCredit: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [instructions, setInstructions] = useState<Instructions | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const { toast } = useToast();

  async function generate() {
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
        body: JSON.stringify({ quoteId, addressId, useCredit, method: "spei" }),
      });
      const data = await r.json();
      if (!r.ok) {
        setErr(data.error || "No pudimos generar el SPEI");
        setLoading(false);
        return;
      }

      setOrderId(data.orderId);
      const dbti = data?.nextAction?.display_bank_transfer_instructions;
      const addr = dbti?.financial_addresses?.[0];
      const spei = addr?.spei;
      setInstructions({
        clabe: spei?.clabe || addr?.clabe?.clabe || "—",
        bankName: spei?.bank_name || "—",
        accountNumber: spei?.account_number || undefined,
        accountHolderName: dbti?.reference_holder_name || undefined,
        reference: dbti?.reference || undefined,
        amountRemaining: (dbti?.amount_remaining ?? 0) / 100 || charged,
      });
      setLoading(false);
    } catch (e: any) {
      setErr(e?.message || "Algo salió mal");
      setLoading(false);
    }
  }

  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: `${label} copiado`, variant: "success" });
    } catch {}
  }

  if (instructions) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-[var(--blue)] bg-[var(--blue-light)] p-5">
          <div className="flex items-center gap-2 text-[var(--blue-dark)]">
            <Building2 className="h-5 w-5" />
            <h3 className="font-semibold">Transferencia bancaria SPEI</h3>
          </div>
          <p className="mt-1 text-sm text-[var(--ink-2)]">Tu pedido se procesará al confirmar el pago.</p>

          <div className="mt-5 space-y-3">
            <Row label="CLABE" value={instructions.clabe || "—"} onCopy={() => copy(instructions.clabe || "", "CLABE")} />
            <Row label="Banco" value={instructions.bankName || "—"} />
            {instructions.accountHolderName && <Row label="Beneficiario" value={instructions.accountHolderName} />}
            {instructions.reference && <Row label="Referencia" value={instructions.reference} onCopy={() => copy(instructions.reference || "", "Referencia")} />}
            <Row label="Monto" value={formatMXN(instructions.amountRemaining || charged)} />
          </div>
        </div>
        <p className="text-xs text-[var(--ink-2)] text-center">Los pagos SPEI se confirman en 1–2 horas.</p>
        {orderId && (
          <a href={`/orders/${orderId}`} className="block w-full text-center h-[52px] leading-[52px] rounded-lg bg-[var(--blue)] hover:bg-[var(--blue-dark)] text-white font-semibold">
            Ir a mi pedido
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-[var(--border)] bg-white p-5">
        <div className="flex items-center gap-2 text-[var(--ink)]">
          <Building2 className="h-5 w-5 text-[var(--blue)]" />
          <h3 className="font-semibold">Transferencia bancaria SPEI</h3>
        </div>
        <p className="mt-2 text-sm text-[var(--ink-2)]">
          Al generar recibirás una CLABE y referencia. Puedes pagar desde cualquier banco mexicano.
        </p>
      </div>
      {err && <p className="text-sm text-[var(--danger)]">{err}</p>}
      <button
        onClick={generate}
        disabled={loading}
        className="w-full h-[52px] rounded-lg bg-[var(--blue)] hover:bg-[var(--blue-dark)] disabled:opacity-70 text-white font-semibold text-base transition-colors"
      >
        {loading ? "Generando..." : `Generar CLABE · ${formatMXN(charged)}`}
      </button>
      <p className="text-center text-xs text-[var(--ink-2)]">Los pagos SPEI se confirman en 1–2 horas.</p>
    </div>
  );
}

function Row({ label, value, onCopy }: { label: string; value: string; onCopy?: () => void }) {
  return (
    <div className="flex items-center justify-between bg-white rounded-md border border-[var(--border)] px-3 py-2">
      <div>
        <p className="text-[10px] uppercase tracking-wider text-[var(--ink-2)]">{label}</p>
        <p className="font-mono text-sm">{value}</p>
      </div>
      {onCopy && (
        <button onClick={onCopy} className="text-xs text-[var(--blue)] hover:underline flex items-center gap-1">
          <Copy className="h-3 w-3" /> Copiar
        </button>
      )}
    </div>
  );
}
