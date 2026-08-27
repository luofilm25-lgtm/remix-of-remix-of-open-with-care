import { useEffect, useState } from "react";
import { X } from "lucide-react";
import {
  formatBytes,
  mediaDownloadName,
  mediaDownloadUrl,
  mediaProbeUrl,
  subtitleDownloadUrl,
} from "@/lib/download";
import { useSubscription } from "@/hooks/useSubscription";

type StreamSource = {
  id: string;
  url: string;
  resolution: number;
  codec: string | null;
  size: string | null;
  captions: { label: string; url: string }[];
};

type Props = {
  open: boolean;
  onClose: () => void;
  sources: StreamSource[];
  baseName: string;
};

export function DownloadDialog({ open, onClose, sources, baseName }: Props) {
  const { subscribed, requireSubscription } = useSubscription();
  const [probedSizes, setProbedSizes] = useState<Record<string, string | null>>({});

  // Sources without a size (e.g. admin-uploaded Luo/Luganda media) get a
  // real file size probed through the proxy as soon as the dialog opens.
  useEffect(() => {
    if (!open) return;
    for (const source of sources) {
      if (source.size || probedSizes[source.id] !== undefined) continue;
      setProbedSizes((prev) => ({ ...prev, [source.id]: null }));
      // Ask the CDN directly first (no origin bandwidth); only fall back to
      // our proxy for hosts that block cross-origin HEAD requests.
      const direct = fetch(source.url, { method: "HEAD" })
        .then((r) => (r.ok ? Number(r.headers.get("content-length")) || null : null))
        .catch(() => null);
      direct
        .then((size) =>
          size
            ? size
            : fetch(mediaProbeUrl(source.url))
                .then((r) => (r.ok ? r.json() : null))
                .then((d) => d?.size ?? null)
                .catch(() => null),
        )
        .then((size) => {
          const label = formatBytes(size);
          if (label) setProbedSizes((prev) => ({ ...prev, [source.id]: label }));
        })
        .catch(() => undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, sources]);

  const guard = (e: React.MouseEvent) => {
    if (subscribed) return;
    e.preventDefault();
    onClose();
    requireSubscription();
  };

  if (!open) return null;

  // One tile per resolution, lowest → highest, like the reference layout.
  const byResolution = new Map<number, StreamSource>();
  for (const source of sources) if (!byResolution.has(source.resolution)) byResolution.set(source.resolution, source);
  const videos = [...byResolution.values()].sort((a, b) => a.resolution - b.resolution);

  const seenCaption = new Set<string>();
  const captions = sources
    .flatMap((s) => s.captions)
    .filter((c) => (seenCaption.has(c.label) ? false : (seenCaption.add(c.label), true)));

  const tile =
    "flex flex-col items-center justify-center gap-0.5 rounded-lg bg-muted/60 px-2 py-3 text-center transition hover:bg-muted";

  return (
    <div className="fixed inset-0 z-[70] grid place-items-end sm:place-items-center bg-black/70 p-0 sm:p-4">
      <button aria-label="Close" className="absolute inset-0 cursor-default" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-t-2xl border border-border bg-card shadow-2xl sm:rounded-2xl">
        <div className="flex items-start justify-between px-5 pb-2 pt-4">
          <div>
            <h3 className="text-base font-bold text-foreground">Download options</h3>
            {!subscribed && (
              <p className="mt-0.5 text-[11px] text-vip">Membership required to download</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close download options"
            className="rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="max-h-[65vh] overflow-y-auto px-5 pb-5">
          <p className="text-sm font-semibold text-foreground">Video file</p>
          {videos.length ? (
            <div className="mt-2 grid grid-cols-3 gap-3">
              {videos.map((source) => (
                <a
                  key={source.id}
                  href={mediaDownloadUrl(source.url, `${baseName}.${source.resolution || "auto"}p`)}
                  download={mediaDownloadName(`${baseName}.${source.resolution || "auto"}p`)}
                  onClick={guard}
                  className={tile}
                >
                  <span className="text-sm font-bold text-foreground">
                    {source.resolution ? `${source.resolution}P` : "AUTO"}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {source.size ?? probedSizes[source.id] ?? "…"}
                  </span>
                </a>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">No downloadable file available.</p>
          )}

          <p className="mt-5 text-sm font-semibold text-foreground">Subtitle file</p>
          {captions.length ? (
            <div className="mt-2 grid grid-cols-3 gap-3">
              {captions.map((caption) => (
                <a
                  key={caption.label + caption.url}
                  href={subtitleDownloadUrl(caption.url, `${baseName}.${caption.label}`)}
                  download
                  onClick={guard}
                  className={`${tile} text-sm font-semibold text-foreground`}
                >
                  <span className="truncate">{caption.label}</span>
                </a>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">No subtitles for this title.</p>
          )}
        </div>
      </div>
    </div>
  );
}
