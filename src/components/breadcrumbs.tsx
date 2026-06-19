import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function Breadcrumbs({
  crumbs,
}: {
  crumbs: { name: string; href: string }[];
}) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-1">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <li key={c.href} className="flex items-center gap-1">
              {last ? (
                <span className="text-foreground">{c.name}</span>
              ) : (
                <Link href={c.href} className="hover:text-foreground">
                  {c.name}
                </Link>
              )}
              {!last ? <ChevronRight className="h-3.5 w-3.5" /> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
