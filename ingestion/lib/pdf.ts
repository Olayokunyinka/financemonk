// PDF text extraction for rate-card adapters. Wraps pdf-parse (v2 PDFParse API)
// so adapters don't depend on it directly.
import { readFileSync } from "node:fs";
import { PDFParse } from "pdf-parse";

export async function extractPdfText(source: Buffer | string): Promise<string> {
  const buf = typeof source === "string" ? readFileSync(source) : source;
  const parser = new PDFParse({ data: new Uint8Array(buf) });
  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}
