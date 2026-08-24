/**
 * Curated home page sections, mirroring the MovieBox home layout.
 * Each section is filled from live catalog searches (merged + de-duplicated),
 * so the rails always show whatever the API currently ranks best.
 */
import { searchTitles } from "./catalog.functions";
import type { CatalogItem } from "./moviebox";

export type HomeSection = {
  title: string;
  keywords: string[];
  type?: "movie" | "series";
  ranked?: boolean;
};

export const HOME_SECTIONS: HomeSection[] = [
  { title: "Popular Series", keywords: ["popular series 2026", "top series"], type: "series" },
  { title: "Popular Movie", keywords: ["popular movie 2026", "top movies"], type: "movie" },
  { title: "Most trending", keywords: ["trending 2026", "most popular", "new release 2026"], ranked: true },
  { title: "Coming Soon", keywords: ["coming soon 2026", "upcoming movie 2026"] },
  { title: "Action & Thriller", keywords: ["action thriller series", "thriller 2026"] },
  { title: "Action Movies", keywords: ["action movie 2026", "action"], type: "movie" },
  { title: "Horror Movies", keywords: ["horror movie 2026", "horror"], type: "movie" },
  { title: "Gangster", keywords: ["gangster", "mafia crime series"] },
  { title: "Epic Fantasy", keywords: ["fantasy series", "epic fantasy"], type: "series" },
  { title: "Superhero Series", keywords: ["superhero series", "marvel dc series"] },
  { title: "Sitcom", keywords: ["sitcom", "comedy series"], type: "series" },
  { title: "Teen Romance", keywords: ["teen romance", "high school romance"] },
  { title: "Romance", keywords: ["romance 2026", "romantic movie"] },
  { title: "C-Drama", keywords: ["chinese drama", "c-drama 2026"], type: "series" },
  { title: "K-Drama", keywords: ["korean drama", "k-drama 2026"], type: "series" },
  { title: "Teen Fantasy", keywords: ["teen fantasy", "young adult fantasy"] },
  { title: "Anime [English Dubbed]", keywords: ["anime english dubbed", "anime series"] },
  { title: "Must-watch Black Shows", keywords: ["bet series", "black series drama"] },
  { title: "Hot Short TV", keywords: ["short drama", "mini series"], type: "series" },
];

/** Merge several search feeds, interleaved so every keyword contributes near the top. */
export async function fetchSection(section: HomeSection): Promise<CatalogItem[]> {
  const batches = await Promise.all(
    section.keywords.map((q) => searchTitles({ data: { q, page: 1 } }).catch(() => [])),
  );
  const merged: CatalogItem[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < 20; i += 1) {
    for (const list of batches) {
      const item = list[i];
      if (!item || seen.has(item.id) || !item.poster) continue;
      if (section.type && item.type !== section.type) continue;
      seen.add(item.id);
      merged.push(item);
    }
  }
  return merged.slice(0, 24);
}
