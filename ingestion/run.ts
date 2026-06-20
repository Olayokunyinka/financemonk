// Ingestion CLI.
//
//   npm run ingest                 # all adapters, offline fixtures
//   npm run ingest -- --adapter=example-bank
//   npm run ingest -- --live       # fetch real sources (respects robots.txt)
//
// Thin wrapper around runIngestion() in ingestion/pipeline.ts (shared with the
// scheduled /api/cron/refresh route).

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { runIngestion, ADAPTERS } from "./pipeline";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const args = process.argv.slice(2);
  const live = args.includes("--live");
  const adapterId = args.find((a) => a.startsWith("--adapter="))?.split("=")[1];

  console.log(
    `→ Ingestion (${live ? "LIVE" : "offline fixtures"}): ${
      adapterId ?? ADAPTERS.map((a) => a.id).join(", ")
    }`,
  );

  const s = await runIngestion(prisma, { live, adapterId });
  console.log(
    `✅ Run complete: ${s.created} new, ${s.changed} changed, ${s.unchanged} unchanged, ${s.errors} errors.`,
  );
  console.log("   Review & approve at /admin/ingestion");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
