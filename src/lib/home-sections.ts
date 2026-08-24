/**
 * Curated home page sections, mirroring the MovieBox home layout.
 *
 * Two ways a rail gets filled:
 *  - `titles`: an explicit, ordered list of real titles. Each one is looked up
 *    in the catalog and the best-matching result is used, so the rail shows
 *    exactly those shows/movies with live posters, ratings and ids.
 *  - `keywords`: merged live searches, then filtered by the catalog's own
 *    genre / type / year metadata.
 */
import { searchCatalog, type CatalogItem } from "./moviebox";

export type HomeSection = {
  title: string;
  /** Explicit ordered titles (preferred — gives the exact real line-up). */
  titles?: string[];
  /** Search feeds merged into the rail. */
  keywords?: string[];
  /** Keep only items whose catalog genre matches. */
  genre?: RegExp;
  type?: "movie" | "series";
  /** Keep only items released on/after this year. */
  minYear?: number;
  ranked?: boolean;
};

export const HOME_SECTIONS: HomeSection[] = [
  {
    title: "Popular Series",
    titles: [
      "Reacher",
      "Lanterns",
      "Outer Banks",
      "Umthetho",
      "House of the Dragon",
      "Lioness",
      "My Life with the Walter Boys",
      "Our Sticky Love",
      "The Summer I Turned Pretty",
      "Wednesday",
    ],
    type: "series",
  },
  {
    title: "Popular Movie",
    titles: [
      "Spider-Man: Brand New Day",
      "Mutiny",
      "Toy Story 5",
      "Minions & Monsters",
      "The Last House",
      "Evil Dead Burn",
      "The Devil's Mouth",
      "Supergirl",
      "Man of War",
      "Kill Trip",
    ],
    type: "movie",
  },
  {
    title: "Most trending",
    titles: [
      "Lucifer",
      "Stranger Things",
      "Squid Game",
      "The Rookie",
      "Man on Fire",
      "The Boys",
      "XO, Kitty",
      "My Royal Nemesis",
      "The Summer I Turned Pretty",
      "Sex/Life",
      "Blood & Water",
      "The Lord of the Rings: The Rings of Power",
    ],
    ranked: true,
  },
  {
    title: "Bet+",
    titles: [
      "Sistas",
      "The Oval",
      "Zatima",
      "Divorced Sistas",
      "All the Queen's Men",
      "The Family Business",
      "Ruthless",
      "Bruh",
    ],
  },
  {
    title: "Action & Thriller",
    titles: [
      "Reacher",
      "Lucky",
      "The Day of the Jackal",
      "Ride or Die",
      "The Agency",
      "Citadel",
      "M.I.A.",
      "Prisoner",
    ],
  },
  {
    title: "Gangster",
    titles: [
      "Snowfall",
      "Peaky Blinders",
      "Power",
      "Tulsa King",
      "MobLand",
      "The Sopranos",
      "The Family Business",
      "Godfather of Harlem",
    ],
  },
  {
    title: "C-Drama",
    keywords: ["chinese drama", "c-drama", "wuxia", "chinese romance"],
    genre: /drama|romance|fantasy/i,
    type: "series",
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
    title: "Hot Short TV",
    keywords: ["short tv", "short drama", "mini series romance"],
  },
  {
    title: "Epic Fantasy",
    titles: [
      "Game of Thrones",
      "House of the Dragon",
      "The Lord of the Rings: The Rings of Power",
      "The Witcher",
      "The Pendragon Cycle",
      "The Wheel of Time",
      "Dune: Prophecy",
      "The Sandman",
    ],
  },
  {
    title: "Sitcom",
    titles: [
      "Friends",
      "The Big Bang Theory",
      "Malcolm in the Middle",
      "Modern Family",
      "Shameless",
      "Young Sheldon",
      "Seinfeld",
      "Two and a Half Men",
    ],
  },
  {
    title: "Teen Romance",
    titles: [
      "My Life with the Walter Boys",
      "Sterling Point",
      "The Shards",
      "The Map of Longing",
      "Elle",
      "Every Year After",
      "Off Campus",
      "Euphoria",
    ],
  },
  {
    title: "Superhero Series",
    titles: [
      "Lanterns",
      "Spider-Noir",
      "The Boys",
      "Invincible",
      "Peacemaker",
      "Batman",
      "Daredevil: Born Again",
      "Superman",
    ],
  },
  {
    title: "Must-watch Black Shows",
    titles: [
      "All the Queen's Men",
      "The Oval",
      "Ruthless",
      "All American",
      "Power Book III: Raising Kanan",
      "Diarra from Detroit",
      "The Chi",
      "Nemesis",
    ],
  },
  {
    title: "Romance",
    keywords: ["romance 2026", "romantic movie", "love story"],
    genre: /romance/i,
  },
  {
    title: "Teen Fantasy",
    titles: [
      "Avatar: The Last Airbender",
      "One Piece",
      "Stranger Things",
      "IT: Welcome to Derry",
      "Percy Jackson and the Olympians",
      "Wednesday",
      "A Wrinkle in Time",
      "Dark",
    ],
  },
  {
    title: "Anime [English Dubbed]",
    titles: [
      "One Piece",
      "Mushoku Tensei: Jobless Reincarnation",
      "Tomb Raider King",
      "Black Torch",
      "Bleach: Thousand-Year Blood War",
      "That Time I Got Reincarnated as a Slime",
      "Re: Zero - Starting Life in Another World",
      "Baki-Dou",
    ],
  },
  {
    title: "K-Drama",
    keywords: ["korean drama", "k-drama 2026", "korean romance"],
    genre: /drama|romance|comedy/i,
    type: "series",
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

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/\[[^\]]*\]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** Look up one real title and return the closest catalog match. */
async function lookupTitle(title: string): Promise<CatalogItem | null> {
  const results = await searchCatalog(title, 1).catch(() => [] as CatalogItem[]);
  const wanted = norm(title);
  const withPoster = results.filter((r) => !!r.poster);
  return (
    withPoster.find((r) => norm(r.title) === wanted) ??
    withPoster.find((r) => norm(r.title).startsWith(wanted) || wanted.startsWith(norm(r.title))) ??
    withPoster[0] ??
    null
  );
}

/** Fill a rail either from an explicit title list or from merged search feeds. */
export async function fetchSection(section: HomeSection): Promise<CatalogItem[]> {
  if (section.titles?.length) {
    const found = await Promise.all(section.titles.map(lookupTitle));
    return dedupe(found.filter((i): i is CatalogItem => !!i));
  }

  const batches = await Promise.all(
    (section.keywords ?? []).map((q) => searchCatalog(q, 1).catch(() => [] as CatalogItem[])),
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
