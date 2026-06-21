import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Advertise",
  description: `Reach in-market consumers comparing financial products on ${SITE.name}.`,
};

export default function AdvertisePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">Advertise with {SITE.name}</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Reach high-intent consumers at the moment they compare loans, savings,
        cards, insurance and investments. All sponsored placements are clearly
        labelled — we never disguise advertising as editorial.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          {
            title: "Sponsored placement",
            desc: "Labelled priority position within a comparison.",
          },
          {
            title: "Claim & verify",
            desc: "Take ownership of your listing and keep it accurate.",
          },
          {
            title: "Performance referrals",
            desc: "Pay-per-application where legally enabled per country.",
          },
        ].map((c) => (
          <div key={c.title} className="rounded-2xl border border-border p-5">
            <div className="font-semibold">{c.title}</div>
            <p className="mt-1 text-sm text-muted-foreground">{c.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex gap-3">
        <ButtonLink href="/contact">Talk to us</ButtonLink>
        <ButtonLink href="/claim" variant="outline">
          Claim your listing
        </ButtonLink>
      </div>
    </div>
  );
}
