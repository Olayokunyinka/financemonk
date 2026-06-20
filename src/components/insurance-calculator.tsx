"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/format";

// Simple life-cover needs estimate: replace income for N years + clear debts.
export function InsuranceNeedsCalculator({
  defaults,
  currency = "NGN",
}: {
  defaults: { income: number; years: number; debts: number };
  currency?: string;
}) {
  const [income, setIncome] = useState(defaults.income);
  const [years, setYears] = useState(defaults.years);
  const [debts, setDebts] = useState(defaults.debts);

  const cover = income * years + debts;

  return (
    <form
      method="GET"
      action="/calculators/insurance-needs"
      className="rounded-2xl border border-border p-5"
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Annual income" name="income" value={income} onChange={setIncome} step={100000} />
        <Field label="Years to cover" name="years" value={years} onChange={setYears} step={1} />
        <Field label="Debts to clear" name="debts" value={debts} onChange={setDebts} step={100000} />
      </div>
      <div className="mt-5">
        <div className="rounded-xl bg-brand p-4 text-brand-foreground">
          <div className="text-xs text-brand-foreground/80">
            Suggested life cover
          </div>
          <div className="mt-1 text-2xl font-bold">
            {formatCurrency(cover, currency)}
          </div>
        </div>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Rule-of-thumb estimate (income replacement + debts). Your actual needs
        depend on dependants, assets and goals.
      </p>
      <button
        type="submit"
        className="mt-4 h-11 w-full rounded-lg bg-brand px-4 font-medium text-brand-foreground hover:bg-brand/90 sm:w-auto"
      >
        See matching cover
      </button>
    </form>
  );
}

function Field({
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
