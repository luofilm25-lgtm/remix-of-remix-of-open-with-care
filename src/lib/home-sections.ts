/**
 * Curated home page sections, mirroring the MovieBox home layout.
 *
 * The catalog has no public genre-browse endpoint, so each section is built
 * from live searches and then filtered by the catalog's own genre / type
 * metadata. That keeps the rails full of real genre titles instead of titles
 * that merely contain the keyword.
 */
import { searchCatalog, type CatalogItem } from "./moviebox";

export type HomeSection = {
  title: string;
  /** Search feeds merged into the rail. */
  keywords: string[];
  /** Keep only items whose catalog genre matches. */
  genre?: RegExp;
  type?: "movie" | "series";
  /** Keep only items released on/after this year. */
  minYear?: number;
  ranked?: boolean;
};

export const HOME_SECTIONS: HomeSection[] = [
  {
    title: "Most trending",
    keywords: ["trending 2026", "popular 2026", "new release 2026", "best movies 2026"],
    minYear: 2025,
    ranked: true,
  },
  {
    title: "Popular Series",
    keywords: ["series 2026", "new series", "drama series 2026"],
    type: "series",
    minYear: 2025,
  },
  {
    title: "Popular Movie",
    keywords: ["movie 2026", "new movie", "blockbuster 2026"],
    type: "movie",
    minYear: 2025,
  },
  {
    title: "Action & Thriller",
    keywords: ["action", "thriller", "action 2026"],
    genre: /action|thriller/i,
  },
  {
    title: "Action Movies",
    keywords: ["action movie", "action 2026", "fight"],
    genre: /action/i,
    type: "movie",
  },
  {
    title: "Horror Movies",
    keywords: ["horror", "horror 2026", "scary"],
    genre: /horror/i,
    type: "movie",
  },
  {
    title: "Gangster",
    keywords: ["Peaky Blinders", "The Sopranos", "Power", "Snowfall", "Tulsa King", "mafia"],
    genre: /crime|drama|action/i,
  },
  {
    title: "Epic Fantasy",
    keywords: ["Game of Thrones", "House of the Dragon", "The Witcher", "The Wheel of Time", "fantasy series"],
    genre: /fantasy|adventure|sci-fi/i,
  },
  {
    title: "Superhero Series",
    keywords: ["The Boys", "Invincible", "Peacemaker", "Daredevil", "Superman", "Batman"],
    genre: /action|sci-fi|adventure|animation/i,
  },
  {
    title: "Sitcom",
    keywords: ["Friends", "The Big Bang Theory", "Modern Family", "Seinfeld", "Young Sheldon", "sitcom"],
    genre: /comedy/i,
  },
  {
    title: "Teen Romance",
    keywords: ["teen romance", "high school romance", "young love"],
    genre: /romance/i,
  },
  {
    title: "Romance",
    keywords: ["romance 2026", "romantic movie", "love story"],
    genre: /romance/i,
  },
  {
    title: "C-Drama",
    keywords: ["chinese drama", "c-drama", "wuxia", "chinese romance"],
    genre: /drama|romance|fantasy/i,
    type: "series",
  },
  {
    title: "K-Drama",
    keywords: ["korean drama", "k-drama 2026", "korean romance"],
    genre: /drama|romance|comedy/i,
    type: "series",
  },
  {
    title: "Teen Fantasy",
    keywords: ["Wednesday", "Stranger Things", "Percy Jackson", "One Piece", "Avatar The Last Airbender"],
    genre: /fantasy|adventure|sci-fi|mystery|animation|anime/i,
  },
  {
    title: "Anime [English Dubbed]",
    keywords: ["anime english", "anime 2026", "anime series"],
    genre: /anime|animation/i,
  },
  {
    title: "Comedy",
    keywords: ["comedy 2026", "comedy movie", "funny"],
    genre: /comedy/i,
  },
  {
    title: "Sci-Fi & Adventure",
    keywords: ["sci-fi", "adventure 2026", "space"],
    genre: /sci-fi|adventure/i,
  },
];

const dedupe = (items: CatalogItem[]) => {
  const seen = new Set<string>();
  return items.filter((i) => (seen.has(i.id) ? false : (seen.add(i.id), true)));
};

/** Merge several search feeds, interleaved so every keyword contributes near the top. */
export async function fetchSection(section: HomeSection): Promise<CatalogItem[]> {
  const batches = await Promise.all(
    section.keywords.map((q) => searchCatalog(q, 1).catch(() => [] as CatalogItem[])),
  );

  const keep = (item: CatalogItem) =>
    !!item.poster &&
    (!section.type || item.type === section.type) &&
    (!section.genre || section.genre.test(item.genre ?? "")) &&
    (!section.minYear || Number(item.year) >= section.minYear);

  const filtered = batches.map((list) => list.filter(keep));

  const merged: CatalogItem[] = [];
  for (let i = 0; i < 20; i += 1) {
    for (const list of filtered) if (list[i]) merged.push(list[i]!);
  }
  return dedupe(merged).slice(0, 24);
}
