/**
 * Video delivery helpers.
 *
 * Media bytes are served STRAIGHT FROM the provider CDN — never through our
 * own origin. Proxying video would push every played/downloaded gigabyte
 * through the hosting edge (Vercel "Fast Origin Transfer"), which burns the
 * free allowance almost immediately. The proxy stays available only as a
 * last-resort fallback for hosts that block cross-origin playback, and for
 * tiny text payloads (subtitles, size probes).
 */

/** HLS manifests need hls.js everywhere except Safari. */
export function isHlsUrl(url: string) {
  return /\.m3u8(\?|$)/i.test(url);
}

/** Direct CDN playback URL (zero origin bandwidth). */
export function streamUrl(url: string) {
  return url;
}

/** Same media, but relayed through our origin. Fallback only. */
export function proxiedStreamUrl(url: string) {
  return `/api/public/stream?url=${encodeURIComponent(url)}`;
}

/** Route provider subtitles through our SRT→VTT proxy (a few KB only). */
export function subtitleUrl(url: string) {
  return `/api/public/subtitle?url=${encodeURIComponent(url)}`;
}

const slug = (text: string) =>
  text
    .replace(/[^\w\s.-]+/g, "")
    .trim()
    .replace(/\s+/g, ".")
    .slice(0, 80) || "luofilm";

/** Download a media file directly from the CDN (no origin bandwidth). */
export function mediaDownloadUrl(url: string, _filename: string) {
  return url;
}

/** Suggested download filename for the browser's `download` attribute. */
export function mediaDownloadName(filename: string) {
  return `${slug(filename)}.mp4`;
}

/** Force-download a subtitle (converted to .vtt) through our proxy. */
export function subtitleDownloadUrl(url: string, filename: string) {
  return `/api/public/subtitle?url=${encodeURIComponent(url)}&dl=${encodeURIComponent(`${slug(filename)}.vtt`)}`;
}

/** Metadata probe (file size/type) through our proxy — headers only. */
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

