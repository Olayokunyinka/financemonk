// Review-fraud heuristics (M14). Computes a 0-100 risk score + human-readable
// flags at submit time. Reviews are always held PENDING; a high score just
// surfaces them for priority/scrutiny in the moderation queue (we never
// auto-publish, and we avoid auto-rejecting to limit false positives).

export type ScoreInput = {
  title: string;
  body: string;
  overall: number;
};

export type ScoreContext = {
  // Reviews by this user in the last 24h (before this one).
  recentByUser: number;
  // An already-existing review by this user with the same body text.
  duplicateByUser: boolean;
};

export function scoreReview(
  input: ScoreInput,
  ctx: ScoreContext,
): { score: number; flags: string[] } {
  const flags: string[] = [];
  let score = 0;
  const body = input.body.trim();

  if (ctx.duplicateByUser) {
    score += 70;
    flags.push("duplicate text");
  }
  if (ctx.recentByUser >= 3) {
    score += 40;
    flags.push("high velocity");
  } else if (ctx.recentByUser >= 1) {
    score += 15;
  }
  if (body.length < 20) {
    score += 25;
    flags.push("very short");
  }
  if (/https?:\/\/|www\.|\b\w+\.(com|net|ng|ke|za)\b/i.test(body)) {
    score += 30;
    flags.push("contains link");
  }
  // Shouting / spammy punctuation.
  const letters = body.replace(/[^a-z]/gi, "");
  if (letters.length > 10 && letters === letters.toUpperCase()) {
    score += 15;
    flags.push("all caps");
  }
  if (/(.)\1{4,}/.test(body) || /!{3,}/.test(body)) {
    score += 10;
    flags.push("spammy punctuation");
  }
  // Extreme rating with almost no substance.
  if ((input.overall === 5 || input.overall === 1) && body.length < 40) {
    score += 10;
    flags.push("extreme rating, low detail");
  }

  return { score: Math.min(100, score), flags };
}

export const SPAM_THRESHOLD = 60; // at/above = high risk (highlighted, sorted first)
