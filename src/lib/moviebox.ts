import { base64ToBytes, bytesToBase64, hmacMd5, md5Hex } from "./md5";

const SECRET = "76iRl07s0xSN9jqmEWAt79EBJZulIQIsV64FZr2O";

const HOSTS = [
  "https://api6.aoneroom.com",
  "https://api5.aoneroom.com",
  "https://api4.aoneroom.com",
  "https://api4sg.aoneroom.com",
  "https://api3.aoneroom.com",
  "https://api6sg.aoneroom.com",
  "https://api.inmoviebox.com",
];

const RETRY_STATUS = new Set([403, 406, 407, 429, 500, 502, 503, 504]);

const encoder = new TextEncoder();
const isBrowser = typeof window !== "undefined" && typeof document !== "undefined";

const md5 = (data: string | Uint8Array) => md5Hex(data);

function sortedQuery(url: URL) {
  const keys = [...new Set([...url.searchParams.keys()])].sort();
  const parts: string[] = [];
  for (const key of keys) for (const value of url.searchParams.getAll(key)) parts.push(`${key}=${value}`);
  return parts.join("&");
}

function canonicalString(method: string, url: string, body: string | null, ts: number) {
  const parsed = new URL(url);
  const query = sortedQuery(parsed);
  const canonicalUrl = query ? `${parsed.pathname}?${query}` : parsed.pathname;
  const bodyBuf = body ? encoder.encode(body) : null;
  const bodyHash = bodyBuf ? md5(bodyBuf.subarray(0, 102_400)) : "";
  const bodyLength = bodyBuf ? String(bodyBuf.length) : "";
  return [
    method.toUpperCase(),
    "application/json",
    "application/json",
    bodyLength,
    String(ts),
    bodyHash,
    canonicalUrl,
  ].join("\n");
}

function signature(method: string, url: string, body: string | null, ts: number) {
  const padded = SECRET + "=".repeat((4 - (SECRET.length % 4)) % 4);
  const key = base64ToBytes(padded);
  const digest = bytesToBase64(hmacMd5(key, encoder.encode(canonicalString(method, url, body, ts))));
  return `${ts}|2|${digest}`;
}


function randomHex(len: number) {
  let out = "";
  for (let i = 0; i < len; i += 1) out += Math.floor(Math.random() * 16).toString(16);
  return out;
}

function pick<T>(list: readonly T[]) {
  return list[Math.floor(Math.random() * list.length)]!;
}

type Identity = { userAgent: string; clientInfo: string; ip: string };

let identity: Identity | null = null;
let runtimeToken: string | null = null;
let activeHost = 0;

function getIdentity(): Identity {
  if (identity) return identity;
  const android = pick([
    ["11", "RP1A.200720.011"],
    ["12", "S1B.220414.015"],
    ["13", "TQ2A.230405.003"],
  ] as const);
  const model = pick(["23078RKD5C", "2201117TY", "22101316G", "M2012K11AG"] as const);
  const versionCode = pick([50020042, 50020044, 50020046] as const);
  identity = {
    userAgent: `com.community.oneroom/${versionCode} (Linux; U; Android ${android[0]}; en_US; ${model}; Build/${android[1]}; Cronet/135.0.7012.3)`,
    clientInfo: JSON.stringify({
      package_name: "com.community.oneroom",
      version_name: "3.0.03.0529.03",
      version_code: versionCode,
      os: "android",
      os_version: android[0],
      install_ch: "ps",
      device_id: randomHex(32),
      install_store: "ps",
      gaid: `${randomHex(8)}-${randomHex(4)}-${randomHex(4)}-${randomHex(4)}-${randomHex(12)}`,
      brand: "Redmi",
      model,
      system_language: "en",
      net: "NETWORK_WIFI",
      region: "US",
      timezone: "Asia/Kolkata",
      sp_code: "40401",
      "X-Play-Mode": "2",
    }),
    ip: `${pick(["103.241", "49.36", "117.195", "122.162", "157.32"] as const)}.${
      1 + Math.floor(Math.random() * 253)
    }.${1 + Math.floor(Math.random() * 253)}`,
  };
  return identity;
}

