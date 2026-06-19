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
  await prisma.lead.deleteMany();
  await prisma.review.deleteMany();
  await prisma.claim.deleteMany();
  await prisma.product.deleteMany();
  await prisma.provider.deleteMany();
  await prisma.licensedInstitution.deleteMany();
  await prisma.hub.deleteMany();

  // --- Licensed-institution register (verification source of truth) --------
  const licensed = load<LicensedSeed[]>("licensed-institutions.ng.json");
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
  const registerByNorm = new Map(licensed.map((l) => [norm(l.name), l]));
  console.log(`  • ${licensed.length} licensed institutions`);

  // --- Providers (with licence match) --------------------------------------
  const providers = load<ProviderSeed[]>("providers.ng.json");
  const providerIdBySlug = new Map<string, string>();
  for (const p of providers) {
    const match = registerByNorm.get(norm(p.name));
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
    providerIdBySlug.set(p.slug, created.id);
  }
  const licensedCount = providers.filter((p) =>
    registerByNorm.has(norm(p.name)),
  ).length;
  console.log(
    `  • ${providers.length} providers (${licensedCount} licence-matched, ${
      providers.length - licensedCount
    } unlicensed)`,
  );

  // --- Products (with computed verification badge) -------------------------
  const products = load<ProductSeed[]>("products.ng.personal-loans.json");
  let goldCount = 0;
  for (const pr of products) {
    const providerId = providerIdBySlug.get(pr.providerSlug);
    if (!providerId) {
      console.warn(`  ! product ${pr.slug} references unknown provider`);
      continue;
    }
    const provider = providers.find((p) => p.slug === pr.providerSlug)!;
    const isLicensed = registerByNorm.has(norm(provider.name));
    const isClaimed = provider.claimed ?? false;
    const rating = pr.ratingAggregate ?? 0;
    const reviews = pr.reviewCount ?? 0;

    // Badge logic (mirrors src/lib/verification.ts):
    // gold = licensed AND claimed; grey = popular & well-rated; else none.
    let badge: VerificationBadge = VerificationBadge.UNVERIFIED;
    if (isLicensed && isClaimed) {
      badge = VerificationBadge.PROVIDER_VERIFIED;
      goldCount++;
    } else if (reviews >= 100 && rating >= 4.0) {
      badge = VerificationBadge.POPULARITY_VERIFIED;
    }

    await prisma.product.create({
      data: {
        slug: pr.slug,
        name: pr.name,
        productType: ProductType.PERSONAL_LOAN,
        country: "ng",
        providerId,
        summary: pr.summary ?? null,
        features: pr.features ?? [],
        aprMin: pr.aprMin ?? null,
        aprMax: pr.aprMax ?? null,
        interestRate: pr.interestRate ?? null,
        fees: (pr.fees ?? []) as object,
        minAmount: pr.minAmount ?? null,
        maxAmount: pr.maxAmount ?? null,
        currency: pr.currency ?? "NGN",
        minTenureMonths: pr.minTenureMonths ?? null,
        maxTenureMonths: pr.maxTenureMonths ?? null,
        eligibility: pr.eligibility ?? [],
        requiredDocs: pr.requiredDocs ?? [],
        sourceRefs: (pr.sourceRefs ?? []) as object,
        lastVerifiedAt: pr.lastVerifiedAt
          ? new Date(pr.lastVerifiedAt)
          : new Date(),
        sponsored: pr.sponsored ?? false,
        verificationBadge: badge,
        disclaimerState: isClaimed
          ? DisclaimerState.PROVIDER_CONFIRMED
          : DisclaimerState.INDICATIVE,
        ratingAggregate: rating,
        reviewCount: reviews,
        live: true,
      },
    });
  }
  console.log(
    `  • ${products.length} products (${goldCount} gold-verified, rest grey/unverified)`,
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
