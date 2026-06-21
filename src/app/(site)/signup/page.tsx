import type { Metadata } from "next";
import { googleEnabled, devLoginEnabled, resendEnabled } from "@/auth";
import { SignInForm } from "../signin/sign-in-form";

// Sign-up reuses the same passwordless/OAuth form as sign-in (Auth.js creates the
// account on first verified login). The USER/BUSINESS toggle routes business
// accounts toward the claim/dashboard path.
export const metadata: Metadata = {
  title: "Sign up",
  robots: { index: false, follow: true },
};

type SearchParams = Promise<{ callbackUrl?: string }>;

export default async function SignUpPage(props: { searchParams: SearchParams }) {
  const { callbackUrl } = await props.searchParams;
  return (
    <SignInForm
      googleEnabled={googleEnabled}
      devLoginEnabled={devLoginEnabled}
      resendEnabled={resendEnabled}
      callbackUrl={callbackUrl ?? "/"}
    />
  );
}