let initPromise: Promise<void> | null = null;

async function ensureToken() {
  if (runtimeToken) return;
  if (!initPromise) {
    initPromise = rawRequest("GET", "/wefeed-mobile-bff/tab-operating?page=1&tabId=0&version=")
      .then(() => undefined)
      .catch(() => undefined)
      .finally(() => {
        initPromise = null;
      });
  }
  await initPromise;
}

async function request(method: "GET" | "POST", path: string, payload?: unknown): Promise<any> {
  await ensureToken();
  return rawRequest(method, path, payload);
}

async function rawRequest(method: "GET" | "POST", path: string, payload?: unknown): Promise<any> {
  const body = payload === undefined ? null : JSON.stringify(payload);
  const id = getIdentity();

  for (let i = 0; i < HOSTS.length; i += 1) {
    const idx = (activeHost + i) % HOSTS.length;
    const url = `${HOSTS[idx]}${path}`;
    const ts = Date.now();
    const reversed = [...String(ts)].reverse().join("");

    const headers: Record<string, string> = {
      accept: "application/json",
      "content-type": "application/json",
      "x-client-token": `${ts},${md5(reversed)}`,
      "x-tr-signature": signature(method, url, body, ts),
      "x-client-info": id.clientInfo,
      "x-client-status": "0",
    };
    // Browsers forbid setting these; only send them from a server runtime.
    if (!isBrowser) {
      headers["user-agent"] = id.userAgent;
      headers["x-forwarded-for"] = id.ip;
    }
    if (runtimeToken) headers["authorization"] = `Bearer ${runtimeToken}`;


    try {
      const res = await fetch(url, { method, headers, body: body ?? null });
      const xUser = res.headers.get("x-user");
      if (xUser) {
        try {
          const token = JSON.parse(xUser)?.token;
          if (typeof token === "string" && token) runtimeToken = token;
        } catch {
          /* ignore malformed header */
        }
      }
      if (res.status === 441 || res.status === 401) runtimeToken = null;
      if (RETRY_STATUS.has(res.status) || !res.ok) continue;
      activeHost = idx;
      const json = (await res.json()) as any;
      return json?.data ?? json;
    } catch {
      continue;
    }
  }
  throw new Error("Unable to reach the catalog right now. Please try again.");
}

export type CatalogItem = {
  id: string;
  title: string;
  type: "movie" | "series";
  year: string | null;
  poster: string | null;
  backdrop: string | null;
  rating: string | null;
  genre: string | null;
};

const cleanTitle = (raw: string) =>
  raw
    .replace(/\s*\[[^\]]*\]\s*$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();

export function toItem(subject: any): CatalogItem | null {
  if (!subject?.subjectId || !subject?.title) return null;
  return {
    id: String(subject.subjectId),
    title: cleanTitle(String(subject.title)),
    type: Number(subject.subjectType) === 2 ? "series" : "movie",
    year: subject.releaseDate ? String(subject.releaseDate).slice(0, 4) : null,
    poster: subject.cover?.url ?? null,
    backdrop: subject.stills?.url ?? subject.cover?.url ?? null,
    rating: subject.imdbRatingValue ? String(subject.imdbRatingValue) : null,
    genre: subject.genre ? String(subject.genre).split(",").slice(0, 3).join(" · ") : null,
  };
}

