import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Star } from "lucide-react";
import { Sidebar } from "@/components/youku/Sidebar";
import { TopBar } from "@/components/youku/TopBar";
import { MobileNav } from "@/components/youku/MobileNav";
import { Player } from "@/components/youku/Player";
import { Rail } from "@/components/youku/Rail";
import { getSources, getTitle, searchTitles } from "@/lib/catalog.functions";
import { streamUrl, subtitleUrl } from "@/lib/download";
import { TitleActions } from "@/components/youku/TitleActions";
import { SubscribeGate } from "@/components/youku/SubscribeGate";
import { useSubscription } from "@/hooks/useSubscription";

const titleQuery = (id: string) =>
  queryOptions({
    queryKey: ["title", id],
    queryFn: () => getTitle({ data: { id } }),
    staleTime: 5 * 60 * 1000,
  });

export const Route = createFileRoute("/watch/$id")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(titleQuery(params.id)),
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Unavailable — LUOFILM" }, { name: "robots", content: "noindex" }] };
    }
    const description =
      loaderData.description?.slice(0, 155) ?? `Stream ${loaderData.title} on LUOFILM.`;
    const meta: { title?: string; name?: string; property?: string; content?: string }[] = [
      { title: `Watch ${loaderData.title} — LUOFILM` },
      { name: "description", content: description },
      { property: "og:title", content: `Watch ${loaderData.title} — LUOFILM` },
      { property: "og:description", content: description },
      { property: "og:type", content: "video.other" },
      { name: "twitter:card", content: "summary_large_image" },
    ];
    if (loaderData.backdrop?.startsWith("https://")) {
      meta.push({ property: "og:image", content: loaderData.backdrop });
      meta.push({ name: "twitter:image", content: loaderData.backdrop });
    }
    return { meta };
  },
  component: WatchPage,
});

