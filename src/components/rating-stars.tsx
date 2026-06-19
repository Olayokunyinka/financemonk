import { Star } from "lucide-react";

export function RatingStars({
  value,
  count,
  size = 14,
}: {
  value: number;
  count?: number;
  size?: number;
}) {
  const rounded = Math.round(value * 2) / 2;
  return (
    <span className="inline-flex items-center gap-1 text-sm">
      <span className="inline-flex" aria-hidden>
        {[1, 2, 3, 4, 5].map((i) => {
          const filled = i <= Math.floor(rounded);
          const half = !filled && i - 0.5 === rounded;
          return (
            <Star
              key={i}
              width={size}
              height={size}
              className={
                filled || half ? "text-amber-500" : "text-slate-300"
              }
              fill={filled ? "currentColor" : "none"}
            />
          );
        })}
      </span>
      {value > 0 ? (
        <span className="font-medium">{value.toFixed(1)}</span>
      ) : (
        <span className="text-muted-foreground">No reviews</span>
      )}
      {count !== undefined && count > 0 ? (
        <span className="text-muted-foreground">({count})</span>
      ) : null}
    </span>
  );
}
