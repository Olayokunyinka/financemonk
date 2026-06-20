// Savings growth maths (compound interest with optional monthly contributions).
// Used by the savings-growth calculator and the product-page "what you'd earn"
// illustration.

export function futureValue(
  principal: number,
  annualRatePct: number,
  years: number,
  monthlyContribution = 0,
): number {
  const r = annualRatePct / 100 / 12;
  const n = Math.round(years * 12);
  if (n <= 0) return principal;
  if (r === 0) return principal + monthlyContribution * n;
  const fvPrincipal = principal * Math.pow(1 + r, n);
  const fvContrib =
    monthlyContribution * ((Math.pow(1 + r, n) - 1) / r);
  return fvPrincipal + fvContrib;
}

// A representative example for a savings product's illustration.
export function representativeSavingsExample(product: {
  interestRate: number | null;
  minAmount: number | null;
}) {
  const rate = product.interestRate ?? 0;
  const principal = Math.max(product.minAmount ?? 0, 100000);
  const years = 1;
  const fv = futureValue(principal, rate, years);
  return {
    rate,
    principal,
    years,
    futureValue: fv,
    interest: fv - principal,
  };
}
