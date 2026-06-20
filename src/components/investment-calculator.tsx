"use client";

import { useState } from "react";
import { futureValue } from "@/lib/savings";
import { formatCurrency } from "@/lib/format";

// Investment growth projection (compound, with optional monthly contributions).
// Reuses the savings compound-interest maths.
export function InvestmentCalculator({
  defaults,
  currency = "NGN",
}: {
  defaults: { amount: number; rate: number; years: number; monthly: number };
  currency?: string;
}) {
  const [amount, setAmount] = useState(defaults.amount);
  const [rate, setRate] = useState(defaults.rate);
  const [years, setYears] = useState(defaults.years);
  const [monthly, setMonthly] = useState(defaults.monthly);

  const fv = futureValue(amount, rate, years, monthly);
  const contributed = amount + monthly * Math.round(years * 12);

  return (
    <form
      method="GET"
      action="/calculators/investment-growth"
      className="rounded-2xl border border-border p-5"
    >
      <div className="grid gap-4 sm:grid-cols-4">
        <Field label="Initial amount" name="amount" value={amount} onChange={setAmount} step={50000} />
        <Field label="Expected return (% p.a.)" name="rate" value={rate} onChange={setRate} step={0.5} />
        <Field label="Years" name="years" value={years} onChange={setYears} step={1} />
        <Field label="Monthly top-up" name="monthly" value={monthly} onChange={setMonthly} step={10000} />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Result label="Projected value" value={formatCurrency(fv, currency)} primary />
        <Result label="You invest" value={formatCurrency(contributed, currency)} />
        <Result label="Growth" value={formatCurrency(fv - contributed, currency)} />
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Projection only — investment returns are not guaranteed and may be
        negative. Past performance doesn&apos;t predict future returns.
      </p>
      <button
        type="submit"
        className="mt-4 h-11 w-full rounded-lg bg-brand px-4 font-medium text-brand-foreground hover:bg-brand/90 sm:w-auto"
      >
        See matching funds
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
