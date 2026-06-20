"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/format";

// What actually arrives after the transfer fee + FX margin.
export function RemittanceCalculator({
  defaults,
  currency = "NGN",
}: {
  defaults: { amount: number; feePct: number; fxMargin: number };
  currency?: string;
}) {
  const [amount, setAmount] = useState(defaults.amount);
  const [feePct, setFeePct] = useState(defaults.feePct);
  const [fxMargin, setFxMargin] = useState(defaults.fxMargin);

  const fee = (amount * feePct) / 100;
  const received = (amount - fee) * (1 - fxMargin / 100);
  const totalCost = amount - received;

  return (
    <form
      method="GET"
      action="/calculators/remittance-cost"
      className="rounded-2xl border border-border p-5"
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Send amount" name="amount" value={amount} onChange={setAmount} step={10000} />
        <Field label="Transfer fee (%)" name="feePct" value={feePct} onChange={setFeePct} step={0.5} />
        <Field label="FX margin (%)" name="fxMargin" value={fxMargin} onChange={setFxMargin} step={0.5} />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Result label="Recipient gets (value)" value={formatCurrency(received, currency)} primary />
        <Result label="Total cost" value={formatCurrency(totalCost, currency)} />
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Estimate. The FX margin (the gap from the mid-market rate) is often the
        bigger cost than the visible fee — compare both.
      </p>
      <button
        type="submit"
        className="mt-4 h-11 w-full rounded-lg bg-brand px-4 font-medium text-brand-foreground hover:bg-brand/90 sm:w-auto"
      >
        See cheaper transfers
      </button>
    </form>
  );
}

function Field({ label, name, value, onChange, step }: { label: string; name: string; value: number; onChange: (n: number) => void; step: number }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium">{label}</span>
      <input type="number" name={name} value={value} min={0} step={step} onChange={(e) => onChange(Number(e.target.value))} className="h-11 w-full rounded-lg border border-border bg-background px-3" />
    </label>
  );
}
function Result({ label, value, primary = false }: { label: string; value: string; primary?: boolean }) {
  return (
    <div className={`rounded-xl p-4 ${primary ? "bg-brand text-brand-foreground" : "bg-muted"}`}>
      <div className={`text-xs ${primary ? "text-brand-foreground/80" : "text-muted-foreground"}`}>{label}</div>
      <div className="mt-1 text-xl font-bold">{value}</div>
    </div>
  );
}
