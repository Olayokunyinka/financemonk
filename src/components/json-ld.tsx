// Injects a schema.org JSON-LD <script> into the page. Server component.
export function JsonLd({ data }: { data: unknown | unknown[] }) {
  const items = Array.isArray(data) ? data : [data];
  return (
    <>
      {items
        .filter(Boolean)
        .map((item, i) => (
          <script
            key={i}
            type="application/ld+json"
            // JSON.stringify output is safe to embed; no user HTML.
            dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
          />
        ))}
    </>
  );
}