function WatchPage() {
  const { id } = Route.useParams();
  const { data: title } = useSuspenseQuery(titleQuery(id));

  const [season, setSeason] = useState(() => title.seasons[0]?.season ?? 0);
  const [episode, setEpisode] = useState(() => (title.seasons[0] ? 1 : 0));
  const [sourceIndex, setSourceIndex] = useState(0);
  const [theater, setTheater] = useState(false);
  const { canPlay } = useSubscription();

  const sources = useQuery({
    queryKey: ["sources", id, season, episode],
    queryFn: () => getSources({ data: { id, season, episode } }),
    staleTime: 60 * 1000,
  });

  // "You may also like" mirrors this title's own genres.
  const genres = useMemo(
    () =>
      (title.genre ?? "")
        .split(/[·,/|]/)
        .map((g) => g.trim())
        .filter(Boolean)
        .slice(0, 3),
    [title.genre],
  );

  const related = useQuery({
    queryKey: ["related", genres.length ? genres : [title.title]],
    queryFn: async () => {
      const terms = genres.length ? genres : [title.title];
      const pages = await Promise.all(terms.map((q) => searchTitles({ data: { q } })));
      const merged: (typeof pages)[number] = [];
      const max = Math.max(...pages.map((p) => p.length), 0);
      for (let i = 0; i < max; i++) {
        for (const page of pages) if (page[i]) merged.push(page[i]!);
      }
      const seen = new Set<string>();
      return merged.filter((item) =>
        seen.has(item.id) ? false : (seen.add(item.id), true),
      );
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    const list = sources.data ?? [];
    if (!list.length) return;
    // Start on the closest thing to 720p for a fast, reliable first play.
    let best = 0;
    list.forEach((source, index) => {
      if (Math.abs(source.resolution - 720) < Math.abs((list[best]?.resolution ?? 0) - 720)) {
        best = index;
      }
    });
    setSourceIndex(best);
  }, [sources.data]);


  const active = sources.data?.[sourceIndex];
  const episodeCount = useMemo(
    () => title.seasons.find((s) => s.season === season)?.episodes ?? 0,
    [title.seasons, season],
  );

  const subtitles = (active?.captions ?? []).map((c) => ({
    label: c.label,
    src: subtitleUrl(c.url),
  }));

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:pl-[var(--sidebar-w)]">
        <div className="relative h-14">
          <TopBar />
        </div>

        <main className="px-3 pb-28 sm:px-4 lg:px-8 lg:pb-16">
          <Link
            to="/"
            className="mt-2 inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Back home
          </Link>

          <div className={`mt-3 flex flex-col gap-6 ${theater ? "" : "lg:flex-row"}`}>
            <div className="min-w-0 flex-1">
              {sources.isPending ? (
                <div className="aspect-video w-full animate-pulse rounded-[1.25rem] bg-muted" />
              ) : active ? (
                <div className="relative overflow-hidden rounded-[1.25rem]">
                  {!canPlay && <SubscribeGate title={title.title} />}
                  <Player
                  src={canPlay ? streamUrl(active.url) : ""}
                  poster={title.backdrop ?? undefined}
                  title={title.title}
                  subtitles={subtitles}
                  fileQualities={(sources.data ?? []).map((source) => ({
                    id: source.id,
                    label: source.resolution ? `${source.resolution}p` : "Auto",
                    note: source.size,
                  }))}
                  activeQuality={active.id}
                  onQualityChange={(id) => {
                    const index = (sources.data ?? []).findIndex((s) => s.id === id);
                    if (index >= 0) setSourceIndex(index);
                  }}
                    theater={theater}
                    onTheater={() => setTheater((v) => !v)}
                  />
                </div>
              ) : (
                <div className="grid aspect-video w-full place-items-center rounded-[1.25rem] bg-card px-6 text-center text-sm text-muted-foreground">
                  No playable stream is available for this title right now.
                </div>
              )}

              <h1 className="mt-4 text-xl font-black tracking-tight text-foreground sm:text-2xl">
                {title.title}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
                {title.rating && (
                  <span className="flex items-center gap-1 text-foreground">
                    <Star className="size-3.5 fill-current text-vip" />
                    {title.rating}
                  </span>
                )}
                {[title.year, title.genre, title.duration, title.country, title.language]
                  .filter(Boolean)
                  .map((bit) => (
                    <span key={String(bit)}>· {bit}</span>
                  ))}
              </div>

              <TitleActions
                titleId={id}
                titleName={title.title}
                description={title.description}
                cast={title.cast}
                sources={sources.data ?? []}
                downloadName={
                  season > 0 ? `${title.title} S${season}E${episode}` : title.title
                }
              />



              {!!related.data?.length && (
                <Rail
                  title={
                    genres.length ? `You may also like · ${genres.join(" · ")}` : "You may also like"
                  }
                  items={related.data.filter((item) => item.id !== id).slice(0, 18)}
                />
              )}
            </div>

            {!!title.seasons.length && (
              <aside className="w-full shrink-0 lg:w-[320px]">
                <h2 className="text-sm font-bold uppercase tracking-wide text-foreground">
                  Episodes
                </h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {title.seasons.map((s) => (
                    <button
                      key={s.season}
                      onClick={() => {
                        setSeason(s.season);
                        setEpisode(1);
                      }}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition ${
                        s.season === season
                          ? "bg-brand text-brand-foreground ring-brand"
                          : "bg-card text-muted-foreground ring-border hover:text-foreground"
                      }`}
                    >
                      Season {s.season}
                    </button>
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-6 lg:grid-cols-5">
                  {Array.from({ length: episodeCount }, (_, i) => i + 1).map((ep) => (
                    <button
                      key={ep}
                      onClick={() => setEpisode(ep)}
                      className={`h-9 rounded text-xs font-semibold ring-1 transition ${
                        ep === episode
                          ? "bg-brand text-brand-foreground ring-brand"
                          : "bg-card text-muted-foreground ring-border hover:text-foreground"
                      }`}
                    >
                      {ep}
                    </button>
                  ))}
                </div>
              </aside>
            )}
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
