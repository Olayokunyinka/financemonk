"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/format";

// How long a credit-card balance takes to clear at a fixed monthly payment, and
// the total interest. Revolving-credit payoff (iterated month by month).
function payoff(balance: number, annualRatePct: number, monthlyPayment: number) {
  const r = annualRatePct / 100 / 12;
  let bal = balance;
  let months = 0;
  let interest = 0;
  // If the payment doesn't cover the first month's interest, it never clears.
  if (monthlyPayment <= bal * r) return { months: Infinity, interest: Infinity };
  while (bal > 0 && months < 600) {
    const monthInterest = bal * r;
    interest += monthInterest;
    bal = bal + monthInterest - monthlyPayment;
    months++;
  }
  return { months, interest };
}

export function CreditCardCalculator({
  defaults,
  currency = "NGN",
}: {
  defaults: { balance: number; apr: number; payment: number };
  currency?: string;
}) {
  const [balance, setBalance] = useState(defaults.balance);
  const [apr, setApr] = useState(defaults.apr);
  const [payment, setPayment] = useState(defaults.payment);

  const { months, interest } = payoff(balance, apr, payment);
  const neverClears = !Number.isFinite(months);

  return (
    <form
      method="GET"
      action="/calculators/credit-card-cost"
      className="rounded-2xl border border-border p-5"
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <NumberField label="Balance" name="balance" value={balance} onChange={setBalance} step={10000} />
        <NumberField label="Purchase APR (% p.a.)" name="apr" value={apr} onChange={setApr} step={1} />
        <NumberField label="Monthly payment" name="payment" value={payment} onChange={setPayment} step={5000} />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Result
          label="Time to clear"
          value={neverClears ? "Never — payment too low" : `${months} months`}
          primary
        />
        <Result
          label="Total interest"
          value={neverClears ? "—" : formatCurrency(interest, currency)}
        />
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Estimate only. Pay your statement in full within the interest-free period
        to avoid purchase interest entirely.
      </p>

      <button
        type="submit"
        className="mt-4 h-11 w-full rounded-lg bg-brand px-4 font-medium text-brand-foreground hover:bg-brand/90 sm:w-auto"
      >
        Find lower-rate cards
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
