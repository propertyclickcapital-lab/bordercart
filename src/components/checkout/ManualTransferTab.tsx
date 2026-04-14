"use client";

import { useRef, useState } from "react";
import { Landmark, Copy, UploadCloud, CheckCircle2, AlertCircle, X } from "lucide-react";
import { formatMXN } from "@/lib/utils/currency";
import { useToast } from "@/components/ui/toast";

export type BankDetails = {
  bankName: string;
  accountName: string;
  clabe: string;
  accountNumber: string;
};

export function ManualTransferTab({
  quoteId, charged, useCredit, resolveAddressId, bank, previewOrderId,
}: {
  quoteId: string;
  charged: number;
  useCredit: boolean;
  resolveAddressId: () => Promise<string | null>;
  bank: BankDetails;
  previewOrderId: string;
}) {
  const [imageData, setImageData] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<{ orderId: string } | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  async function copy(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast({ title: `${label} copiado`, variant: "success" });
    } catch {}
  }

  function handleFile(file: File) {
    if (!file) return;
    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      setErr("El archivo es muy grande (máx. 5MB)");
      return;
    }
    if (!/^(image\/|application\/pdf)/.test(file.type)) {
      setErr("Sube una imagen o PDF");
      return;
    }
    setErr(null);
    const reader = new FileReader();
    reader.onload = () => {
      setImageData(reader.result as string);
      setImageName(file.name);
    };
    reader.readAsDataURL(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }

  async function confirm() {
    if (!imageData) {
      setErr("Sube tu comprobante antes de continuar");
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const addressId = await resolveAddressId();
      if (!addressId) {
        setErr("Completa tu dirección de envío");
        setLoading(false);
        return;
      }
      const r = await fetch("/api/checkout/manual-transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId, addressId, useCredit, confirmationImage: imageData }),
      });
      const data = await r.json();
      if (!r.ok || !data.success) {
        setErr(data.error || "No pudimos registrar tu comprobante");
        setLoading(false);
        return;
      }
      setDone({ orderId: data.orderId });
    } catch (e: any) {
      setErr(e?.message || "Algo salió mal");
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="text-center py-8">
        <style>{`
          .bc-check-svg circle { stroke-dasharray: 283; stroke-dashoffset: 283; animation: bc-c 0.7s cubic-bezier(0.16,1,0.3,1) forwards; }
          .bc-check-svg path { stroke-dasharray: 60; stroke-dashoffset: 60; animation: bc-t 0.35s cubic-bezier(0.16,1,0.3,1) 0.55s forwards; }
          @keyframes bc-c { to { stroke-dashoffset: 0; } }
          @keyframes bc-t { to { stroke-dashoffset: 0; } }
        `}</style>
        <svg viewBox="0 0 100 100" className="bc-check-svg h-20 w-20 mx-auto" aria-hidden>
          <circle cx="50" cy="50" r="45" fill="none" stroke="#067d62" strokeWidth="5" />
          <path d="M30 52 L45 67 L72 38" fill="none" stroke="#067d62" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <h2 className="mt-5 text-xl font-bold">¡Comprobante recibido!</h2>
        <p className="mt-2 text-sm text-[var(--ink-2)] max-w-sm mx-auto">
          Confirmaremos tu pago en 1–2 horas y activaremos tu pedido.
        </p>
        <a
          href={`/orders/${done.orderId}`}
          className="mt-8 inline-flex items-center justify-center h-[52px] px-6 rounded-lg bg-[var(--blue)] hover:bg-[var(--blue-dark)] text-white font-semibold"
        >
          Ver mi pedido →
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-semibold text-[var(--ink)]">Realiza tu pago a esta cuenta</h3>
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-white p-5 space-y-3">
        <Row label="Banco" value={bank.bankName} />
        <Row label="Titular" value={bank.accountName} />
        <Row label="CLABE" value={bank.clabe} onCopy={() => copy(bank.clabe, "CLABE")} />
        <Row label="Cuenta" value={bank.accountNumber} onCopy={() => copy(bank.accountNumber, "Cuenta")} />
        <Row label="Referencia" value={previewOrderId} onCopy={() => copy(previewOrderId, "Referencia")} highlight />

        <div className="mt-4 rounded-md border border-amber-300 bg-amber-50 p-3 flex items-start gap-2">
          <span className="text-lg">⚡</span>
          <p className="text-xs text-[var(--ink)]">
            Usa el número de <strong>referencia</strong> al hacer tu transferencia para que podamos identificar tu pago automáticamente.
          </p>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs uppercase tracking-wider text-[var(--ink-2)]">Monto a transferir</p>
          <p className="mt-1 text-3xl font-extrabold text-[var(--blue)]">{formatMXN(charged)}</p>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-[var(--ink)]">¿Ya realizaste tu transferencia?</h3>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
          className={`mt-3 cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors ${dragging ? "border-[var(--blue)] bg-[var(--blue-light)]" : "border-[var(--border)] bg-white hover:border-[var(--blue)]/50"}`}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          {imageData ? (
            <div className="space-y-2">
              {imageData.startsWith("data:image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageData} alt="preview" className="mx-auto max-h-56 rounded-md border border-[var(--border)]" />
              ) : (
                <div className="text-sm text-[var(--ink)]">📄 {imageName}</div>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); setImageData(null); setImageName(null); }}
                className="mt-2 inline-flex items-center gap-1 text-xs text-[var(--ink-2)] hover:text-[var(--danger)]"
              >
                <X className="h-3 w-3" /> Quitar
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <UploadCloud className="h-8 w-8 text-[var(--ink-3)]" />
              <p className="text-sm text-[var(--ink-2)]">
                <span className="text-[var(--blue)] font-semibold">Arrastra tu comprobante aquí</span> o haz clic para subir
              </p>
              <p className="text-xs text-[var(--ink-3)]">PNG, JPG o PDF · máx. 5MB</p>
            </div>
          )}
        </div>
      </div>

      {err && (
        <div className="flex items-start gap-2 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-[var(--danger)]">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{err}</span>
        </div>
      )}

      <button
        onClick={confirm}
        disabled={loading || !imageData}
        className="w-full h-[52px] rounded-lg bg-[var(--blue)] hover:bg-[var(--blue-dark)] disabled:opacity-60 text-white font-semibold text-base transition-colors"
      >
        {loading ? "Enviando..." : "Confirmar pago"}
      </button>
      <p className="text-center text-xs text-[var(--ink-2)]">
        Recibirás un email de confirmación. Activamos tu pedido al verificar.
      </p>
    </div>
  );
}

function Row({ label, value, onCopy, highlight }: { label: string; value: string; onCopy?: () => void; highlight?: boolean }) {
  return (
    <div className={`flex items-center justify-between rounded-md border px-3 py-2 ${highlight ? "border-[var(--blue)] bg-[var(--blue-light)]" : "border-[var(--border)] bg-white"}`}>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-[var(--ink-2)]">{label}</p>
        <p className={`font-mono text-sm truncate ${highlight ? "font-semibold text-[var(--blue-dark)]" : ""}`}>{value}</p>
      </div>
      {onCopy && (
        <button onClick={onCopy} className="ml-3 inline-flex items-center gap-1 text-xs text-[var(--blue)] hover:underline flex-shrink-0">
          <Copy className="h-3 w-3" /> Copiar
        </button>
      )}
    </div>
  );
}
