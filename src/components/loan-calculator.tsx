"use client";

import { useState } from "react";
import { monthlyPayment, totalRepayment } from "@/lib/loan";
import { formatCurrency } from "@/lib/format";

// Interactive loan repayment calculator. The numbers update instantly in the
// browser; submitting the form (GET) reloads the page so the server can show
// matching products for the chosen amount/tenure.
export function LoanCalculator({
  defaults,
}: {
  defaults: { amount: number; rate: number; tenure: number };
}) {
  const [amount, setAmount] = useState(defaults.amount);
  const [rate, setRate] = useState(defaults.rate);
  const [tenure, setTenure] = useState(defaults.tenure);

  const monthly = monthlyPayment(amount, rate, tenure);
  const total = totalRepayment(amount, rate, tenure);
  const interest = total - amount;

  return (
    <form
      method="GET"
      action="/calculators/loan-repayment"
      className="rounded-2xl border border-border p-5"
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <NumberField
          label="Amount (₦)"
          name="amount"
          value={amount}
          onChange={setAmount}
          step={10000}
          min={0}
        />
        <NumberField
          label="Interest rate (% p.a.)"
          name="rate"
          value={rate}
          onChange={setRate}
          step={0.5}
          min={0}
        />
        <NumberField
          label="Tenure (months)"
          name="tenure"
          value={tenure}
          onChange={setTenure}
          step={1}
          min={1}
        />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Result label="Monthly repayment" value={formatCurrency(monthly)} primary />
        <Result label="Total repayment" value={formatCurrency(total)} />
        <Result label="Total interest" value={formatCurrency(interest)} />
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Reducing-balance estimate, interest only — excludes provider fees. Actual
        repayments depend on the provider&apos;s terms.
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
  min,
}: {
  label: string;
  name: string;
  value: number;
  onChange: (n: number) => void;
  step: number;
  min: number;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium">{label}</span>
      <input
        type="number"
        name={name}
        value={value}
        min={min}
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
    <div
      className={`rounded-xl p-4 ${
        primary ? "bg-brand text-brand-foreground" : "bg-muted"
      }`}
    >
      <div
        className={`text-xs ${primary ? "text-brand-foreground/80" : "text-muted-foreground"}`}
      >
        {label}
      </div>
      <div className="mt-1 text-xl font-bold">{value}</div>
    </div>
  );
}