export async function fetchHome() {
  const data = await request("GET", "/wefeed-mobile-bff/tab-operating?page=1&tabId=0&version=");
  const items: any[] = Array.isArray(data?.items) ? data.items : [];

  const hero: CatalogItem[] = [];
  const rows: { title: string; items: CatalogItem[] }[] = [];
  const seen = new Set<string>();

  for (const block of items) {
    if (block?.banner?.banners) {
      for (const banner of block.banner.banners) {
        const item = toItem(banner.subject);
        if (item && banner.image?.url) {
          hero.push({ ...item, backdrop: banner.image.url });
        }
      }
      continue;
    }
    const subjects: CatalogItem[] = [];
    const push = (subject: any) => {
      const item = toItem(subject);
      if (item && !seen.has(item.id)) {
        seen.add(item.id);
        subjects.push(item);
      }
    };
    if (Array.isArray(block?.subjects)) block.subjects.forEach(push);
    if (Array.isArray(block?.groups)) {
      for (const group of block.groups) if (Array.isArray(group?.subjects)) group.subjects.forEach(push);
    }
    if (subjects.length >= 4) {
      rows.push({ title: String(block?.title || "Popular now"), items: subjects.slice(0, 18) });
    }
  }

  return { hero: hero.slice(0, 5), rows: rows.slice(0, 8) };
}

export async function searchCatalog(keyword: string, page = 1) {
  const data = await request("POST", "/wefeed-mobile-bff/subject-api/search/v2", {
    keyword,
    page,
    perPage: 20,
    subjectType: "All",
    tabId: "All",
  });
  const out: CatalogItem[] = [];
  const seen = new Set<string>();
  for (const result of data?.results ?? []) {
    for (const subject of result?.subjects ?? []) {
      const item = toItem(subject);
      if (item && !seen.has(item.id)) {
        seen.add(item.id);
        out.push(item);
      }
    }
  }
  return out;
}

export type CastMember = { name: string; character: string | null; avatar: string | null };

export type TitleDetails = CatalogItem & {
  description: string | null;
  duration: string | null;
  country: string | null;
  language: string | null;
  cast: CastMember[];
  seasons: { season: number; episodes: number }[];
};

export async function fetchDetails(subjectId: string): Promise<TitleDetails> {
  const data = await request("GET", `/wefeed-mobile-bff/subject-api/get?subjectId=${subjectId}`);
  const base = toItem(data);
  if (!base) throw new Error("Title not found");

  let seasons: { season: number; episodes: number }[] = [];
  if (base.type === "series") {
    try {
      const info = await request(
        "GET",
        `/wefeed-mobile-bff/subject-api/season-info?subjectId=${subjectId}`,
      );
      const list: any[] = Array.isArray(info?.seasons) ? info.seasons : Array.isArray(info) ? info : [];
      seasons = list
        .map((s) => ({
          season: Number(s?.se ?? s?.season ?? 0),
          episodes: Number(s?.maxEp ?? s?.allEp ?? s?.episodes ?? 0),
        }))
        .filter((s) => s.season > 0 && s.episodes > 0);
    } catch {
      seasons = [];
    }
    if (!seasons.length && Number(data?.seNum) > 0) {
      seasons = [{ season: 1, episodes: Number(data?.epNum) || 1 }];
    }
  }

  return {
    ...base,
    description: data?.description ? String(data.description) : null,
    duration: data?.duration ? String(data.duration) : null,
    country: data?.countryName ? String(data.countryName) : null,
    language: data?.language ? String(data.language) : null,
    cast: (data?.staffList ?? [])
      .filter((s: any) => typeof s?.name === "string" && s.name)
      .map((s: any) => ({
        name: String(s.name),
        character: s.character ? String(s.character) : null,
        avatar: s.avatarUrl ? String(s.avatarUrl) : null,
      }))
      .slice(0, 16),
    seasons,
  };
}

export type StreamSource = {
  id: string;
  url: string;
  resolution: number;
  codec: string | null;
  bytes: number;
  size: string | null;
  captions: { label: string; url: string }[];
};

/** Human file size — MB under 1 GB, GB above. */
const fmtBytes = (bytes: number) => {
  if (!bytes) return null;
  const mb = bytes / 1_048_576;
  return mb < 1024 ? `${mb.toFixed(mb < 10 ? 1 : 0)} MB` : `${(mb / 1024).toFixed(2)} GB`;
};

