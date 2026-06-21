// SEED script — populates the database with hand-curated Phase 0 data:
// Nigeria · personal loans. All data here is SEED data for demonstration.
//
// Run with:  npm run seed
//
// It is idempotent: it clears the relevant tables and re-inserts. It also
// performs the licence match (provider name -> CBN register) that the gold
// "Verified" badge depends on.

import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import {
  ProductType,
  ProviderType,
  VerificationBadge,
  DisclaimerState,
  ReviewerType,
  ReviewStatus,
} from "../src/generated/prisma/enums";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const SEED_DIR = join(process.cwd(), "ingestion", "seed");

function load<T>(file: string): T {
  return JSON.parse(readFileSync(join(SEED_DIR, file), "utf8")) as T;
}

// Normalise an institution name for fuzzy matching against the register.
function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/\(.*?\)/g, "") // drop parentheticals
    .replace(/[^a-z0-9 ]/g, "") // drop punctuation
    .replace(/\b(plc|ltd|limited|bank)\b/g, "") // drop common suffixes
    .replace(/\s+/g, " ")
    .trim();
}

type LicensedSeed = {
  name: string;
  country: string;
  regulator: string;
  category?: string;
  licenceNo?: string;
};

type ProviderSeed = {
  slug: string;
  name: string;
  type: keyof typeof ProviderType;
  country: string;
  website?: string;
  about?: string;
  claimed?: boolean;
};

type ProductSeed = {
  slug: string;
  name: string;
  providerSlug: string;
  summary?: string;
  features?: string[];
  aprMin?: number;
  aprMax?: number;
  interestRate?: number;
  fees?: unknown[];
  minAmount?: number;
  maxAmount?: number;
  currency?: string;
  minTenureMonths?: number;
  maxTenureMonths?: number;
  eligibility?: string[];
  requiredDocs?: string[];
  sourceRefs?: unknown[];
  lastVerifiedAt?: string;
  sponsored?: boolean;
  ratingAggregate?: number;
  reviewCount?: number;
  terms?: Record<string, unknown>;
};

type HubSeed = {
  country: string;
  productType: keyof typeof ProductType;
  title: string;
  intro: string;
  faq: unknown[];
  relatedSlugs: unknown[];
};

type ReviewSeed = {
  productSlug: string;
  authorName?: string;
  overall: number;
  transparency?: number;
  customerService?: number;
  ease?: number;
  value?: number;
  title: string;
  body: string;
  reviewerType: keyof typeof ReviewerType;
  status: keyof typeof ReviewStatus;
};

