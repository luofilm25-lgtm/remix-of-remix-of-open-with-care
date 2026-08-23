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

