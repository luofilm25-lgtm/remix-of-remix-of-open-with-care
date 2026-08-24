import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useQueries, useSuspenseQuery } from "@tanstack/react-query";
import { Play } from "lucide-react";
import { Sidebar } from "@/components/youku/Sidebar";
import { TopBar } from "@/components/youku/TopBar";
import { MobileNav } from "@/components/youku/MobileNav";
import { Rail } from "@/components/youku/Rail";
import { VjRail } from "@/components/youku/VjRail";
import { isAdultItem } from "@/lib/categories";
import { getHome } from "@/lib/catalog.functions";
import { HOME_SECTIONS, fetchSection } from "@/lib/home-sections";

const homeQuery = queryOptions({
  queryKey: ["home"],
  queryFn: () => getHome(),
  staleTime: 5 * 60 * 1000,
});




export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LUOFILM — Stream Movies and Series in HD" },
      {
        name: "description",
        content:
          "Browse thousands of movies and TV series and watch them instantly in the built-in LUOFILM player — subtitles, episodes and quality switching included.",
      },
      { property: "og:title", content: "LUOFILM — Stream Movies and Series in HD" },
      {
        property: "og:description",
        content: "Browse and stream movies and series instantly in the built-in LUOFILM player.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  // Never let a flaky upstream turn SSR into a 500 — the shell renders either way.
  loader: ({ context }) => context.queryClient.ensureQueryData(homeQuery).catch(() => undefined),
  component: HomePage,
});

function HomePage() {
  const { data, refetch } = useSuspenseQuery(homeQuery);
  const slides = data.hero;
  const [index, setIndex] = useState(0);

  // If the server render came back empty (upstream unreachable from the host),
  // retry straight from the browser so the page still fills in.
  const degraded = (data as { degraded?: boolean }).degraded === true || slides.length === 0;
  useEffect(() => {
    if (!degraded) return;
    const t = setTimeout(() => void refetch(), 300);
    return () => clearTimeout(t);
  }, [degraded, refetch]);

  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 6000);
    return () => clearInterval(t);
  }, [slides.length]);


  const slide = slides[Math.min(index, Math.max(slides.length - 1, 0))];
  // Row titles arrive with emoji from upstream; strip them for a clean typographic look.
  const cleanTitle = (t: string) =>
    t.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{2B00}-\u{2BFF}]/gu, "").trim();
  const clean = <T extends { title: string; genre?: string | null }>(items: T[]) =>
    items.filter((i) => !isAdultItem(i));
  const liveTrending = useQuery(trendingQuery);
  const trending = clean((liveTrending.data?.length ? liveTrending.data : data.rows[0]?.items) ?? []);

  const rows = data.rows.slice(1).filter((r) => !/trending/i.test(r.title));

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:pl-[var(--sidebar-w)]">
        <div className="relative">
          <TopBar />

          {!slide && (
            <div className="pl-3 pt-16 sm:pl-4 lg:pl-8">
              <VjRail />
            </div>
          )}

          {slide && (
            <section className="relative h-[300px] w-full overflow-hidden sm:h-[400px] lg:h-[460px]">
              {slide.backdrop ? (
                <img
                  key={slide.backdrop}
                  src={slide.backdrop}
                  alt={slide.title}
                  className="size-full animate-in fade-in object-cover duration-700"
                />
              ) : (
                <div className="size-full bg-card" />
              )}
              <div
                className="absolute inset-0"
                style={{ backgroundImage: "var(--gradient-hero-fade)" }}
              />
              <div
                className="absolute inset-0"
                style={{ backgroundImage: "var(--gradient-hero-bottom)" }}
              />
              <div className="absolute inset-y-0 left-0 flex max-w-xl flex-col justify-end gap-2 px-3 pb-20 pt-10 lg:justify-center lg:gap-3 lg:px-8 lg:pb-0">
                <h1 className="text-2xl font-black tracking-widest text-foreground sm:text-3xl lg:text-4xl">
                  {slide.title}
                </h1>
                <Link
                  to="/watch/$id"
                  params={{ id: slide.id }}
                  className="mt-1 flex w-[132px] items-center justify-center gap-2 rounded bg-foreground/20 py-3 text-base font-semibold text-foreground backdrop-blur-md transition-colors hover:bg-foreground/30"
                >
                  <Play className="size-5 fill-current" />
                  Play
                </Link>
                <p className="max-w-md truncate text-[11px] text-foreground/85">
                  {[slide.year, slide.genre, slide.rating ? `IMDb ${slide.rating}` : null]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>

              <div className="absolute inset-x-0 bottom-12 z-20 pl-3 sm:pl-4 lg:bottom-16 lg:pl-8">
                <VjRail />
              </div>

              {slides.length > 1 && (
                <div className="absolute bottom-20 right-5 z-10 flex gap-2 lg:bottom-20 lg:right-8">
                  {slides.map((s, i) => (
                    <button
                      key={s.id}
                      type="button"
                      aria-label={`Show slide ${i + 1}`}
                      onClick={() => setIndex(i)}
                      className={`h-1.5 rounded-full transition-all ${
                        i === index ? "w-6 bg-brand" : "w-2 bg-foreground/40"
                      }`}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {!!trending.length && (
            <div className={`relative z-10 pl-3 sm:pl-4 lg:pl-8 ${slide ? "-mt-8 lg:-mt-14" : "mt-4"}`}>
              <Rail title="Trending now" items={trending} ranked />
            </div>
          )}

        </div>

        <main className="pb-28 pl-3 sm:pl-4 lg:pb-16 lg:pl-8">
          {rows.map((row) => (
            <Rail key={row.title} title={cleanTitle(row.title)} items={clean(row.items)} />
          ))}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
