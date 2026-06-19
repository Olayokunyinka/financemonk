import type { FaqItem } from "@/lib/jsonld";

// Rendered as native <details> so the answer text is present in the HTML for
// crawlers even without JavaScript (matches the FAQPage JSON-LD on the page).
export function Faq({ items }: { items: FaqItem[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="divide-y divide-border rounded-xl border border-border">
      {items.map((f, i) => (
        <details key={i} className="group px-4 py-3">
          <summary className="cursor-pointer list-none font-medium marker:content-none">
            <span className="flex items-center justify-between gap-4">
              {f.question}
              <span className="text-muted-foreground transition-transform group-open:rotate-45">
                +
              </span>
            </span>
          </summary>
          <p className="mt-2 text-sm text-muted-foreground">{f.answer}</p>
        </details>
      ))}
    </div>
  );
}
