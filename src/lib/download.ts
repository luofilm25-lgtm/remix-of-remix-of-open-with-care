/** Video delivery helpers. */

/** HLS manifests need hls.js everywhere except Safari. */
export function isHlsUrl(url: string) {
  return /\.m3u8(\?|$)/i.test(url);
}

/** Route provider CDN media through our own origin (CORS + referrer safe). */
export function streamUrl(url: string) {
  return `/api/public/stream?url=${encodeURIComponent(url)}`;
}

/** Route provider subtitles through our SRT→VTT proxy. */
export function subtitleUrl(url: string) {
  return `/api/public/subtitle?url=${encodeURIComponent(url)}`;
}

const slug = (text: string) =>
  text
    .replace(/[^\w\s.-]+/g, "")
    .trim()
    .replace(/\s+/g, ".")
    .slice(0, 80) || "luofilm";

/** Force-download a media file through our proxy. */
export function mediaDownloadUrl(url: string, filename: string) {
  return `/api/public/stream?url=${encodeURIComponent(url)}&dl=${encodeURIComponent(`${slug(filename)}.mp4`)}`;
}

/** Force-download a subtitle (converted to .vtt) through our proxy. */
export function subtitleDownloadUrl(url: string, filename: string) {
  return `/api/public/subtitle?url=${encodeURIComponent(url)}&dl=${encodeURIComponent(`${slug(filename)}.vtt`)}`;
}

/** Metadata probe (file size/type) through our proxy — no download. */
export function mediaProbeUrl(url: string) {
  return `/api/public/stream?url=${encodeURIComponent(url)}&probe=1`;
}

/** Human-readable byte size, e.g. "1.2 GB". */
export function formatBytes(bytes: number | null | undefined) {
  if (!bytes || bytes <= 0) return null;
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value >= 100 ? Math.round(value) : value.toFixed(1)} ${units[unit]}`;
}

