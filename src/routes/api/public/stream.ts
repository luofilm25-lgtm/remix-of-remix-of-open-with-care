import { createFileRoute } from "@tanstack/react-router";

const ALLOWED_HOSTS = [".hakunaymatata.com", ".aoneroom.com", ".inmoviebox.com", ".valiw.hakunaymatata.com"];

export const Route = createFileRoute("/api/public/stream")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const params = new URL(request.url).searchParams;
        const target = params.get("url");
        const filename = params.get("dl");
        if (!target) return new Response("Missing url", { status: 400 });

        let parsed: URL;
        try {
          parsed = new URL(target);
        } catch {
          return new Response("Invalid url", { status: 400 });
        }
        if (parsed.protocol !== "https:" || !ALLOWED_HOSTS.some((h) => parsed.hostname.endsWith(h))) {
          return new Response("Host not allowed", { status: 403 });
        }

        const range = request.headers.get("range");
        const upstream = await fetch(parsed.toString(), {
          headers: range ? { range } : {},
        });

        const headers = new Headers();
        for (const key of ["content-type", "content-length", "content-range", "accept-ranges", "etag"]) {
          const value = upstream.headers.get(key);
          if (value) headers.set(key, value);
        }
        headers.set("cache-control", "public, max-age=3600");
        headers.set("access-control-allow-origin", "*");
        if (filename) {
          const safe = filename.replace(/[^\w.\- ]+/g, "_").slice(0, 120);
          headers.set("content-disposition", `attachment; filename="${safe}"`);
        }

        return new Response(upstream.body, { status: upstream.status, headers });
      },
    },
  },
});
