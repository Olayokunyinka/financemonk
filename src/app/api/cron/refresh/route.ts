import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runIngestion } from "../../../../../ingestion/pipeline";

// Scheduled rate-refresh (M7). Vercel Cron calls this on a schedule (see
// vercel.json) and, when CRON_SECRET is set, sends `Authorization: Bearer
// <CRON_SECRET>`. It re-runs the ingestion adapters and STAGES drafts for admin
// QA at /admin/ingestion — it never auto-publishes.
//
// Default mode is live (fetch real sources, robots-checked). Pass ?mode=fixtures
// to run against bundled fixtures (handy for local testing).

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  const mode = new URL(req.url).searchParams.get("mode");
  const live = mode !== "fixtures";

  try {
    const summary = await runIngestion(prisma, { live });
    return NextResponse.json({ ok: true, ...summary });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message },
      { status: 500 },
    );
  }
}
