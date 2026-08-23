import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import type { CatalogItem } from "@/lib/moviebox";

export function MediaCard({
  item,
  block = false,
  rank,
}: {
  item: CatalogItem;
  block?: boolean;
  rank?: number;
}) {
  return (
    <Link
      to="/watch/$id"
      params={{ id: item.id }}
      aria-label={item.title}
      className={`group block ${block ? "w-full" : "w-[calc((100vw-3rem)/3)] shrink-0 sm:w-[168px]"}`}
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-muted ring-1 ring-border transition-transform duration-200 group-hover:-translate-y-1 group-hover:ring-brand">
        {item.poster ? (
          <img
            src={item.poster}
            alt={item.title}
            loading="lazy"
            className="size-full object-cover"
          />
        ) : (
          <div className="grid size-full place-items-center px-2 text-center text-sm text-muted-foreground">
            {item.title}
          </div>
        )}
        {typeof rank === "number" && (
          <span className="absolute left-0 top-0 rounded-br-lg bg-brand px-2 py-0.5 text-[11px] font-black text-brand-foreground">
            {rank}
          </span>
        )}
        <span
          className={`absolute right-1 top-1 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase leading-tight ${
            item.type === "series" ? "badge-hot" : "badge-vip"
          }`}
        >
          {item.type === "series" ? "Series" : "Movie"}
        </span>
        {item.rating && (
          <span className="absolute bottom-1 right-1 flex items-center gap-1 rounded bg-background/80 px-1.5 py-0.5 text-[11px] font-semibold text-foreground backdrop-blur-md">
            <Star className="size-3 fill-current" />
            {item.rating}
          </span>
        )}
      </div>
      <p className="mt-2 truncate text-[13px] text-muted-foreground transition-colors group-hover:text-foreground">
        {item.title}
      </p>
      {(item.year || item.genre) && (
        <p className="truncate text-[11px] text-muted-foreground/70">
          {[item.year, item.genre].filter(Boolean).join(" · ")}
        </p>
      )}
    </Link>
  );
}
