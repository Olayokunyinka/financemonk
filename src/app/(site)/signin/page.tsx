import type { Metadata } from "next";
import { googleEnabled, devLoginEnabled, resendEnabled } from "@/auth";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: true },
};

type SearchParams = Promise<{ callbackUrl?: string }>;

export default async function SignInPage(props: {
  searchParams: SearchParams;
}) {
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
