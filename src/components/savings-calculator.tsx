"use client";

import { useState } from "react";
import { futureValue } from "@/lib/savings";
import { formatCurrency } from "@/lib/format";

// Interactive savings growth calculator. Numbers update instantly; submitting
// the GET form reloads so the server can show matching savings products.
export function SavingsCalculator({
  defaults,
  currency = "NGN",
}: {
  defaults: { deposit: number; rate: number; years: number; monthly: number };
  currency?: string;
}) {
  const [deposit, setDeposit] = useState(defaults.deposit);
  const [rate, setRate] = useState(defaults.rate);
  const [years, setYears] = useState(defaults.years);
  const [monthly, setMonthly] = useState(defaults.monthly);

  const fv = futureValue(deposit, rate, years, monthly);
  const contributed = deposit + monthly * Math.round(years * 12);
  const interest = fv - contributed;

  return (
    <form
      method="GET"
      action="/calculators/savings-growth"
      className="rounded-2xl border border-border p-5"
    >
      <div className="grid gap-4 sm:grid-cols-4">
        <NumberField label="Initial deposit" name="deposit" value={deposit} onChange={setDeposit} step={10000} />
        <NumberField label="Interest rate (% p.a.)" name="rate" value={rate} onChange={setRate} step={0.5} />
        <NumberField label="Period (years)" name="years" value={years} onChange={setYears} step={1} />
        <NumberField label="Monthly top-up" name="monthly" value={monthly} onChange={setMonthly} step={5000} />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Result label="Future value" value={formatCurrency(fv, currency)} primary />
        <Result label="You put in" value={formatCurrency(contributed, currency)} />
        <Result label="Interest earned" value={formatCurrency(interest, currency)} />
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Monthly compounding estimate. Actual returns depend on the
        provider&apos;s terms, tiers and tax.
      </p>

      <button
        type="submit"
        className="mt-4 h-11 w-full rounded-lg bg-brand px-4 font-medium text-brand-foreground hover:bg-brand/90 sm:w-auto"
      >
        Find matching products
      </button>
    </form>
  );
}

function NumberField({
  label,
  name,
  value,
  onChange,
  step,
}: {
  label: string;
  name: string;
  value: number;
  onChange: (n: number) => void;
  step: number;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium">{label}</span>
      <input
        type="number"
        name={name}
        value={value}
        min={0}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-11 w-full rounded-lg border border-border bg-background px-3"
      />
    </label>
  );
}

function Result({
  label,
  value,
  primary = false,
}: {
  label: string;
  value: string;
  primary?: boolean;
}) {
  return (
    <div className={`rounded-xl p-4 ${primary ? "bg-brand text-brand-foreground" : "bg-muted"}`}>
      <div className={`text-xs ${primary ? "text-brand-foreground/80" : "text-muted-foreground"}`}>
        {label}
      </div>
      <div className="mt-1 text-xl font-bold">{value}</div>
    </div>
  );
}
