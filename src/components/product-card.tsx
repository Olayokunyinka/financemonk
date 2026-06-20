import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { RatingStars } from "@/components/rating-stars";
import { VerifiedBadge } from "@/components/verified-badge";
import { LastVerified } from "@/components/disclaimer";
import { formatApr } from "@/lib/format";

type CardProduct = {
  slug: string;
  name: string;
  aprMin: number | null;
  aprMax: number | null;
  ratingAggregate: number;
  reviewCount: number;
  lastVerifiedAt: Date;
  sponsored: boolean;
  verificationBadge: "UNVERIFIED" | "POPULARITY_VERIFIED" | "PROVIDER_VERIFIED";
  provider: {
    name: string;
    licensed: boolean;
    claimed: boolean;
    licenseSource: string | null;
  };
};

export function ProductCard({ product }: { product: CardProduct }) {
  return (
    <Card className="flex h-full flex-col">
      <CardContent className="flex flex-1 flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="text-sm font-medium text-muted-foreground">
            {product.provider.name}
          </div>
          {product.sponsored ? (
            <Badge variant="sponsored" title="Paid placement">
              Sponsored
            </Badge>
          ) : null}
        </div>

        <Link
          href={`/product/${product.slug}`}
          className="font-semibold leading-snug hover:text-brand"
        >
          {product.name}
        </Link>

        <div className="flex items-center gap-2">
          <VerifiedBadge
            input={{
              verificationBadge: product.verificationBadge,
              licensed: product.provider.licensed,
              claimed: product.provider.claimed,
              licenseSource: product.provider.licenseSource,
            }}
          />
          <RatingStars value={product.ratingAggregate} count={product.reviewCount} />
        </div>

        <div className="text-sm">
          <span className="text-muted-foreground">Interest p.a. </span>
          <span className="font-medium">
            {formatApr(product.aprMin, product.aprMax)}
          </span>
        </div>

        <div className="mt-auto space-y-3 pt-2">
          <LastVerified date={product.lastVerifiedAt} />
          <div className="flex gap-2">
            <ButtonLink
              href={`/apply/${product.slug}`}
              size="sm"
              variant="accent"
              className="flex-1"
            >
              Apply
            </ButtonLink>
            <ButtonLink
              href={`/product/${product.slug}`}
              size="sm"
              variant="outline"
              className="flex-1"
            >
              View
            </ButtonLink>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