async function main() {
  console.log("⚠  Seeding SEED (demonstration) data: Nigeria · personal loans");

  // --- Reset (child -> parent order) ---------------------------------------
  await prisma.commission.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.review.deleteMany();
  await prisma.claim.deleteMany();
  await prisma.product.deleteMany();
  await prisma.provider.deleteMany();
  await prisma.licensedInstitution.deleteMany();
  await prisma.hub.deleteMany();

  // --- Licensed-institution registers (verification source of truth) -------
  // Keyed by `${country}:${normalisedName}` so matching is country-aware.
  const registerFiles = [
    "licensed-institutions.ng.json",
    "licensed-institutions.ke.json",
    "licensed-institutions.za.json",
  ];
  const registerByKey = new Map<string, LicensedSeed>();
  let registerCount = 0;
  for (const file of registerFiles) {
    const licensed = load<LicensedSeed[]>(file);
    await prisma.licensedInstitution.createMany({
      data: licensed.map((l) => ({
        name: l.name,
        normalisedName: norm(l.name),
        country: l.country,
        regulator: l.regulator,
        category: l.category ?? null,
        licenceNo: l.licenceNo ?? null,
      })),
    });
    for (const l of licensed) registerByKey.set(`${l.country}:${norm(l.name)}`, l);
    registerCount += licensed.length;
  }
  console.log(`  • ${registerCount} licensed institutions (3 registers)`);

  // --- Providers (with country-aware licence match) ------------------------
  const providerFiles = ["providers.ng.json", "providers.ke.json", "providers.za.json"];
  type ProviderInfo = { id: string; licensed: boolean; claimed: boolean };
  const providerBySlug = new Map<string, ProviderInfo>();
  let providerCount = 0;
  let licensedCount = 0;
  for (const file of providerFiles) {
    const providers = load<ProviderSeed[]>(file);
    for (const p of providers) {
      const match = registerByKey.get(`${p.country}:${norm(p.name)}`);
      const created = await prisma.provider.create({
        data: {
          slug: p.slug,
          name: p.name,
          type: ProviderType[p.type],
          country: p.country,
          website: p.website ?? null,
          about: p.about ?? null,
          claimed: p.claimed ?? false,
          licensed: !!match,
          licenseRef: match?.licenceNo ?? null,
          licenseSource: match?.regulator ?? null,
          licenseVerifiedAt: match ? new Date() : null,
        },
      });
      providerBySlug.set(p.slug, {
        id: created.id,
        licensed: !!match,
        claimed: p.claimed ?? false,
      });
      providerCount++;
      if (match) licensedCount++;
    }
  }
  console.log(
    `  • ${providerCount} providers (${licensedCount} licence-matched, ${
      providerCount - licensedCount
    } unlicensed)`,
  );

  // --- Products, per country × family slice (with computed badge) ----------
  const currencyByCountry: Record<string, string> = {
    ng: "NGN",
    ke: "KES",
    za: "ZAR",
  };
  const slices: { file: string; country: string; productType: keyof typeof ProductType }[] = [
    { file: "products.ng.personal-loans.json", country: "ng", productType: "PERSONAL_LOAN" },
    { file: "products.ng.savings-accounts.json", country: "ng", productType: "SAVINGS" },
    { file: "products.ng.business-loans.json", country: "ng", productType: "BUSINESS_LOAN" },
    { file: "products.ng.credit-cards.json", country: "ng", productType: "CREDIT_CARD" },
    // Insurance / investment / payments (terms-driven families)
    { file: "products.ng.health-insurance.json", country: "ng", productType: "HEALTH_INSURANCE" },
    { file: "products.ng.life-insurance.json", country: "ng", productType: "LIFE_INSURANCE" },
    { file: "products.ng.mutual-funds.json", country: "ng", productType: "MUTUAL_FUND" },
    { file: "products.ng.money-market-funds.json", country: "ng", productType: "MONEY_MARKET" },
    { file: "products.ng.pensions.json", country: "ng", productType: "PENSION" },
    { file: "products.ng.money-transfer.json", country: "ng", productType: "MONEY_TRANSFER" },
    { file: "products.ng.remittance.json", country: "ng", productType: "REMITTANCE" },
    // Additional Nigeria families (Scope: fix-thin + fill-gaps — all 27 NG hubs).
    { file: "products.ng.payday-loans.json", country: "ng", productType: "PAYDAY_LOAN" },
    { file: "products.ng.asset-finance.json", country: "ng", productType: "ASSET_FINANCE" },
    { file: "products.ng.mortgages.json", country: "ng", productType: "MORTGAGE" },
    { file: "products.ng.trade-finance.json", country: "ng", productType: "TRADE_FINANCE" },
    { file: "products.ng.current-accounts.json", country: "ng", productType: "CURRENT_ACCOUNT" },
    { file: "products.ng.fixed-deposits.json", country: "ng", productType: "FIXED_DEPOSIT" },
    { file: "products.ng.domiciliary-accounts.json", country: "ng", productType: "DOMICILIARY" },
    { file: "products.ng.debit-cards.json", country: "ng", productType: "DEBIT_CARD" },
    { file: "products.ng.prepaid-cards.json", country: "ng", productType: "PREPAID_CARD" },
    { file: "products.ng.virtual-cards.json", country: "ng", productType: "VIRTUAL_CARD" },
    { file: "products.ng.auto-insurance.json", country: "ng", productType: "AUTO_INSURANCE" },
    { file: "products.ng.travel-insurance.json", country: "ng", productType: "TRAVEL_INSURANCE" },
    { file: "products.ng.business-insurance.json", country: "ng", productType: "BUSINESS_INSURANCE" },
    { file: "products.ng.agric-insurance.json", country: "ng", productType: "AGRIC_INSURANCE" },
    { file: "products.ng.fixed-income.json", country: "ng", productType: "FIXED_INCOME" },
    { file: "products.ng.fx.json", country: "ng", productType: "FX" },
    { file: "products.ke.personal-loans.json", country: "ke", productType: "PERSONAL_LOAN" },
    { file: "products.za.savings-accounts.json", country: "za", productType: "SAVINGS" },
  ];

  // Default CPA payout per converted application (demo deal terms), only for
  // licensed providers (you only sign referral deals with licensed institutions).
  const payoutTable: Record<string, Record<string, number>> = {
    PERSONAL_LOAN: { ng: 5000, ke: 1500, za: 500 },
    SAVINGS: { ng: 2000, ke: 600, za: 150 },
    BUSINESS_LOAN: { ng: 12000, ke: 4000, za: 1200 },
    CREDIT_CARD: { ng: 4000, ke: 1200, za: 400 },
    HEALTH_INSURANCE: { ng: 3000, ke: 900, za: 300 },
    LIFE_INSURANCE: { ng: 4000, ke: 1200, za: 400 },
    MUTUAL_FUND: { ng: 2500, ke: 800, za: 250 },
    MONEY_MARKET: { ng: 2000, ke: 600, za: 200 },
    PENSION: { ng: 3000, ke: 900, za: 300 },
    MONEY_TRANSFER: { ng: 800, ke: 250, za: 80 },
    REMITTANCE: { ng: 1000, ke: 300, za: 100 },
    PAYDAY_LOAN: { ng: 3000 },
    ASSET_FINANCE: { ng: 15000 },
    MORTGAGE: { ng: 25000 },
    TRADE_FINANCE: { ng: 20000 },
    CURRENT_ACCOUNT: { ng: 1500 },
    FIXED_DEPOSIT: { ng: 2500 },
    DOMICILIARY: { ng: 2000 },
    DEBIT_CARD: { ng: 800 },
    PREPAID_CARD: { ng: 800 },
    VIRTUAL_CARD: { ng: 600 },
    AUTO_INSURANCE: { ng: 3500 },
    TRAVEL_INSURANCE: { ng: 2500 },
    BUSINESS_INSURANCE: { ng: 6000 },
    AGRIC_INSURANCE: { ng: 4000 },
    FIXED_INCOME: { ng: 2500 },
    FX: { ng: 1200 },
  };

  let productCount = 0;
  let goldCount = 0;
  for (const slice of slices) {
    const products = load<ProductSeed[]>(slice.file);
    for (const pr of products) {
      const provider = providerBySlug.get(pr.providerSlug);
      if (!provider) {
        console.warn(`  ! product ${pr.slug} references unknown provider`);
        continue;
      }
      const rating = pr.ratingAggregate ?? 0;
      const reviews = pr.reviewCount ?? 0;

      // Badge logic (mirrors src/lib/verification.ts):
      // gold = licensed AND claimed; grey = popular & well-rated; else none.
      let badge: VerificationBadge = VerificationBadge.UNVERIFIED;
      if (provider.licensed && provider.claimed) {
        badge = VerificationBadge.PROVIDER_VERIFIED;
        goldCount++;
      } else if (reviews >= 100 && rating >= 4.0) {
        badge = VerificationBadge.POPULARITY_VERIFIED;
      }

      await prisma.product.create({
        data: {
          slug: pr.slug,
          name: pr.name,
          productType: ProductType[slice.productType],
          country: slice.country,
          providerId: provider.id,
          summary: pr.summary ?? null,
          features: pr.features ?? [],
          aprMin: pr.aprMin ?? null,
          aprMax: pr.aprMax ?? null,
          interestRate: pr.interestRate ?? null,
          fees: (pr.fees ?? []) as object,
          minAmount: pr.minAmount ?? null,
          maxAmount: pr.maxAmount ?? null,
          currency: pr.currency ?? currencyByCountry[slice.country] ?? "NGN",
          minTenureMonths: pr.minTenureMonths ?? null,
          maxTenureMonths: pr.maxTenureMonths ?? null,
          eligibility: pr.eligibility ?? [],
          requiredDocs: pr.requiredDocs ?? [],
          terms: (pr.terms ?? {}) as object,
          sourceRefs: (pr.sourceRefs ?? []) as object,
          lastVerifiedAt: pr.lastVerifiedAt
            ? new Date(pr.lastVerifiedAt)
            : new Date(),
          sponsored: pr.sponsored ?? false,
          verificationBadge: badge,
          disclaimerState: provider.claimed
            ? DisclaimerState.PROVIDER_CONFIRMED
            : DisclaimerState.INDICATIVE,
          ratingAggregate: rating,
          reviewCount: reviews,
          live: true,
          cpaPayout: provider.licensed
            ? (payoutTable[slice.productType]?.[slice.country] ?? null)
            : null,
        },
      });
      productCount++;
    }
  }
  console.log(
    `  • ${productCount} products across ${slices.length} slices (${goldCount} gold-verified)`,
  );

  // --- Reviews (moderation status preserved) -------------------------------
  const reviews = load<ReviewSeed[]>("reviews.ng.json");
  let reviewInserted = 0;
  for (const rv of reviews) {
    const product = await prisma.product.findUnique({
      where: { slug: rv.productSlug },
      select: { id: true },
    });
    if (!product) continue;
    await prisma.review.create({
      data: {
        productId: product.id,
        authorName: rv.authorName ?? null,
        overall: rv.overall,
        transparency: rv.transparency ?? null,
        customerService: rv.customerService ?? null,
        ease: rv.ease ?? null,
        value: rv.value ?? null,
        title: rv.title,
        body: rv.body,
        reviewerType: ReviewerType[rv.reviewerType],
        status: ReviewStatus[rv.status],
      },
    });
    reviewInserted++;
  }
  console.log(`  • ${reviewInserted} reviews (incl. 1 PENDING for moderation demo)`);

  // --- Hubs (editorial intro + FAQ) ----------------------------------------
  const hubs = load<HubSeed[]>("hubs.json");
  for (const h of hubs) {
    await prisma.hub.create({
      data: {
        country: h.country,
        productType: ProductType[h.productType],
        title: h.title,
        intro: h.intro,
        faq: h.faq as object,
        relatedSlugs: h.relatedSlugs as object,
      },
    });
  }
  console.log(`  • ${hubs.length} editorial hub(s)`);

  console.log("✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
