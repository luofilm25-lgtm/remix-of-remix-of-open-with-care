import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getHome = createServerFn({ method: "GET" }).handler(async () => {
  const { fetchHome } = await import("./moviebox.server");
  return fetchHome();
});

export const searchTitles = createServerFn({ method: "GET" })
  .inputValidator((data) =>
    z.object({ q: z.string().min(1), page: z.number().int().min(1).default(1) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { searchCatalog } = await import("./moviebox.server");
    return searchCatalog(data.q, data.page);
  });


export const getTitle = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ id: z.string().min(1) }).parse(data))
  .handler(async ({ data }) => {
    const { fetchDetails } = await import("./moviebox.server");
    return fetchDetails(data.id);
  });

export const getSources = createServerFn({ method: "GET" })
  .inputValidator((data) =>
    z.object({ id: z.string().min(1), season: z.number().default(0), episode: z.number().default(0) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { fetchSources } = await import("./moviebox.server");
    return fetchSources(data.id, data.season, data.episode);
  });