const toSource = (entry: any): StreamSource => ({
  id: String(entry.resourceId ?? entry.resourceLink),
  url: String(entry.resourceLink),
  resolution: Number(entry.resolution) || 0,
  codec: entry.codecName ? String(entry.codecName) : null,
  bytes: Number(entry.size) || 0,
  size: fmtBytes(Number(entry.size) || 0),
  captions: (entry.extCaptions ?? [])
    .filter((c: any) => typeof c?.url === "string" && c.url)
    .map((c: any) => ({ label: String(c.lanName ?? "Subtitle"), url: String(c.url) })),
});


export async function fetchSources(subjectId: string, season = 0, episode = 0) {
  const isEpisode = season > 0 && episode > 0;
  const range = isEpisode ? `&se=${season}&ep=${episode}` : "";
  const page = isEpisode ? Math.max(1, Math.ceil(episode / 20)) : 1;
  const base = `/wefeed-mobile-bff/subject-api/resource?subjectId=${subjectId}${range}&perPage=20`;

  const data = await request("GET", `${base}&page=${page}`);

  // The API answers with one resolution at a time; ask for each advertised one.
  const offered: number[] = Array.isArray(data?.collectionResolutions)
    ? data.collectionResolutions.map((r: any) => Number(r?.resolution)).filter((r: number) => r > 0)
    : [];
  const baseResolution = Number(data?.resolution) || 0;
  const extra = [...new Set(offered)].filter((r) => r !== baseResolution);

  const lists: any[][] = [Array.isArray(data?.list) ? data.list : []];
  const others = await Promise.all(
    extra.map((resolution) =>
      request("GET", `${base}&page=${page}&resolution=${resolution}`)
        .then((res: any) => (Array.isArray(res?.list) ? res.list : []))
        .catch(() => [] as any[]),
    ),
  );
  lists.push(...others);

  const matchesEpisode = (entry: any) =>
    !isEpisode || (Number(entry?.se) === season && Number(entry?.ep) === episode);

  // One entry per resolution: prefer H.264 over HEVC, then the largest file.
  const best = new Map<number, StreamSource>();
  for (const list of lists) {
    for (const entry of list) {
      if (typeof entry?.resourceLink !== "string" || !entry.resourceLink) continue;
      if (!matchesEpisode(entry)) continue;
      const source = toSource(entry);
      const current = best.get(source.resolution);
      if (!current) {
        best.set(source.resolution, source);
        continue;
      }
      const rank = (s: StreamSource) => (s.codec && /hevc|h265/i.test(s.codec) ? 1 : 0);
      const better =
        rank(source) < rank(current) ||
        (rank(source) === rank(current) && source.bytes > current.bytes);
      if (better) best.set(source.resolution, source);
    }
  }

  const sources = [...best.values()].sort((a, b) => b.resolution - a.resolution);


  if (sources.length && !sources[0]!.captions.length) {
    try {
      const captions = await request(
        "GET",
        `/wefeed-mobile-bff/subject-api/get-ext-captions?subjectId=${subjectId}&resourceId=${sources[0]!.id}`,
      );
      const parsed = (captions?.extCaptions ?? [])
        .filter((c: any) => typeof c?.url === "string" && c.url)
        .map((c: any) => ({ label: String(c.lanName ?? "Subtitle"), url: String(c.url) }));
      for (const source of sources) if (!source.captions.length) source.captions = parsed;
    } catch {
      /* subtitles are optional */
    }
  }

  return sources;
}

/** Placeholder used when the upstream catalog is unreachable during render. */
export function unavailableTitle(id: string): TitleDetails & { unavailable: true } {
  return {
    id,
    title: "Loading…",
    type: "movie",
    year: null,
    poster: null,
    backdrop: null,
    rating: null,
    genre: null,
    description: null,
    duration: null,
    country: null,
    language: null,
    cast: [],
    seasons: [],
    unavailable: true,
  };
}
