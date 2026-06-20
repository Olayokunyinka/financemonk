// One-off generator for the demo rate-card PDF fixture used by the PDF adapter.
// Run with: npx tsx ingestion/fixtures/make-ratecard-pdf.ts
// (Committed output: ingestion/fixtures/example-ratecard.pdf)

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { PDFDocument, StandardFonts } from "pdf-lib";

const LINES = [
  "Renmoney Rate Card 2026",
  "",
  "Product: Renmoney Personal Loan | slug: renmoney-personal-loan",
  "Interest: 33% - 43%",
  "Management fee: 4%",
  "Amount: 50000 - 6000000",
  "Tenure: 3 - 24 months",
  "",
  "Product: Renmoney SME Loan | slug: renmoney-sme-loan",
  "Interest: 40% - 55%",
  "Management fee: 4%",
  "Amount: 100000 - 10000000",
  "Tenure: 3 - 36 months",
];

async function main() {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([612, 792]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  let y = 740;
  for (const line of LINES) {
    page.drawText(line, { x: 56, y, size: 12, font });
    y -= 20;
  }
  const bytes = await pdf.save();
  const out = join(process.cwd(), "ingestion", "fixtures", "example-ratecard.pdf");
  writeFileSync(out, bytes);
  console.log(`Wrote ${out} (${bytes.length} bytes)`);
}

main();
