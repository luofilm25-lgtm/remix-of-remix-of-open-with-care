import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Play, ShieldCheck } from "lucide-react";
import { listLuoTitles, type LuoLanguage } from "@/lib/luo";

export function LuoLibrary({ language }: { language: LuoLanguage }) {
  const q = useQuery({
    queryKey: ["luo-titles", language],
    queryFn: () => listLuoTitles(language),
    staleTime: 30 * 1000,
  });

  const items = q.data ?? [];
  const latest = items.slice(0, 12);
  const movies = items.filter((i) => i.kind !== "series");
  const series = items.filter((i) => i.kind === "series");

  return (
    <div className="space-y-8">
      {q.isLoading && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-md bg-muted" />
          ))}
        </div>
      )}

      {!q.isLoading && items.length === 0 && (
        <div className="rounded-2xl bg-foreground/5 p-10 text-center ring-1 ring-border">
          <p className="text-sm text-muted-foreground">
            No titles uploaded yet. Admins can add movies and series from the admin panel.
          </p>
        </div>
      )}

      {[
        { label: "Latest", rows: latest },
        { label: "Movies", rows: movies },
        { label: "Series", rows: series },
      ]
        .filter((s) => s.rows.length > 0)
        .map((section) => (
          <section key={section.label}>
            <h2 className="mb-3 text-[15px] font-bold text-foreground">{section.label}</h2>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {section.rows.map((item) => (
                <Link
                  key={item.id}
                  to={language === "luo" ? "/luo/$id" : "/luganda/$id"}
                  params={{ id: item.id }}
                  className="group block"
                >
                  <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-muted ring-1 ring-border transition-transform group-hover:-translate-y-1 group-hover:ring-brand">
                    {item.poster_url ? (
                      <img
                        src={item.poster_url}
                        alt={item.title}
                        loading="lazy"
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="grid size-full place-items-center px-2 text-center text-xs text-muted-foreground">
                        {item.title}
                      </div>
                    )}
                    <span className="absolute right-1 top-1 rounded bg-brand px-1.5 py-0.5 text-[10px] font-black uppercase text-brand-foreground">
                      {item.kind === "series" ? "Series" : "Movie"}
                    </span>
                    <span className="absolute inset-x-0 bottom-0 flex items-center gap-1 bg-gradient-to-t from-black/80 to-transparent px-1.5 pb-1 pt-6 text-[10px] font-semibold text-white/90">
                      <ShieldCheck className="size-3 text-brand" /> Uploaded by admin
                    </span>
                    <span className="pointer-events-none absolute inset-0 grid place-items-center opacity-0 transition group-hover:opacity-100">
                      <Play className="size-8 fill-white text-white drop-shadow" />
                    </span>
                  </div>
                  <p className="mt-2 truncate text-[13px] text-muted-foreground group-hover:text-foreground">
                    {item.title}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground/70">
                    {[item.vj ? `VJ ${item.vj}` : null, item.year, item.genre]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ))}
    </div>
  );
}
