"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Landmark } from "lucide-react";

// C1 Auth screen. Role toggle ("user" vs "business") routes business accounts
// toward the claim/dashboard path (stored on the user). Browsing never requires
// auth — this only gates contributions (reviews, claims).
export function SignInForm({
  googleEnabled,
  devLoginEnabled,
  callbackUrl,
}: {
  googleEnabled: boolean;
  devLoginEnabled: boolean;
  callbackUrl: string;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"USER" | "BUSINESS">("USER");
  const [submitting, setSubmitting] = useState(false);

  async function onDevSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) return;
    setSubmitting(true);
    await signIn("dev", { email, name, role, callbackUrl });
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-2xl border border-border p-6 shadow-sm">
        <div className="flex items-center gap-2 font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-brand-foreground">
            <Landmark className="h-4 w-4" />
          </span>
          Sign in
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          You only need an account to contribute — write a review or claim a
          listing. Browsing is always open.
        </p>

        {/* Role toggle */}
        <div className="mt-5">
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-1 text-sm">
            <button
              type="button"
              onClick={() => setRole("USER")}
              className={`rounded-md py-2 ${
                role === "USER" ? "bg-background font-medium shadow-sm" : ""
              }`}
            >
              I&apos;m a user
            </button>
            <button
              type="button"
              onClick={() => setRole("BUSINESS")}
              className={`rounded-md py-2 ${
                role === "BUSINESS" ? "bg-background font-medium shadow-sm" : ""
              }`}
            >
              I represent a business
            </button>
          </div>
        </div>

        {googleEnabled ? (
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl })}
            className="mt-4 h-11 w-full rounded-lg border border-border font-medium hover:bg-muted"
          >
            Continue with Google
          </button>
        ) : null}

        {devLoginEnabled ? (
          <form onSubmit={onDevSubmit} className="mt-4 space-y-3">
            {googleEnabled ? (
              <div className="text-center text-xs text-muted-foreground">or</div>
            ) : null}
            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-11 w-full rounded-lg border border-border bg-background px-3"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Display name <span className="text-muted-foreground">(optional)</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Chidi O."
                className="h-11 w-full rounded-lg border border-border bg-background px-3"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="h-11 w-full rounded-lg bg-brand font-medium text-brand-foreground hover:bg-brand/90 disabled:opacity-60"
            >
              {submitting ? "Signing in…" : "Continue with email"}
            </button>
            <p className="text-xs text-muted-foreground">
              Dev sign-in: no password needed for local testing. In production
              this is a secure email magic-link.
            </p>
          </form>
        ) : null}

        {!googleEnabled && !devLoginEnabled ? (
          <p className="mt-4 rounded-lg bg-muted p-3 text-sm text-muted-foreground">
            No sign-in method is configured. Set <code>AUTH_DEV_LOGIN=true</code>{" "}
            or add Google credentials in <code>.env</code>.
          </p>
        ) : null}
      </div>
    </div>
  );
}
