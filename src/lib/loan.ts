// Loan repayment maths (reducing-balance amortisation). Used for the
// product-page total-cost illustration and (in Milestone 2) the standalone
// loan repayment calculator.

export function monthlyPayment(
  principal: number,
  annualRatePct: number,
  months: number,
): number {
  if (months <= 0) return 0;
  const r = annualRatePct / 100 / 12;
  if (r === 0) return principal / months;
  return (principal * r) / (1 - Math.pow(1 + r, -months));
}

export function totalRepayment(
  principal: number,
  annualRatePct: number,
  months: number,
): number {
  return monthlyPayment(principal, annualRatePct, months) * months;
}

function clamp(value: number, min: number | null, max: number | null): number {
  let v = value;
  if (min != null) v = Math.max(v, min);
  if (max != null) v = Math.min(v, max);
  return v;
}

// Pick a sensible representative example for a product's illustration.
export function representativeExample(product: {
  aprMin: number | null;
  aprMax: number | null;
  minAmount: number | null;
  maxAmount: number | null;
  minTenureMonths: number | null;
  maxTenureMonths: number | null;
}) {
  const apr = product.aprMin ?? product.aprMax ?? 0;
  const principal = clamp(500000, product.minAmount, product.maxAmount);
  const months = Math.round(
    clamp(12, product.minTenureMonths, product.maxTenureMonths),
  );
  const monthly = monthlyPayment(principal, apr, months);
  const total = monthly * months;
  return {
    apr,
    principal,
    months,
    monthly,
    total,
    interest: total - principal,
  };
}
